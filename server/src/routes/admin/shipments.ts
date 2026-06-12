/**
 * Admin 物流管理：录入运单 / 追加轨迹 / 列表
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { upsertShipment, appendTrace, listShipments, getShipment } from '../../services/shipment.service.js'

export const adminShipmentsRouter = new Hono()

adminShipmentsRouter.get('/', async (c) => {
  return ok(c, await listShipments())
})

adminShipmentsRouter.get('/:orderId', async (c) => {
  return ok(c, await getShipment(Number(c.req.param('orderId'))))
})

/** 录入运单号（自动把订单推到已发货；订单未支付则拒绝） */
adminShipmentsRouter.post('/', async (c) => {
  const { orderId, carrier, trackingNo } = await c.req.json<{ orderId?: number; carrier?: string; trackingNo?: string }>()
  if (!orderId || !carrier || !trackingNo) return fail(c, '订单/承运商/运单号必填')
  try {
    await upsertShipment(orderId, carrier, trackingNo)
  } catch (e: any) {
    return fail(c, e?.message || '发货失败', e?.status || 400)
  }
  return ok(c, { updated: true })
})

/** 追加轨迹（status=delivered 时订单转完成） */
adminShipmentsRouter.post('/:orderId/trace', async (c) => {
  const { desc, status } = await c.req.json<{ desc?: string; status?: string }>()
  if (!desc) return fail(c, '轨迹描述不能为空')
  await appendTrace(Number(c.req.param('orderId')), desc, status)
  return ok(c, { updated: true })
})
