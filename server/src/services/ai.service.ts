/**
 * AI 生成领域服务
 * - 每日免费生图次数限额（Redis 计数，每日 0 点自然过期）
 * - 任务落库 + 调用外部文/图生图接口（占位实现）
 */
import { query, queryOne, execute } from '../db.js'
import { getRedis, CacheKey } from '../redis.js'
import { persistRemoteImage } from './oss.service.js'
import { resolvePlatformConfig, renderPrompt, type AiPlatform, type AiPlatformConfig } from './aiConfig.service.js'

export type AiTaskType = 'text2img' | 'img2img' | 'remix' | 'style'

export interface AiTask {
  id: number
  user_id: number
  type: AiTaskType
  prompt: string | null
  ref_image: string | null
  result_urls: string[] | null
  status: 'pending' | 'running' | 'success' | 'failed'
  error: string | null
  created_at: string
  finished_at: string | null
}

/** 当天剩余免费次数 */
export async function getRemainingQuota(userId: number, dailyLimit: number): Promise<number> {
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

export function computeDailyLimit(createdAt: string | Date | null, override?: number): number {
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
  refImage?: string
  /** 生成平台：决定使用哪套模型/提示词配置（默认 default） */
  platform?: AiPlatform
}

/** 创建并执行 AI 任务 */
export async function createTask(userId: number, dailyLimit: number, input: CreateTaskInput): Promise<AiTask> {
  await consumeQuota(userId, dailyLimit)

  const r = await execute(
    `INSERT INTO ai_task (user_id, type, prompt, ref_image, status) VALUES (?,?,?,?, 'running')`,
    [userId, input.type, input.prompt ?? null, input.refImage ?? null],
  )
  const taskId = r.insertId

  try {
    const rawUrls = await invokeProvider(input)
    // AI 出图多为临时 URL（~24h 过期），转存到 OSS 长期保存；未配置 OSS 时原样返回
    const urls = await Promise.all(rawUrls.map((u) => persistRemoteImage(u, 'ai')))
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
async function invokeProvider(input: CreateTaskInput): Promise<string[]> {
  const apiUrl = process.env.AI_IMAGE_API_URL
  const apiKey = process.env.AI_IMAGE_API_KEY
  if (!apiUrl || !apiKey) {
    return [placeholder(input.prompt)]
  }

  // 解析该平台生效的模型 / 提示词模板 / 出图比例
  const aiCfg = await resolvePlatformConfig(input.platform ?? 'default')

  // KIE nano-banana 协议
  if (apiUrl.includes('kie.ai')) {
    return invokeKie(apiUrl, apiKey, input, aiCfg)
  }

  // 通用接口：POST {url} { prompt, image, type, model } → { urls: [] }
  const model = input.refImage ? aiCfg.img2imgModel : aiCfg.text2imgModel
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ prompt: renderPrompt(aiCfg.promptTemplate, input.prompt || ''), image: input.refImage, type: input.type, model }),
  })
  if (!resp.ok) throw new Error(`AI 接口返回 ${resp.status}`)
  const data = (await resp.json()) as { urls?: string[] }
  return data.urls ?? []
}

/** 占位图（接口未配置 / 余额不足 / 失败时回退，保证前端可联调） */
function placeholder(prompt?: string): string {
  return `https://placehold.co/1024x1024/946D60/FFF?text=${encodeURIComponent(prompt?.slice(0, 20) || 'AI')}`
}

/** KIE nano-banana：提交任务 + 轮询取图。失败/超时回退占位图，不阻断业务。 */
async function invokeKie(base: string, key: string, input: CreateTaskInput, aiCfg: AiPlatformConfig): Promise<string[]> {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
  // 有参考图走图生图模型，否则文生图模型（均可后台配置）
  const model = input.refImage ? aiCfg.img2imgModel : aiCfg.text2imgModel
  const promptText = renderPrompt(aiCfg.promptTemplate, input.prompt || '')
  const payload: Record<string, unknown> = {
    model,
    input: {
      prompt: promptText,
      aspect_ratio: aiCfg.aspectRatio || '1:1',
      output_format: 'png',
      ...(input.refImage ? { image_urls: [input.refImage] } : {}),
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

export async function listTasks(userId: number, limit = 20): Promise<AiTask[]> {
  return query<AiTask>('SELECT * FROM ai_task WHERE user_id = ? ORDER BY id DESC LIMIT ?', [userId, limit])
}
