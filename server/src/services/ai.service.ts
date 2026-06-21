/**
 * AI 生成领域服务
 * - 每日免费生图次数限额（Redis 计数，每日 0 点自然过期）
 * - 任务落库 + 调用外部文/图生图接口（占位实现）
 */
import { query, queryOne, execute } from '../db.js'
import { getRedis, CacheKey } from '../redis.js'
import { persistRemoteImage, persistDataUrl } from './oss.service.js'
import { resolvePlatformConfig, renderPrompt, PROVIDER_DEFAULT_BASE, type AiPlatform, type AiPlatformConfig, type AiProvider } from './aiConfig.service.js'

export type AiTaskType = 'text2img' | 'img2img' | 'remix' | 'style'

/** wan2.7-image-pro 多图参考上限（官方文档：0–9 张） */
export const MAX_REF_IMAGES = 9

export interface AiTask {
  id: number
  user_id: number
  type: AiTaskType
  prompt: string | null
  ref_image: string | null
  /** 解析后的参考图 URL 列表（listTasks 附加） */
  ref_images?: string[]
  result_urls: string[] | null
  status: 'pending' | 'running' | 'success' | 'failed'
  error: string | null
  created_at: string
  finished_at: string | null
}

/** 当天剩余免费次数 */
export async function getRemainingQuota(userId: number, dailyLimit: number): Promise<number> {
  if (isUnlimitedQuota(dailyLimit)) return UNLIMITED_AI_QUOTA
  const used = Number((await getRedis().get(quotaKey(userId))) || 0)
  return Math.max(0, dailyLimit - used)
}

/**
 * 计算用户当日免费额度：
 * 注册 7 天内为新用户每日 5 次；之后每日 2 次。
 * 若 user.ai_quota_daily 被后台手动调高，取较大值。
 */
const NEW_USER_DAYS = 7
const NEW_USER_DAILY = 5
const RETURNING_DAILY = 2
/** 后台 ai_quota_daily ≥ 此值视为无限额度（测试账号等） */
export const UNLIMITED_AI_QUOTA = 999_999

export function isUnlimitedQuota(dailyLimit: number): boolean {
  return dailyLimit >= UNLIMITED_AI_QUOTA
}

export function computeDailyLimit(createdAt: string | Date | null, override?: number): number {
  if (override != null && override >= UNLIMITED_AI_QUOTA) return UNLIMITED_AI_QUOTA
  let base = RETURNING_DAILY
  if (createdAt) {
    const ts = new Date(createdAt).getTime()
    if (Date.now() - ts < NEW_USER_DAYS * 24 * 3600 * 1000) base = NEW_USER_DAILY
  }
  return Math.max(base, override ?? 0)
}

/** 邀请奖励：给用户额外增加今日额度（通过减少 used 计数实现）。
 *  防刷：每人每天最多发放 BONUS_DAILY_CAP 次额度，超出忽略。
 *  @returns 实际发放是否成功 */
const BONUS_DAILY_CAP = 5
export async function grantBonusQuota(userId: number, bonus: number): Promise<boolean> {
  const redis = getRedis()
  // 每日发放计数守卫，避免重复点击/伪造分享无限刷额度
  const guardKey = `${CacheKey.AI_QUOTA}bonus:${new Date().toISOString().slice(0, 10)}:${userId}`
  const granted = await redis.incr(guardKey)
  if (granted === 1) await redis.expire(guardKey, secondsUntilMidnight())
  if (granted > BONUS_DAILY_CAP) {
    await redis.decr(guardKey)
    return false
  }
  const key = quotaKey(userId)
  const used = Number((await redis.get(key)) || 0)
  const next = Math.max(0, used - bonus)
  await redis.set(key, String(next), 'EX', secondsUntilMidnight())
  return true
}

function quotaKey(userId: number): string {
  const today = new Date().toISOString().slice(0, 10)
  return `${CacheKey.AI_QUOTA}${today}:${userId}`
}

function secondsUntilMidnight(): number {
  const now = new Date()
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  return Math.ceil((end.getTime() - now.getTime()) / 1000)
}

