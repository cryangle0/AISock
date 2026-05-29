/**
 * App 订单路由（需登录）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import {
  listOrders, getOrder, createOrder, markPaid, updateOrder, orderStats,
  type OrderStatus,
} from '../../services/order.service.js'

export const ordersRouter = new Hono()

ordersRouter.get('/', async (c) => {
  const status = c.req.query('status') as OrderStatus | undefined
  return ok(c, await listOrders(getUserId(c), status))
})

ordersRouter.get('/stats', async (c) => {
  return ok(c, await orderStats(getUserId(c)))
})

ordersRouter.get('/:id', async (c) => {
  const o = await getOrder(Number(c.req.param('id')), getUserId(c))
  if (!o) return fail(c, '订单不存在', 404)
  return ok(c, o)
})

ordersRouter.post('/', async (c) => {
  const body = await c.req.json()
  if (!body?.quantity || body.quantity <= 0) return fail(c, '数量必须大于 0')
  const result = await createOrder(getUserId(c), body)
  return ok(c, result)
})

/** 支付（占位：标记已支付；实际接微信支付回调） */
ordersRouter.post('/:id/pay', async (c) => {
  const { payMethod } = await c.req.json<{ payMethod?: string }>()
  await markPaid(Number(c.req.param('id')), getUserId(c), payMethod || '微信支付')
  return ok(c, { paid: true })
})

ordersRouter.put('/:id', async (c) => {
  const body = await c.req.json()
  await updateOrder(Number(c.req.param('id')), getUserId(c), body)
  return ok(c, { updated: true })
})
