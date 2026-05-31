/**
 * App 订单路由（需登录）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import {
  listOrders, getOrder, createOrder, updateOrder, orderStats,
  type OrderStatus,
} from '../../services/order.service.js'
import { computePrice, MATERIAL_UNIT_PRICE, CRAFT_SURCHARGE } from '../../services/pricing.service.js'

export const ordersRouter = new Hono()

/** 价目表 + 试算：前端用于展示价格（最终以下单时服务端计算为准） */
ordersRouter.get('/pricing', async (c) => {
  return ok(c, { materials: MATERIAL_UNIT_PRICE, crafts: CRAFT_SURCHARGE })
})

ordersRouter.post('/quote', async (c) => {
  const body = await c.req.json<{ material?: string; craft?: string; quantity?: number }>()
  return ok(c, computePrice({ material: body.material, craft: body.craft, quantity: body.quantity ?? 1 }))
})

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

// 注意：订单「已支付」状态只能由 /pay/prepay → 微信回调 或 /pay/mock-paid（仅非生产）写入，
// 不再提供「直接标记已支付」的接口，杜绝绕过支付刷单。

ordersRouter.put('/:id', async (c) => {
  const body = await c.req.json()
  await updateOrder(Number(c.req.param('id')), getUserId(c), body)
  return ok(c, { updated: true })
})