/** 消耗一次配额（原子自增 + 首次设置当日过期） */
async function consumeQuota(userId: number, dailyLimit: number): Promise<void> {
  if (isUnlimitedQuota(dailyLimit)) return
  const redis = getRedis()
  const key = quotaKey(userId)
  const used = await redis.incr(key)
  if (used === 1) await redis.expire(key, secondsUntilMidnight())
  if (used > dailyLimit) {
    await redis.decr(key)
    throw Object.assign(new Error('今日免费生图次数已用完'), { status: 429 })
  }
}

/** 退还一次配额（生成失败时调用，避免白扣次数） */
async function refundQuota(userId: number): Promise<void> {
  const redis = getRedis()
  const key = quotaKey(userId)
  const used = Number((await redis.get(key)) || 0)
  if (used > 0) await redis.set(key, String(used - 1), 'EX', secondsUntilMidnight())
}

export interface CreateTaskInput {
  type: AiTaskType
  prompt?: string
  /** @deprecated 单图兼容，请用 refImages */
  refImage?: string
  /** 参考图 URL / dataURL，最多 9 张（wan2.7-image-pro） */
  refImages?: string[]
  /** 生成平台：决定使用哪套模型/提示词配置（默认 default） */
  platform?: AiPlatform
}

/** 合并 refImage + refImages，去重并截断至上限 */
export function normalizeRefImages(input: Pick<CreateTaskInput, 'refImage' | 'refImages'>): string[] {
  const merged: string[] = []
  const push = (u?: string) => {
    const t = (u || '').trim()
    if (t && !merged.includes(t)) merged.push(t)
  }
  push(input.refImage)
  for (const u of input.refImages || []) push(u)
  return merged.slice(0, MAX_REF_IMAGES)
}

async function prepareRefImages(input: CreateTaskInput): Promise<string[]> {
  const out: string[] = []
  for (const src of normalizeRefImages(input)) {
    if (src.startsWith('data:')) {
      const url = await persistDataUrl(src, 'ref').catch(() => '')
      if (url) out.push(url)
    } else {
      out.push(src)
    }
  }
  return out
}

function refImagesOf(input: CreateTaskInput): string[] {
  return input.refImages?.length ? input.refImages : (input.refImage ? [input.refImage] : [])
}

function refDbValue(refs: string[]): string | null {
  if (!refs.length) return null
  if (refs.length === 1) return refs[0]
  const json = JSON.stringify(refs)
  return json.length <= 512 ? json : refs[0]
}

/** 创建并执行 AI 任务 */
export async function createTask(userId: number, dailyLimit: number, input: CreateTaskInput): Promise<AiTask> {
  await consumeQuota(userId, dailyLimit)

  const refImages = await prepareRefImages(input)
  input.refImages = refImages
  input.refImage = refImages[0]

  const r = await execute(
    `INSERT INTO ai_task (user_id, type, prompt, ref_image, status) VALUES (?,?,?,?, 'running')`,
    [userId, input.type, input.prompt ?? null, refDbValue(refImages)],
  )
  const taskId = r.insertId

  try {
    const rawUrls = await invokeProvider(input)
    // 结果可能是 http 临时 URL 或 data:base64（OpenAI/Gemini 出图为 base64）。
    // 统一转存到 OSS 长期保存：http→拉取转存，data→解码转存；未配置 OSS 时退回原值。
    const urls = (await Promise.all(rawUrls.map(persistImage))).filter(Boolean)
    if (!urls.length) throw new Error('AI 生成结果为空')
    await execute(
      `UPDATE ai_task SET status = 'success', result_urls = ?, finished_at = NOW() WHERE id = ?`,
      [JSON.stringify(urls), taskId],
    )
  } catch (err: any) {
    // 生成失败：退还本次配额，避免用户白扣次数
    await refundQuota(userId).catch(() => {})
    await execute(
      `UPDATE ai_task SET status = 'failed', error = ?, finished_at = NOW() WHERE id = ?`,
      [String(err?.message || 'AI 生成失败').slice(0, 200), taskId],
    )
  }

  const task = await queryOne<AiTask>('SELECT * FROM ai_task WHERE id = ?', [taskId])
  return task!
}

