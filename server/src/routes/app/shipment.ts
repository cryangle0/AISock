import { Hono } from 'hono'
import { ok } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { queryOne } from '../../db.js'
import { getShipment } from '../../services/shipment.service.js'

export const shipmentRouter = new Hono()

shipmentRouter.get('/:orderId', async (c) => {
  const orderId = Number(c.req.param('orderId'))
  // 校验订单属于当前用户
  const o = await queryOne('SELECT id FROM `order` WHERE id = ? AND user_id = ?', [orderId, getUserId(c)])
  if (!o) return ok(c, null)
  return ok(c, await getShipment(orderId))
})
