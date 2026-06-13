/**
 * Admin 订单管理：分页列表 / 详情 / 改状态
 */
import { Hono } from 'hono'
import { ok, fail, paginated } from '../../utils/response.js'
import { getPageQuery } from '../../utils/context.js'
import { query, queryOne, execute } from '../../db.js'

export const adminOrdersRouter = new Hono()

const VALID_STATUS = new Set(['pending', 'paid', 'producing', 'shipped', 'done', 'cancelled'])

// 允许的状态流转：约束管理员不能跳过支付直接发货等非法流转
const STATUS_FLOW: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['producing', 'cancelled'],
  producing: ['shipped', 'cancelled'],
  shipped: ['done'],
  done: [],
  cancelled: [],
}

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
  const id = Number(c.req.param('id'))
  const o = await queryOne(
    `SELECT o.*, u.phone AS user_phone, u.nickname AS user_nickname
     FROM \`order\` o LEFT JOIN \`user\` u ON u.id = o.user_id
     WHERE o.id = ?`,
    [id],
  )
  if (!o) return fail(c, '订单不存在', 404)
  // 附带用户补传的附件（设计稿 / 图片 / 文件）
  const attachments = await query(
    'SELECT id, name, url, mime, size, created_at FROM `order_attachment` WHERE order_id = ? ORDER BY id DESC',
    [id],
  )
  return ok(c, { ...(o as Record<string, unknown>), attachments })
})

adminOrdersRouter.put('/:id/status', async (c) => {
  const { status } = await c.req.json<{ status?: string }>()
  if (!status || !VALID_STATUS.has(status)) return fail(c, '状态值不合法')
  const id = Number(c.req.param('id'))
  const order = await queryOne<{ status: string }>('SELECT status FROM `order` WHERE id = ?', [id])
  if (!order) return fail(c, '订单不存在', 404)
  // 校验流转合法性：同状态幂等放行；否则必须在允许的下一步集合内
  if (order.status !== status && !(STATUS_FLOW[order.status] || []).includes(status)) {
    return fail(c, `不允许从「${order.status}」流转到「${status}」`)
  }
  await execute('UPDATE `order` SET status = ? WHERE id = ?', [status, id])
  return ok(c, { updated: true })
})