/**
 * 调用外部文/图生图接口。
 * 优先用 KIE（api.kie.ai）nano-banana 异步任务流：createTask → 轮询 recordInfo。
 * 未配置 AI_IMAGE_API_URL 时返回占位图，方便前端联调。
 * 模型/提示词模板按平台从 app_config(ai_generation) 解析（可后台配置）。
 */
/**
 * 调用外部文/图生图接口。按 provider 路由到对应实现（后台「AI 配置」可切换）。
 * 模型名一律来自配置（不在代码写死），保证可随时切到各家最新模型。
 * 任一 provider 失败/未出图都回退占位图，保证前端可联调、不阻断业务。
 */
async function invokeProvider(input: CreateTaskInput): Promise<string[]> {
  const aiCfg = await resolvePlatformConfig(input.platform ?? 'default')
  try {
    const urls = await generateImages(aiCfg, input)
    if (urls.length) return urls
  } catch (err: any) {
    console.warn(`[AI] provider=${aiCfg.provider} 生成失败: ${err?.message || err}`)
  }
  return [placeholder(input.prompt)]
}

/** provider 对应的服务器环境变量密钥（后台未填密钥时回退） */
function providerEnvKey(provider: AiProvider): string | undefined {
  switch (provider) {
    case 'openai': return process.env.OPENAI_API_KEY
    case 'nanobanana': return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    case 'doubao': return process.env.ARK_API_KEY
    case 'dashscope': return process.env.DASHSCOPE_API_KEY
    default: return process.env.AI_IMAGE_API_KEY
  }
}

/**
 * 按 provider 生成图片，返回图片地址数组（http 或 data:base64），空数组=失败/未出图。
 * 供正式生图与后台「测试」复用。
 */
async function generateImages(aiCfg: AiPlatformConfig, input: CreateTaskInput): Promise<string[]> {
  const provider = aiCfg.provider
  const key = aiCfg.apiKey || providerEnvKey(provider) || ''
  const base = aiCfg.apiBaseUrl || PROVIDER_DEFAULT_BASE[provider] || ''
  switch (provider) {
    case 'openai':
      return key ? invokeOpenAI(base, key, input, aiCfg) : []
    case 'nanobanana':
      return key ? invokeGemini(base, key, input, aiCfg) : []
    case 'doubao':
      return key ? invokeDoubao(base, key, input, aiCfg) : []
    case 'dashscope': {
      const dk = aiCfg.apiKey || process.env.DASHSCOPE_API_KEY
      if (!dk) return []
      const urls = await invokeDashScopeImage(dk, input, aiCfg)
      if (urls.length) return urls
      // 万相失败 → 若另配了通用/KIE 接口则回退
      return invokeConfiguredApi(aiCfg.apiBaseUrl || process.env.AI_IMAGE_API_URL, aiCfg.apiKey || process.env.AI_IMAGE_API_KEY, input, aiCfg)
    }
    case 'kie':
    case 'generic':
    default: {
      const apiUrl = aiCfg.apiBaseUrl || process.env.AI_IMAGE_API_URL
      const apiKey = aiCfg.apiKey || process.env.AI_IMAGE_API_KEY
      return invokeConfiguredApi(apiUrl, apiKey, input, aiCfg)
    }
  }
}

/** 转存单张结果到 OSS：http→拉取转存，data:base64→解码转存；未配置 OSS 时退回原值 */
async function persistImage(u: string): Promise<string> {
  if (!u) return ''
  if (u.startsWith('data:')) {
    const saved = await persistDataUrl(u, 'ai')
    return saved || u
  }
  return persistRemoteImage(u, 'ai')
}

/** 安全解析 JSON（解析失败返回空对象，避免抛错掩盖真实 HTTP 状态） */
async function safeJson(resp: Response): Promise<any> {
  try { return await resp.json() } catch { return {} }
}

