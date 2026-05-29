/**
 * 微信支付 V3 骨架
 *
 * 真机：依赖 wechatpay-node-v3 + WXPAY_MCHID/WXPAY_PRIVATE_KEY_PATH/WXPAY_SERIAL/WXPAY_APIV3_KEY
 *   - jsapi 下单：POST /v3/pay/transactions/jsapi → 返回 prepay_id
 *   - 回调：解密 application/json AEAD-AES-256-GCM 得到 transaction_id / out_trade_no
 * 开发环境（缺凭证）：返回模拟 prepay_id，回调走 /pay/mock 直接打成功
 */
import { execute, queryOne } from '../db.js'
import { markPaid } from './order.service.js'

export interface PrepayResult {
  prepayId: string
  outTradeNo: string
  // 小程序 wx.requestPayment 所需字段（mock 模式留空）
  jsApi?: {
    timeStamp: string
    nonceStr: string
    package: string
    signType: 'RSA'
    paySign: string
  }
}

function genOutTradeNo(orderId: number): string {
  return `AS${Date.now()}${orderId}`
}

export function isProduction(): boolean {
  return !!(process.env.WXPAY_MCHID && process.env.WXPAY_APIV3_KEY && process.env.WXPAY_SERIAL)
}

/**
 * 创建预支付单 + 落库 payment 表。
 * 真机调微信 V3，dev 模式直接构造 mock prepay_id。
 */
export async function createPrepay(
  orderId: number,
  amountFen: number,
  openid: string,
  description: string,
): Promise<PrepayResult> {
  const outTradeNo = genOutTradeNo(orderId)
  let prepayId = `mock_${outTradeNo}`
  let jsApi: PrepayResult['jsApi']

  if (isProduction()) {
    // 真机集成时安装 wechatpay-node-v3 后启用：
    // const Pay = (await import('wechatpay-node-v3')).default
    // const cli = new Pay({ appid, mchid, publicKey, privateKey, key: API_V3_KEY })
    // const r = await cli.transactions_jsapi({ description, out_trade_no: outTradeNo, notify_url, amount: { total: amountFen }, payer: { openid } })
    // prepayId = r.prepay_id
    // jsApi = signJsapi(prepayId)
    console.warn(`[wxpay] 生产凭证缺失或未启用 wechatpay-node-v3，使用 mock（openid=${openid}, desc=${description}）`)
  }

  await execute(
    `INSERT INTO payment (order_id, out_trade_no, method, amount_fen, status, prepay_id)
     VALUES (?,?,?,?, 'pending', ?)`,
    [orderId, outTradeNo, 'wechat', amountFen, prepayId],
  )

  return { prepayId, outTradeNo, jsApi }
}

/**
 * 处理回调（生产环境验签后调用，dev 直接调）：标支付成功 + 更新订单
 */
export async function handlePaidNotify(outTradeNo: string, transactionId: string | null): Promise<{ ok: boolean }> {
  const row = await queryOne<{ id: number; order_id: number; status: string }>(
    'SELECT id, order_id, status FROM payment WHERE out_trade_no = ?',
    [outTradeNo],
  )
  if (!row) return { ok: false }
  if (row.status === 'success') return { ok: true } // 幂等

  await execute(
    'UPDATE payment SET status = ?, transaction_id = ?, paid_at = NOW() WHERE id = ?',
    ['success', transactionId, row.id],
  )
  // 拉取订单的 user_id 才能 markPaid。这里直接更新订单
  await execute(
    `UPDATE \`order\` SET status = 'paid', pay_method = '微信支付', paid_at = NOW()
     WHERE id = ? AND status = 'pending'`,
    [row.order_id],
  )
  return { ok: true }
}

// 引用占位以避免 unused 警告
void markPaid
