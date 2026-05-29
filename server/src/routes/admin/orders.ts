/**
 * Admin 订单管理：分页列表 / 详情 / 改状态
 */
import { Hono } from 'hono'
import { ok, fail, paginated } from '../../utils/response.js'
import { getPageQuery } from '../../utils/context.js'
import { query, queryOne, execute } from '../../db.js'

export const adminOrdersRouter = new Hono()

const VALID_STATUS = new Set(['pending', 'paid', 'producing', 'shipped', 'done', 'cancelled'])

adminOrdersRouter.get('/', async (c) => {
  const { pageNum, pageSize, offset } = getPageQuery(c, 10)
  const status = c.req.query('status')
  const keyword = c.req.query('keyword')
  const conds: string[] = ['1=1']
  const args: any[] = []
  if (status && VALID_STATUS.has(status)) { conds.push('o.status = ?'); args.push(status) }
  if (keyword) { conds.push('(o.order_no LIKE ? OR o.design_name LIKE ?)'); args.push(`%${keyword}%`, `%${keyword}%`) }
  const where = `WHERE ${conds.join(' AND ')}`
  const totalRow = await queryOne<{ n: number }>(`SELECT COUNT(*) n FROM \`order\` o ${where}`, args)
  const list = await query(
    `SELECT o.*, u.phone AS user_phone, u.nickname AS user_nickname
     FROM \`order\` o LEFT JOIN \`user\` u ON u.id = o.user_id
     ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`,
    [...args, pageSize, offset],
  )
  return paginated(c, list, totalRow?.n ?? 0, pageNum, pageSize)
})

adminOrdersRouter.get('/:id', async (c) => {
  const o = await queryOne('SELECT * FROM `order` WHERE id = ?', [Number(c.req.param('id'))])
  if (!o) return fail(c, '订单不存在', 404)
  return ok(c, o)
})

adminOrdersRouter.put('/:id/status', async (c) => {
  const { status } = await c.req.json<{ status?: string }>()
  if (!status || !VALID_STATUS.has(status)) return fail(c, '状态值不合法')
  await execute('UPDATE `order` SET status = ? WHERE id = ?', [status, Number(c.req.param('id'))])
  return ok(c, { updated: true })
})