/** 拉取参考图为 base64（供需要内联图片的接口，如 Gemini / OpenAI edits） */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mime: string }> {
  const r = await fetch(url)
  if (!r.ok) throw new Error('参考图下载失败')
  const mime = r.headers.get('content-type') || 'image/png'
  const buf = Buffer.from(await r.arrayBuffer())
  return { data: buf.toString('base64'), mime }
}

/** 出图比例 → 像素尺寸（通用，OpenAI/豆包等接受 WIDTHxHEIGHT） */
function aspectToPixels(ratio: string, edge = 1024): string {
  switch ((ratio || '1:1').trim()) {
    case '3:4': return `${Math.round(edge * 0.75)}x${edge}`
    case '4:3': return `${edge}x${Math.round(edge * 0.75)}`
    case '9:16': return `${Math.round(edge * 0.5625)}x${edge}`
    case '16:9': return `${edge}x${Math.round(edge * 0.5625)}`
    default: return `${edge}x${edge}`
  }
}

/**
 * OpenAI 图像：/v1/images/generations（文生图）/ /v1/images/edits（图生图，multipart）。
 * 最新模型如 gpt-image-2 返回 b64_json；模型名由后台配置（可填 chatgpt-image-latest 永远用最新）。
 */
async function invokeOpenAI(base: string, key: string, input: CreateTaskInput, aiCfg: AiPlatformConfig): Promise<string[]> {
  const refs = refImagesOf(input)
  const model = (refs.length ? aiCfg.img2imgModel : aiCfg.text2imgModel) || aiCfg.text2imgModel
  if (!model) throw new Error('未配置 OpenAI 图像模型名')
  const prompt = renderPrompt(aiCfg.promptTemplate, input.prompt || '')
  const size = aspectToPixels(aiCfg.aspectRatio)
  const refImage = refs[0]
  if (refImage) {
    // 图生图：把参考图作为文件 multipart 上传到 /images/edits
    const imgResp = await fetch(refImage)
    if (!imgResp.ok) throw new Error('参考图下载失败')
    const blob = await imgResp.blob()
    const fd = new FormData()
    fd.append('model', model)
    fd.append('prompt', prompt)
    fd.append('size', size)
    fd.append('image', blob, 'ref.png')
    const resp = await fetch(`${base}/images/edits`, { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: fd })
    return parseOpenAIImages(await safeJson(resp), resp)
  }
  const resp = await fetch(`${base}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, prompt, size, n: 1 }),
  })
  return parseOpenAIImages(await safeJson(resp), resp)
}

function parseOpenAIImages(j: any, resp: Response): string[] {
  if (!resp.ok) throw new Error(`OpenAI ${resp.status}: ${(j?.error?.message || '').slice(0, 160)}`)
  const data = (j?.data || []) as Array<{ url?: string; b64_json?: string }>
  return data.map((d) => (d.url ? d.url : d.b64_json ? `data:image/png;base64,${d.b64_json}` : '')).filter(Boolean)
}

/**
 * Nano Banana（Google Gemini）：POST /v1beta/models/{model}:generateContent?key=KEY。
 * 返回 candidates[].content.parts[].inlineData（base64）。模型名由后台配置（如 gemini-3-pro-image-preview）。
 */
async function invokeGemini(base: string, key: string, input: CreateTaskInput, aiCfg: AiPlatformConfig): Promise<string[]> {
  const refs = refImagesOf(input)
  const model = (refs.length ? aiCfg.img2imgModel : aiCfg.text2imgModel) || aiCfg.text2imgModel
  if (!model) throw new Error('未配置 Nano Banana(Gemini) 模型名')
  const prompt = renderPrompt(aiCfg.promptTemplate, input.prompt || '')
  const parts: any[] = [{ text: prompt }]
  const refImage = refs[0]
  if (refImage) {
    const { data, mime } = await fetchImageAsBase64(refImage)
    parts.push({ inline_data: { mime_type: mime, data } })
  }
  const url = `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  })
  const j = await safeJson(resp)
  if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${(j?.error?.message || '').slice(0, 160)}`)
  const cps = (j?.candidates?.[0]?.content?.parts || []) as any[]
  const out: string[] = []
  for (const p of cps) {
    const d = p.inlineData || p.inline_data
    if (d?.data) out.push(`data:${d.mimeType || d.mime_type || 'image/png'};base64,${d.data}`)
  }
  return out
}

/**
 * 豆包（火山方舟 Ark）：POST /api/v3/images/generations（OpenAI 兼容，同步返回）。
 * response_format=url 直接拿托管图；图生图传 image（URL/base64）。模型名由后台配置（如 doubao-seedream-5-0-260128）。
 */
async function invokeDoubao(base: string, key: string, input: CreateTaskInput, aiCfg: AiPlatformConfig): Promise<string[]> {
  const refs = refImagesOf(input)
  const model = (refs.length ? aiCfg.img2imgModel : aiCfg.text2imgModel) || aiCfg.text2imgModel
  if (!model) throw new Error('未配置豆包(Seedream)模型名')
  const prompt = renderPrompt(aiCfg.promptTemplate, input.prompt || '')
  const body: Record<string, unknown> = {
    model,
    prompt,
    size: aspectToPixels(aiCfg.aspectRatio, 2048),
    response_format: 'url',
    watermark: false,
    sequential_image_generation: 'disabled',
  }
  if (refs[0]) body.image = refs[0]
  const resp = await fetch(`${base}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  const j = await safeJson(resp)
  if (!resp.ok) throw new Error(`豆包 ${resp.status}: ${(j?.error?.message || j?.message || '').slice(0, 160)}`)
  const data = (j?.data || []) as Array<{ url?: string; b64_json?: string }>
  return data.map((d) => (d.url ? d.url : d.b64_json ? `data:image/png;base64,${d.b64_json}` : '')).filter(Boolean)
}

