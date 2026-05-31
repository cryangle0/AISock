/**
 * App AI 路由（需登录）：生图任务 / 历史 / 剩余配额 / 款式衍生 / 亲子袜 / 邀请奖励
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { queryOne } from '../../db.js'
import {
  createTask, listTasks, getRemainingQuota, computeDailyLimit,
  grantBonusQuota,
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

/** 款式衍生（1/2/4 套配色方案配方） */
aiRouter.post('/derive', async (c) => {
  const { count } = await c.req.json<{ count?: number }>()
  return ok(c, deriveStyleVariants(count || 2))
})

/** 亲子袜（成人 + 儿童配方） */
aiRouter.post('/family', async (c) => {
  return ok(c, deriveFamilyPair())
})

/** 邀请奖励：被邀请人注册后，给邀请人 + 自己各加生图次数 */
aiRouter.post('/invite-bonus', async (c) => {
  const { bonus } = await c.req.json<{ bonus?: number }>()
  await grantBonusQuota(getUserId(c), Math.max(1, Math.min(10, bonus || 3)))
  const limit = await dailyLimit(getUserId(c))
  const remaining = await getRemainingQuota(getUserId(c), limit)
  return ok(c, { remaining })
})
