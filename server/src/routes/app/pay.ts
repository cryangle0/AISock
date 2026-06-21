/**
 * 微信支付路由（jsapi 预下单 / 回调 / mock 通知）
 */
import { Hono } from 'hono'
import type { Context } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { queryOne } from '../../db.js'
import { createPrepay, createNativePrepay, handlePaidNotify } from '../../services/wxpay.service.js'
import { decryptNotify } from '../../services/wxpay/signer.js'
import { createAlipayOrder, handleAlipayNotify } from '../../services/alipay.service.js'

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
  // 具备真实支付能力时，无 openid（手机号/密码登录）不能下真实单，也不允许降级 mock；
  // 返回 428 让前端静默 uni.login → /auth/bind-wechat 补绑后重试，避免支付死路
  const { canRealPay } = await import('../../services/wxpay/signer.js')
  if (!userRow?.openid && canRealPay()) {
    return fail(c, '支付需要微信授权，请重试', 428)
  }
  const openid = userRow?.openid || `dev_${order.user_id}`
  const amountFen = Math.round(Number(order.total_amount) * 100)
  const result = await createPrepay(orderId, amountFen, openid, order.design_name || '袜款定制')
  return ok(c, result)
})

/** 加载当前用户的待支付订单（web 微信 Native / 支付宝 共用） */
async function loadPayableOrder(c: Context, orderId: number) {
  return queryOne<OrderRow>(
    'SELECT id, user_id, total_amount, status, design_name FROM `order` WHERE id = ? AND user_id = ?',
    [orderId, getUserId(c)],
  )
}

/** 微信 Native（扫码）预下单 —— web/PC 端，返回 code_url 供前端渲染二维码 */
payRouter.post('/native', async (c) => {
  const { orderId } = await c.req.json<{ orderId?: number }>()
  if (!orderId) return fail(c, '缺少 orderId')
  const order = await loadPayableOrder(c, orderId)
  if (!order) return fail(c, '订单不存在', 404)
  if (order.status !== 'pending') return fail(c, '订单状态不可支付')
  const amountFen = Math.round(Number(order.total_amount) * 100)
  const result = await createNativePrepay(orderId, amountFen, order.design_name || '袜款定制')
  return ok(c, result)
})

/** 支付宝电脑网站支付下单 —— 返回收银台跳转 URL（前端 window.location 跳转） */
payRouter.post('/alipay', async (c) => {
  const { orderId } = await c.req.json<{ orderId?: number }>()
  if (!orderId) return fail(c, '缺少 orderId')
  const order = await loadPayableOrder(c, orderId)
  if (!order) return fail(c, '订单不存在', 404)
  if (order.status !== 'pending') return fail(c, '订单状态不可支付')
  const amountFen = Math.round(Number(order.total_amount) * 100)
  const result = await createAlipayOrder(orderId, amountFen, order.design_name || '袜款定制')
  return ok(c, result)
})

/** 支付状态查询 —— web 扫码/跳转后轮询确认（依赖异步回调已落库） */
payRouter.get('/status', async (c) => {
  const outTradeNo = c.req.query('outTradeNo')
  if (!outTradeNo) return fail(c, '缺少 outTradeNo')
  const row = await queryOne<{ status: string; order_id: number }>(
    'SELECT p.status, p.order_id FROM payment p JOIN `order` o ON o.id = p.order_id WHERE p.out_trade_no = ? AND o.user_id = ?',
    [outTradeNo, getUserId(c)],
  )
  return ok(c, { status: row?.status || 'unknown', orderId: row?.order_id || null })
})

/**
 * 支付宝异步通知（生产）：application/x-www-form-urlencoded + RSA2 验签。
 * 支付宝要求返回纯文本 'success' 才视为接收成功，否则会重试。
 */
payRouter.post('/alipay/notify', async (c) => {
  try {
    const body = await c.req.parseBody()
    const params: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === 'string') params[k] = v
    }
    const okRes = await handleAlipayNotify(params)
    return c.text(okRes ? 'success' : 'failure')
  } catch (err: any) {
    console.warn(`[alipay] 回调处理失败: ${err?.message || err}`)
    return c.text('failure')
  }
})

/**
 * 微信回调（生产）：application/json + AEAD-AES-256-GCM 解密。
 * 微信要求返回 { code: 'SUCCESS' } 才视为接收成功，否则会重试。
 */
payRouter.post('/notify', async (c) => {
  try {
    const body = await c.req.json<{
      resource?: { ciphertext?: string; nonce?: string; associated_data?: string }
    }>()
    const res = body.resource
    if (res?.ciphertext && res.nonce) {
      // 真实回调：AEAD 解密
      const plain = decryptNotify(res.ciphertext, res.nonce, res.associated_data || '')
      const decoded = JSON.parse(plain) as {
        out_trade_no?: string
        transaction_id?: string
        trade_state?: string
        amount?: { total?: number }
      }
      if (decoded.out_trade_no && decoded.trade_state === 'SUCCESS') {
        await handlePaidNotify(decoded.out_trade_no, decoded.transaction_id || null, decoded.amount?.total)
      }
      return c.json({ code: 'SUCCESS', message: 'OK' })
    }
    // 明文分支仅在「非生产」或「未配真实支付凭证」时可用（调试网关）；
    // 生产 + 具备真实支付能力时拒绝，杜绝伪造未签名回调把订单刷成已支付（0 元单）。
    const { canRealPay } = await import('../../services/wxpay/signer.js')
    if (process.env.NODE_ENV === 'production' && canRealPay()) {
      return c.json({ code: 'FAIL', message: 'unsigned notify rejected' }, 400)
    }
    const outTradeNo = (body as { out_trade_no?: string }).out_trade_no || ''
    const transactionId = (body as { transaction_id?: string }).transaction_id || null
    if (!outTradeNo) return c.json({ code: 'FAIL', message: 'invalid' }, 400)
    await handlePaidNotify(outTradeNo, transactionId)
    return c.json({ code: 'SUCCESS', message: 'OK' })
  } catch (err: any) {
    console.warn(`[wxpay] 回调处理失败: ${err?.message || err}`)
    return c.json({ code: 'FAIL', message: 'decrypt error' }, 500)
  }
})

/** dev/演示模式：前端调用 mock 完成支付。生产环境（NODE_ENV=production 且具备真实支付能力）禁用 */
payRouter.post('/mock-paid', async (c) => {
  // 安全：生产环境一旦具备真实支付凭证，禁止 mock 支付，杜绝绕过支付刷单
  const { canRealPay } = await import('../../services/wxpay/signer.js')
  if (process.env.NODE_ENV === 'production' && canRealPay()) {
    return fail(c, '当前环境不支持演示支付', 403)
  }
  const { outTradeNo } = await c.req.json<{ outTradeNo?: string }>()
  if (!outTradeNo) return fail(c, '缺少 outTradeNo')
  await handlePaidNotify(outTradeNo, `mock_tx_${Date.now()}`)
  return ok(c, { paid: true })
})