/**
 * 拉取某 provider 账号下可用的图像模型列表（供后台「拉取模型」下拉，永远跟最新）。
 * OpenAI/豆包走 OpenAI 兼容 GET /models；Gemini 走 GET /v1beta/models?key=。
 */
export async function listProviderModels(provider: AiProvider, apiKey?: string, apiBaseUrl?: string): Promise<string[]> {
  const key = apiKey || providerEnvKey(provider) || ''
  const base = apiBaseUrl || PROVIDER_DEFAULT_BASE[provider] || ''
  if (!key || !base) return []
  try {
    if (provider === 'nanobanana') {
      const r = await fetch(`${base}/models?pageSize=200&key=${encodeURIComponent(key)}`)
      const j = await safeJson(r)
      const models = (j?.models || []) as Array<{ name?: string }>
      return models.map((m) => (m.name || '').replace(/^models\//, '')).filter((id) => id && id.includes('image'))
    }
    const r = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${key}` } })
    const j = await safeJson(r)
    const data = (j?.data || []) as Array<{ id?: string }>
    let ids = data.map((d) => d.id || '').filter(Boolean)
    if (provider === 'openai') ids = ids.filter((id) => id.includes('image') || id.includes('dall-e'))
    if (provider === 'doubao') ids = ids.filter((id) => id.includes('seedream') || id.includes('seededit'))
    return ids.sort()
  } catch (err: any) {
    console.warn(`[AI] 拉取模型列表失败 provider=${provider}: ${err?.message || err}`)
    return []
  }
}

export interface ProviderTestResult { ok: boolean; url?: string; message: string; elapsedMs: number }

/** 后台「测试」：用给定配置真实出一张测试图，返回结果或真实错误（不消耗用户配额、不回退占位图）。 */
export async function testProvider(cfg: AiPlatformConfig): Promise<ProviderTestResult> {
  const start = Date.now()
  try {
    const urls = await generateImages(cfg, { type: 'text2img', prompt: '测试图案：粉色小花，平铺无缝' })
    const elapsedMs = Date.now() - start
    if (!urls.length) return { ok: false, message: '未返回图片，请检查模型名 / 密钥 / 账户额度', elapsedMs }
    let url = urls[0]
    if (url.startsWith('data:')) { const saved = await persistDataUrl(url, 'ai-test'); url = saved || url }
    return { ok: true, url, message: '生成成功', elapsedMs }
  } catch (err: any) {
    return { ok: false, message: String(err?.message || err).slice(0, 300), elapsedMs: Date.now() - start }
  }
}

/** 调用显式配置的图像接口（KIE / 通用）。未配置或失败返回空数组，交由上层回退。 */
async function invokeConfiguredApi(
  apiUrl: string | undefined,
  apiKey: string | undefined,
  input: CreateTaskInput,
  aiCfg: AiPlatformConfig,
): Promise<string[]> {
  if (!apiUrl || !apiKey) return []
  if (apiUrl.includes('kie.ai')) {
    return invokeKie(apiUrl, apiKey, input, aiCfg)
  }
  const refs = refImagesOf(input)
  const model = refs.length ? aiCfg.img2imgModel : aiCfg.text2imgModel
  try {
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        prompt: renderPrompt(aiCfg.promptTemplate, input.prompt || ''),
        image: refs[0],
        images: refs,
        type: input.type,
        model,
      }),
    })
    if (!resp.ok) return []
    const data = (await resp.json()) as { urls?: string[] }
    return data.urls ?? []
  } catch (err: any) {
    console.warn(`[AI] 通用图像接口异常: ${err?.message || err}`)
    return []
  }
}

/** 出图比例 → 万相 size 字符串 */
function aspectToSize(ratio: string): string {
  switch ((ratio || '1:1').trim()) {
    case '3:4': return '768*1024'
    case '4:3': return '1024*768'
    case '9:16': return '720*1280'
    case '16:9': return '1280*720'
    default: return '1024*1024'
  }
}

/** wan2.6/2.7+ 统一图像模型（如 wan2.7-image-pro）走 multimodal-generation 同步接口，
 *  与 wanx 系列、wan2.5-t2i 的异步 text2image 接口结构不同，需单独路由。 */
function isDashScopeMultimodalImage(model: string): boolean {
  return /wan2\.[6-9].*image|image-(pro|plus|flash|max)/i.test(model || '')
}

/**
 * 通义万相 wan2.7 统一图像模型（multimodal-generation 同步接口）。
 * 文生图：content 仅 text；图像编辑/改色：content = image + text（统一架构，同一模型）。
 * 端点：/api/v1/services/aigc/multimodal-generation/generation
 * 响应：output.choices[].message.content[].image（直链 URL）。失败返回空数组由上层回退。
 */
async function invokeDashScopeMultimodal(base: string, key: string, model: string, prompt: string, refImages: string[] = []): Promise<string[]> {
  const content: Array<Record<string, string>> = []
  for (const img of refImages) content.push({ image: img })
  content.push({ text: prompt })
  try {
    const resp = await fetch(`${base}/api/v1/services/aigc/multimodal-generation/generation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, input: { messages: [{ role: 'user', content }] }, parameters: { size: '2K', n: 1, watermark: false } }),
    })
    const j = await safeJson(resp)
    if (!resp.ok) {
      console.warn(`[DashScope-mm] ${resp.status}: code=${j?.code} msg=${(j?.message || '').slice(0, 160)}`)
      return []
    }
    const out: string[] = []
    for (const choice of (j?.output?.choices || []) as any[]) {
      for (const c of (choice?.message?.content || []) as any[]) {
        if (c?.image) out.push(c.image)
      }
    }
    if (!out.length) console.warn(`[DashScope-mm] 无图片: code=${j?.code} msg=${j?.message}`)
    return out
  } catch (err: any) {
    console.warn(`[DashScope-mm] 异常: ${err?.message || err}`)
    return []
  }
}

