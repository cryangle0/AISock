/**
 * App AI 路由（需登录）：生图任务 / 历史 / 剩余配额
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { queryOne } from '../../db.js'
import { createTask, listTasks, getRemainingQuota } from '../../services/ai.service.js'

export const aiRouter = new Hono()

async function dailyLimit(userId: number): Promise<number> {
  const row = await queryOne<{ ai_quota_daily: number }>(
    'SELECT ai_quota_daily FROM `user` WHERE id = ?',
    [userId],
  )
  return row?.ai_quota_daily ?? 5
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
  const body = await c.req.json<{ type?: string; prompt?: string; refImage?: string }>()
  const type = (body.type || 'text2img') as 'text2img' | 'img2img' | 'remix' | 'style'
  if (type === 'text2img' && !body.prompt) return fail(c, '提示词不能为空')
  const userId = getUserId(c)
  const task = await createTask(userId, await dailyLimit(userId), {
    type,
    prompt: body.prompt,
    refImage: body.refImage,
  })
  return ok(c, task)
})

/** 我的生成历史 */
aiRouter.get('/tasks', async (c) => {
  return ok(c, await listTasks(getUserId(c)))
})
