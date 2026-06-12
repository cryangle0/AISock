/**
 * App AI 路由（需登录）：生图任务 / 历史 / 剩余配额 / 款式衍生 / 亲子袜 / 邀请奖励
 */
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { queryOne } from '../../db.js'
import {
  createTask, listTasks, getRemainingQuota, computeDailyLimit,
} from '../../services/ai.service.js'
import { deriveStyleVariants, deriveFamilyPair } from '../../services/variant.service.js'

export const aiRouter = new Hono()

/** 取用户当日额度（新用户 7 天内 5 次，之后 2 次，后台 override 取大值） */
async function dailyLimit(userId: number): Promise<number> {
  const row = await queryOne<{ ai_quota_daily: number; created_at: string }>(
    'SELECT ai_quota_daily, created_at FROM `user` WHERE id = ?',
    [userId],
  )
  return computeDailyLimit(row?.created_at ?? null, row?.ai_quota_daily)
}

/** 剩余免费次数 */
aiRouter.get('/quota', async (c) => {
  const userId = getUserId(c)
  const limit = await dailyLimit(userId)
  const remaining = await getRemainingQuota(userId, limit)
  return ok(c, { limit, remaining })
})

/** 创建生图任务 */
aiRouter.post('/generate', async (c) => {
  const body = await c.req.json<{ type?: string; prompt?: string; refImage?: string; platform?: string }>()
  const type = (body.type || 'text2img') as 'text2img' | 'img2img' | 'remix' | 'style'
  if (type === 'text2img' && !body.prompt) return fail(c, '提示词不能为空')
  const platform = (body.platform === 'miniprogram' || body.platform === 'web') ? body.platform : 'default'
  const userId = getUserId(c)
  const task = await createTask(userId, await dailyLimit(userId), {
    type,
    prompt: body.prompt,
    refImage: body.refImage,
    platform,
  })
  return ok(c, task)
})

/** 我的生成历史 */
aiRouter.get('/tasks', async (c) => {
  return ok(c, await listTasks(getUserId(c)))
})

/** 意图分析：把模糊指令优化成高质量提示词（DeepSeek，失败回退原文） */
aiRouter.post('/optimize-prompt', async (c) => {
  const { prompt } = await c.req.json<{ prompt?: string }>()
  if (!prompt?.trim()) return fail(c, '提示词不能为空')
  const { optimizePrompt } = await import('../../services/aiText.service.js')
  const optimized = await optimizePrompt(prompt)
  return ok(c, { original: prompt, optimized })
})

/**
 * AI 对话（推荐导购）：SSE 流式返回。
 * 入参：messages(role/content 列表) + scene + styles + platform。
 * 事件：{delta:string} 增量 / {done:true} 结束 / {error:string} 失败。
 * 文本对话成本低，不消耗生图配额；上游未配置/出错时下发 error，由前端回退本地文案。
 */
aiRouter.post('/chat', async (c) => {
  const body = await c.req.json<{
    messages?: Array<{ role?: string; content?: string }>
    scene?: string
    styles?: string[]
    platform?: string
  }>().catch(() => ({} as Record<string, never>))

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' || m.role === 'system' ? m.role : 'user',
      content: String(m.content).slice(0, 1000),
    })) as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>

  const platform = (body.platform === 'miniprogram' || body.platform === 'web') ? body.platform : 'default'

  // 禁用 nginx 缓冲，保证 token 实时下发
  c.header('X-Accel-Buffering', 'no')
  c.header('Cache-Control', 'no-cache, no-transform')

  return streamSSE(c, async (stream) => {
    if (!messages.length) {
      await stream.writeSSE({ data: JSON.stringify({ error: 'EMPTY_MESSAGES' }) })
      return
    }
    try {
      const { streamChat } = await import('../../services/aiChat.service.js')
      let produced = false
      for await (const delta of streamChat(messages, { scene: body.scene, styles: body.styles }, platform)) {
        produced = true
        await stream.writeSSE({ data: JSON.stringify({ delta }) })
      }
      if (!produced) {
        await stream.writeSSE({ data: JSON.stringify({ error: 'EMPTY_REPLY' }) })
        return
      }
      await stream.writeSSE({ data: JSON.stringify({ done: true }) })
    } catch (e) {
      await stream.writeSSE({ data: JSON.stringify({ error: (e as Error)?.message || 'AI_ERROR' }) })
    }
  })
})

/** 款式衍生（1/2/4 套配色方案配方） */
aiRouter.post('/derive', async (c) => {
  const { count } = await c.req.json<{ count?: number }>()
  return ok(c, deriveStyleVariants(count || 2))
})

/** 亲子袜（成人 + 儿童配方） */
aiRouter.post('/family', async (c) => {
  return ok(c, deriveFamilyPair())
})

/** 语音识别：把上传后的音频 URL 转写为文本（千问 ASR，后台可配模型） */
aiRouter.post('/asr', async (c) => {
  const { audioUrl } = await c.req.json<{ audioUrl?: string }>()
  if (!audioUrl) return fail(c, '缺少音频地址')
  const { transcribeAudio } = await import('../../services/asr.service.js')
  const text = await transcribeAudio(audioUrl)
  return ok(c, { text })
})