/**
 * 阿里云百炼 · 通义万相 文生图/图生图（异步任务流）。
 * createTask（X-DashScope-Async）→ 轮询 /tasks/{id} 取图。
 * 失败/超时返回空数组，由上层 invokeProvider 决定回退（KIE/通用接口或占位图）。
 * 端点按场景固定：
 *   - 文生图：/api/v1/services/aigc/text2image/image-synthesis
 *     body { model, input:{ prompt }, parameters:{ size, n } }
 *   - 图生图（改色/改背景，万相图像编辑）：/api/v1/services/aigc/image2image/image-synthesis
 *     body { model, input:{ function:'description_edit', prompt, base_image_url }, parameters:{ n } }
 * 模型名（wan2.x-t2i / wan2.x-image-edit 等）由后台配置，避免写死出错。
 */
async function invokeDashScopeImage(key: string, input: CreateTaskInput, aiCfg: AiPlatformConfig): Promise<string[]> {
  const base = aiCfg.apiBaseUrl || process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'
  const prompt = renderPrompt(aiCfg.promptTemplate, input.prompt || '')
  const refs = refImagesOf(input)
  const isEdit = refs.length > 0
  const model = isEdit ? aiCfg.img2imgModel : aiCfg.text2imgModel
  // wan2.6/2.7+ 统一图像模型（wan2.7-image-pro 等）走 multimodal-generation 同步接口
  if (isDashScopeMultimodalImage(model)) {
    return invokeDashScopeMultimodal(base, key, model, prompt, refs)
  }
  // 文生图与图像编辑使用不同的官方端点与请求体结构
  const endpoint = isEdit
    ? `${base}/api/v1/services/aigc/image2image/image-synthesis`
    : `${base}/api/v1/services/aigc/text2image/image-synthesis`
  const body = isEdit
    ? {
        model,
        input: { function: 'description_edit', prompt, base_image_url: refs[0] },
        parameters: { n: 1 },
      }
    : {
        model,
        input: { prompt },
        parameters: { size: aspectToSize(aiCfg.aspectRatio), n: 1 },
      }
  try {
    const createResp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'X-DashScope-Async': 'enable' },
      body: JSON.stringify(body),
    })
    const created = (await createResp.json()) as { output?: { task_id?: string }; code?: string; message?: string }
    const taskId = created.output?.task_id
    if (!taskId) {
      console.warn(`[DashScope] 创建任务无 task_id: code=${created.code} msg=${created.message}`)
      return []
    }
    const deadline = Date.now() + 80_000
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000))
      const infoResp = await fetch(`${base}/api/v1/tasks/${encodeURIComponent(taskId)}`, {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (!infoResp.ok) continue
      const info = (await infoResp.json()) as {
        output?: { task_status?: string; results?: Array<{ url?: string }> }
      }
      const st = info.output?.task_status
      if (st === 'SUCCEEDED') {
        const urls = (info.output?.results || []).map((r) => r.url).filter((u): u is string => !!u)
        return urls
      }
      if (st === 'FAILED' || st === 'UNKNOWN') {
        console.warn('[DashScope] 任务失败，尝试回退其他图像服务')
        return []
      }
    }
    console.warn('[DashScope] 生成超时，尝试回退其他图像服务')
    return []
  } catch (err: any) {
    console.warn(`[DashScope] 异常，尝试回退其他图像服务: ${err?.message || err}`)
    return []
  }
}

