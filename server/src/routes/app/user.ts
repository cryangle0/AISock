/**
 * App 用户路由（需登录）：个人信息 / 概览
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { queryOne, execute } from '../../db.js'
import { countDesigns } from '../../services/design.service.js'
import { orderStats } from '../../services/order.service.js'
import { setPassword, hasPassword } from '../../services/auth.service.js'

export const userRouter = new Hono()

/** 当前用户信息（含是否已设密码，供前端展示「设置/修改密码」） */
userRouter.get('/profile', async (c) => {
  const userId = getUserId(c)
  const user = await queryOne<Record<string, unknown>>(
    'SELECT id, phone, nickname, avatar, ai_quota_daily FROM `user` WHERE id = ?',
    [userId],
  )
  if (!user) return fail(c, '用户不存在', 404)
  return ok(c, { ...user, hasPassword: await hasPassword(userId) })
})

/** 设置 / 修改登录密码 */
userRouter.put('/password', async (c) => {
  const { newPassword, oldPassword } = await c.req.json<{ newPassword?: string; oldPassword?: string }>()
  if (!newPassword) return fail(c, '新密码不能为空')
  await setPassword(getUserId(c), newPassword, oldPassword)
  return ok(c, { updated: true })
})

/** 更新昵称 / 头像 */
userRouter.put('/profile', async (c) => {
  const { nickname, avatar } = await c.req.json<{ nickname?: string; avatar?: string }>()
  const fields: string[] = []
  const values: any[] = []
  if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname) }
  if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar) }
  if (fields.length) {
    values.push(getUserId(c))
    await execute(`UPDATE \`user\` SET ${fields.join(', ')} WHERE id = ?`, values)
  }
  return ok(c, { updated: true })
})

/** "我的"页面数据概览 */
userRouter.get('/overview', async (c) => {
  const userId = getUserId(c)
  const [designs, orders] = await Promise.all([countDesigns(userId), orderStats(userId)])
  return ok(c, { designs, orders })
})
