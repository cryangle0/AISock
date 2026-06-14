/**
 * AI 文案服务（意图分析 / 提示词优化）。
 *
 * 用 DeepSeek（OpenAI 兼容 chat/completions）把用户输入的模糊、口语化指令
 * 优化成适合文生图的高质量提示词。未配置或失败时原样返回用户输入，绝不阻断生图。
 *
 * 注：默认模型 deepseek-v4-flash 为「推理模型」，会先产出 reasoning_content 再产出
 * 正式回答，故 max_tokens 需留足推理预算（否则正式提示词会被截断，finish_reason=length）。
 */
import type { AiPlatform, AiPlatformConfig } from './aiConfig.service.js'

const SYSTEM_PROMPT = [
  '你是袜款印花设计的提示词专家。',
  '把用户的模糊描述改写成一句精炼、具体、适合文生图模型的中文提示词：',
  '补全风格、配色、构图、纹理等关键要素，保持无缝平铺、适合袜子印花。',
  '只输出优化后的提示词本身，不要解释、不要引号、不超过 60 字。',
].join('')

const TIMEOUT_MS = 15000
// 推理模型预算：reasoning + 正式输出，留足避免正式提示词被截断
const MAX_TOKENS = 1024
const MAX_PROMPT_LEN = 80

/** 清洗模型输出：去引号/前后缀/多余空白，限制长度，避免把解释性长文塞进提示词 */
function sanitize(text: string): string {
  let s = (text || '').trim()
  // 去掉成对包裹的中英文引号
  s = s.replace(/^["'“”‘’「」]+|["'“”‘’「」]+$/g, '').trim()
  // 取第一段（模型偶尔换行附带说明）
  s = s.split(/\n+/)[0].trim()
  if (s.length > MAX_PROMPT_LEN) s = s.slice(0, MAX_PROMPT_LEN)
  return s.trim()
}

/**
 * 优化提示词。
 * @param platform 取后台「AI 配置」对应平台的文本模型/密钥（小程序传 'miniprogram'）
 * @returns 优化后的提示词；未配置 DeepSeek / 调用失败 / 超时 / 被截断 → 返回原输入
 */
export async function optimizePrompt(userPrompt: string, platform: AiPlatform = 'default'): Promise<string> {
  const raw = (userPrompt || '').trim()
  if (!raw) return raw

  // 后台「AI 配置」该平台的文本模型/密钥优先，留空回退环境变量
  let cfg: AiPlatformConfig | null = null
  try {
    const { resolvePlatformConfig } = await import('./aiConfig.service.js')
    cfg = await resolvePlatformConfig(platform)
  } catch {
    /* 用环境变量 */
  }

  // 端点/密钥：后台配置 > AI_TEXT_* > DashScope 千问（OpenAI 兼容端点）
  const dashKey = cfg?.apiKey || process.env.DASHSCOPE_API_KEY
  const dashBase = (cfg?.provider === 'dashscope' && cfg?.apiBaseUrl) || process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'
  const apiUrl = process.env.AI_TEXT_API_URL || (dashKey ? `${dashBase}/compatible-mode/v1` : '')
  const apiKey = process.env.AI_TEXT_API_KEY || dashKey
  if (!apiUrl || !apiKey) return raw

  // 模型：后台该平台 textModel 优先，其次环境变量，最后兜底 qwen-plus
  const model = cfg?.textModel || process.env.AI_TEXT_MODEL || 'qwen-plus'

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const resp = await fetch(`${apiUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: raw },
        ],
        temperature: 0.7,
        max_tokens: MAX_TOKENS,
        stream: false,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!resp.ok) return raw
    const data = (await resp.json()) as {
      choices?: Array<{ finish_reason?: string; message?: { content?: string } }>
    }
    const choice = data.choices?.[0]
    // 正式输出被 token 预算截断 → 不可靠，回退原文
    if (choice?.finish_reason === 'length') return raw
    const optimized = sanitize(choice?.message?.content || '')
    return optimized || raw
  } catch {
    return raw // 失败回退原输入，不阻断生图
  }
}