/** 占位图（接口未配置 / 余额不足 / 失败时回退，保证前端可联调） */
function placeholder(prompt?: string): string {
  return `https://placehold.co/1024x1024/946D60/FFF?text=${encodeURIComponent(prompt?.slice(0, 20) || 'AI')}`
}

/** KIE nano-banana：提交任务 + 轮询取图。失败/超时回退占位图，不阻断业务。 */
async function invokeKie(base: string, key: string, input: CreateTaskInput, aiCfg: AiPlatformConfig): Promise<string[]> {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
  const refs = refImagesOf(input)
  // 有参考图走图生图模型，否则文生图模型（均可后台配置）
  const model = refs.length ? aiCfg.img2imgModel : aiCfg.text2imgModel
  const promptText = renderPrompt(aiCfg.promptTemplate, input.prompt || '')
  const payload: Record<string, unknown> = {
    model,
    input: {
      prompt: promptText,
      aspect_ratio: aiCfg.aspectRatio || '1:1',
      output_format: 'png',
      ...(refs.length ? { image_urls: refs } : {}),
    },
  }

  try {
    const createResp = await fetch(`${base}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    const created = (await createResp.json()) as {
      code?: number
      msg?: string
      data?: { taskId?: string } | null
    }
    const taskId = created.data?.taskId
    if (!taskId) {
      // 余额不足(402)等情况：记录原因并回退占位图，保证不阻断
      console.warn(`[KIE] createTask 无 taskId: code=${created.code} msg=${created.msg}`)
      return [placeholder(input.prompt)]
    }

    // 轮询（最多 ~90s）
    const deadline = Date.now() + 90_000
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 4000))
      const infoResp = await fetch(`${base}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers })
      if (!infoResp.ok) continue
      const info = (await infoResp.json()) as {
        data?: { state?: string; resultJson?: string; failMsg?: string }
      }
      const state = info.data?.state
      if (state === 'success') {
        const rj = info.data?.resultJson
        const parsed = typeof rj === 'string' ? JSON.parse(rj || '{}') : rj || {}
        const urls: string[] = parsed.resultUrls || []
        if (urls.length) return urls
        return [placeholder(input.prompt)]
      }
      if (state === 'fail') {
        console.warn(`[KIE] 生成失败: ${info.data?.failMsg || ''}`)
        return [placeholder(input.prompt)]
      }
    }
    console.warn('[KIE] 生成超时，回退占位图')
    return [placeholder(input.prompt)]
  } catch (err: any) {
    console.warn(`[KIE] 异常回退占位图: ${err?.message || err}`)
    return [placeholder(input.prompt)]
  }
}

