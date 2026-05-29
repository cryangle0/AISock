/**
 * 微信支付路由（jsapi 预下单 / 回调 / mock 通知）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { queryOne } from '../../db.js'
import { createPrepay, handlePaidNotify } from '../../services/wxpay.service.js'

export const payRouter = new Hono()

interface OrderRow {
  id: number
  user_id: number
  total_amount: number
  status: string
  design_name: string | null
}

/** 创建预支付单 */
payRouter.post('/prepay', async (c) => {
  const { orderId } = await c.req.json<{ orderId?: number }>()
  if (!orderId) return fail(c, '缺少 orderId')

  const order = await queryOne<OrderRow>(
    'SELECT id, user_id, total_amount, status, design_name FROM `order` WHERE id = ? AND user_id = ?',
    [orderId, getUserId(c)],
  )
  if (!order) return fail(c, '订单不存在', 404)
  if (order.status !== 'pending') return fail(c, '订单状态不可支付')

  const userRow = await queryOne<{ openid: string | null }>(
    'SELECT openid FROM `user` WHERE id = ?',
    [order.user_id],
  )
  const openid = userRow?.openid || `dev_${order.user_id}`
  const amountFen = Math.round(Number(order.total_amount) * 100)
  const result = await createPrepay(orderId, amountFen, openid, order.design_name || '袜款定制')
  return ok(c, result)
})

/**
 * 微信回调（生产）：application/json + AEAD-AES-256-GCM 解密
 * 真机集成时验签 → 解密 → 调 handlePaidNotify
 */
payRouter.post('/notify', async (c) => {
  // 生产：验证 Wechatpay-Signature + AEAD 解密 c.req.json() 得 resource
  // 这里仅留 hook，dev 不会被微信回调
  const body = await c.req.json().catch(() => ({}))
  const outTradeNo = (body as { out_trade_no?: string }).out_trade_no || ''
  const transactionId = (body as { transaction_id?: string }).transaction_id || null
  if (!outTradeNo) return c.json({ code: 'FAIL', message: 'invalid' }, 400)
  await handlePaidNotify(outTradeNo, transactionId)
  return c.json({ code: 'SUCCESS', message: 'OK' })
})

/** dev 模式：前端调用 mock 完成支付（生产不应可用） */
payRouter.post('/mock-paid', async (c) => {
  const { outTradeNo } = await c.req.json<{ outTradeNo?: string }>()
  if (!outTradeNo) return fail(c, '缺少 outTradeNo')
  await handlePaidNotify(outTradeNo, `mock_tx_${Date.now()}`)
  return ok(c, { paid: true })
})
