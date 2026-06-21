/**
 * AI 对话服务（袜品推荐导购）。
 *
 * 复用 DeepSeek / 千问（OpenAI 兼容 chat/completions）做真实多轮对话，stream=true 流式输出。
 * 端点/密钥/模型解析与 aiText.service 保持一致：AI_TEXT_* 优先，回退 DashScope 千问。
 * 未配置或上游失败时抛出错误，由路由层决定是否回退到本地文案，绝不阻断用户流程。
 */
import type { AiPlatform } from './aiConfig.service.js'

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatContext {
  scene?: string
  styles?: string[]
}

const SCENE_LABEL: Record<string, string> = {
  lover: '送爱人/恋人',
  bff: '送闺蜜/朋友',
  elder: '送长辈/家人',
  self: '送给自己',
}

const TIMEOUT_MS = 30000
const MAX_HISTORY = 12
const MAX_TOKENS = 600

/** 构建导购系统提示词：限定领域、控制长度与语气，保证回复聚焦且自然 */
function buildSystemPrompt(ctx: ChatContext): string {
  const lines = [
    '你是「爱花型」袜品定制小程序的 AI 推荐官，亲切、专业、简洁。',
    '职责：根据用户的场景、风格与喜好，推荐合适的袜子花型、配色与设计方向，并自然引导用户去定制下单。',
    '要求：口语化、温暖，每次回复 1-3 句、不超过 80 字；可适当用 emoji；只聊袜子花型/配色/风格相关话题；不要罗列长清单，不要输出与袜子无关的内容；用纯文本回复，不要使用 markdown 语法（如 **、#、- 列表）。',
  ]
  if (ctx.scene && SCENE_LABEL[ctx.scene]) lines.push(`当前场景：${SCENE_LABEL[ctx.scene]}。`)
  if (ctx.styles?.length) lines.push(`用户偏好风格：${ctx.styles.join('、')}。`)
  return lines.join('\n')
}

/**
 * 解析对话的「端点 + 密钥 + 模型」。
 * 对话需低延迟、非推理模型，故优先千问 qwen-plus（DashScope 兼容端点），
 * 可用 AI_CHAT_* 环境变量完全覆盖；端点与模型严格配套，避免模型/端点不匹配报错。
 */
function resolveChatTarget(): { apiUrl: string; apiKey: string; model: string } | null {
  // 1) 显式对话配置优先
  if (process.env.AI_CHAT_API_URL && process.env.AI_CHAT_API_KEY) {
    return {
      apiUrl: process.env.AI_CHAT_API_URL,
      apiKey: process.env.AI_CHAT_API_KEY,
      model: process.env.AI_CHAT_MODEL || 'qwen-plus',
    }
  }
  // 2) DashScope 千问（非推理、低延迟，对话首选）
  const dashKey = process.env.DASHSCOPE_API_KEY
  if (dashKey) {
    const dashBase = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'
    return {
      apiUrl: `${dashBase}/compatible-mode/v1`,
      apiKey: dashKey,
      model: process.env.AI_CHAT_MODEL || 'qwen-plus',
    }
  }
  // 3) 通用文本端点（如 DeepSeek）：模型按端点配套
  const apiUrl = process.env.AI_TEXT_API_URL
  const apiKey = process.env.AI_TEXT_API_KEY
  if (apiUrl && apiKey) {
    const isDeepSeek = /deepseek/i.test(apiUrl)
    return {
      apiUrl,
      apiKey,
      model: process.env.AI_CHAT_MODEL || (isDeepSeek ? 'deepseek-chat' : 'qwen-plus'),
    }
  }
  return null
}

/**
 * 流式对话：逐段 yield 文本增量。
 * 超时为「空闲超时」：每收到一段上游数据就重置，正常进行中的长回复不会被掐断。
 * @param signal 外部中止信号（客户端断开时传入，及时停止消耗上游 token）
 * @throws AI_TEXT_NOT_CONFIGURED 未配置密钥；AI_UPSTREAM_xxx 上游错误
 */
export async function* streamChat(
  messages: ChatTurn[],
  ctx: ChatContext,
  platform: AiPlatform = 'default',
  signal?: AbortSignal,
): AsyncGenerator<string> {
  // 后台配置的 provider（openai/豆包/dashscope/nanobanana）优先；否则回退环境变量逻辑
  let target: { apiUrl: string; apiKey: string; model: string } | null = null
  try {
    const { resolvePlatformConfig, resolveTextTarget } = await import('./aiConfig.service.js')
    target = resolveTextTarget(await resolvePlatformConfig(platform))
  } catch {
    /* 回退 env */
  }
  if (!target) target = resolveChatTarget()
  if (!target) throw new Error('AI_TEXT_NOT_CONFIGURED')
  const { apiUrl, apiKey, model } = target

  const history = messages.slice(-MAX_HISTORY)
  const payload = {
    model,
    messages: [{ role: 'system', content: buildSystemPrompt(ctx) }, ...history],
    temperature: 0.8,
    max_tokens: MAX_TOKENS,
    stream: true,
  }

  const controller = new AbortController()
  const onExternalAbort = () => controller.abort()
  signal?.addEventListener('abort', onExternalAbort, { once: true })
  let timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const resetIdleTimer = () => {
    clearTimeout(timer)
    timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  }
  try {
    const resp = await fetch(`${apiUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!resp.ok || !resp.body) throw new Error(`AI_UPSTREAM_${resp.status}`)

    const reader = resp.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      resetIdleTimer()
      buffer += decoder.decode(value, { stream: true })

      // 上游为 SSE：按行解析 data: 字段，仅取正式 content（忽略推理 reasoning_content）
      let nl: number
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim()
        buffer = buffer.slice(nl + 1)
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data) continue
        if (data === '[DONE]') return
        try {
          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const delta = json.choices?.[0]?.delta?.content
          if (delta) yield delta
        } catch {
          /* 心跳 / 不完整片段，忽略 */
        }
      }
    }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onExternalAbort)
  }
}