export interface ListTasksOptions {
  pageNum?: number
  pageSize?: number
  /** 按提示词模糊搜索 */
  q?: string
}

export interface ListTasksResult {
  list: AiTask[]
  total: number
  pageNum: number
  pageSize: number
}

/** 用户生成历史：仅成功且有结果图；支持分页与提示词搜索 */
export async function listTasks(userId: number, opts: ListTasksOptions = {}): Promise<ListTasksResult> {
  const pageNum = Math.max(1, opts.pageNum ?? 1)
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 10))
  const offset = (pageNum - 1) * pageSize
  const q = opts.q?.trim()

  const conds = [
    'user_id = ?',
    "status = 'success'",
    'result_urls IS NOT NULL',
    'JSON_LENGTH(result_urls) > 0',
  ]
  const args: unknown[] = [userId]
  if (q) {
    conds.push('prompt LIKE ?')
    args.push(`%${q.replace(/[%_\\]/g, '\\$&')}%`)
  }
  const where = `WHERE ${conds.join(' AND ')}`

  const totalRow = await queryOne<{ n: number }>(`SELECT COUNT(*) n FROM ai_task ${where}`, args)
  const rows = await query<AiTask>(
    `SELECT * FROM ai_task ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...args, pageSize, offset],
  )
  const list = rows.map((r) => ({ ...r, ref_images: parseStoredRefImages(r.ref_image) }))
  return { list, total: totalRow?.n ?? 0, pageNum, pageSize }
}

/** 删除当前用户的生成记录 */
export async function deleteTask(userId: number, taskId: number): Promise<boolean> {
  const r = await execute('DELETE FROM ai_task WHERE id = ? AND user_id = ?', [taskId, userId])
  return r.affectedRows > 0
}

/** 解析 ai_task.ref_image：单 URL 或 JSON 数组 */
export function parseStoredRefImages(refDb: string | null | undefined): string[] {
  if (!refDb) return []
  const t = refDb.trim()
  if (t.startsWith('[')) {
    try {
      const arr = JSON.parse(t) as unknown
      if (!Array.isArray(arr)) return []
      return arr.filter((u): u is string => typeof u === 'string' && !!u.trim())
    } catch {
      return []
    }
  }
  return [t]
}
