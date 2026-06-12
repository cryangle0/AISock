/**
 * Admin 用户管理：分页列表 / 禁用启用 / 调整每日配额
 */
import { Hono } from 'hono'
import { ok, fail, paginated } from '../../utils/response.js'
import { getPageQuery } from '../../utils/context.js'
import { requireRole } from '../../middleware/auth.js'
import { query, queryOne, execute } from '../../db.js'

export const adminUsersRouter = new Hono()

// 用户管理涉及用户隐私(手机号)与配额，仅超管(admin)可访问；运营(operator)无权
adminUsersRouter.use('*', requireRole('admin'))

adminUsersRouter.get('/', async (c) => {
  const { pageNum, pageSize, offset } = getPageQuery(c, 10)
  const keyword = c.req.query('keyword')
  const conds: string[] = ['1=1']
  const args: any[] = []
  if (keyword) { conds.push('(phone LIKE ? OR nickname LIKE ?)'); args.push(`%${keyword}%`, `%${keyword}%`) }
  const where = `WHERE ${conds.join(' AND ')}`
  const totalRow = await queryOne<{ n: number }>(`SELECT COUNT(*) n FROM \`user\` ${where}`, args)
  const list = await query(
    `SELECT id, phone, nickname, avatar, status, ai_quota_daily, created_at
     FROM \`user\` ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...args, pageSize, offset],
  )
  return paginated(c, list, totalRow?.n ?? 0, pageNum, pageSize)
})

adminUsersRouter.put('/:id/status', async (c) => {
  const { status } = await c.req.json<{ status?: number }>()
  if (status !== 0 && status !== 1) return fail(c, '状态值不合法')
  await execute('UPDATE `user` SET status = ? WHERE id = ?', [status, Number(c.req.param('id'))])
  return ok(c, { updated: true })
})

adminUsersRouter.put('/:id/quota', async (c) => {
  const { quota } = await c.req.json<{ quota?: number }>()
  if (quota == null || quota < 0) return fail(c, '配额必须 ≥ 0')
  await execute('UPDATE `user` SET ai_quota_daily = ? WHERE id = ?', [quota, Number(c.req.param('id'))])
  return ok(c, { updated: true })
})
