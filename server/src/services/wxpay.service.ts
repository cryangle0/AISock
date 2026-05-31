/**
 * 微信支付 V3 服务编排层。
 *
 * - 凭证齐全（含商户私钥）：真实 JSAPI 下单 + 返回 wx.requestPayment 签名参数；回调 AEAD 解密落库。
 * - 凭证缺失（开发/未配私钥）：返回 mock prepay_id，前端走 /pay/mock-paid 演示闭环。
 *
 * 真实启用只需在服务器配置：
 *   WXPAY_PRIVATE_KEY_PATH=/root/work/aisock/server/certs/apiclient_key.pem
 *   WX_SECRET=<小程序密钥>
 */
import { execute, queryOne } from '../db.js'
import { canRealPay, buildJsapiPayParams } from './wxpay/signer.js'
import { jsapiPrepay } from './wxpay/client.js'

export interface JsApiParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: 'RSA'
  paySign: string
}

export interface PrepayResult {
  prepayId: string
  outTradeNo: string
  /** 真实模式下返回，小程序 wx.requestPayment 直接使用 */
  jsApi?: JsApiParams
  /** true=真实微信下单；false=演示 mock */
  real: boolean
}

function genOutTradeNo(orderId: number): string {
  return `AS${Date.now()}${orderId}`
}

/** 是否具备真实支付能力（供路由/前端判断展示） */
export function isProduction(): boolean {
  return canRealPay()
}

function notifyUrl(): string {
  const base = process.env.UPLOAD_BASE_URL?.replace(/\/aisock-api\/uploads.*$/, '/aisock-api') || ''
  return process.env.WXPAY_NOTIFY_URL || `${base}/api/v1/app/pay/notify`
}

/**
 * 创建预支付单 + 落库 payment 表。
 */
export async function createPrepay(
  orderId: number,
  amountFen: number,
  openid: string,
  description: string,
): Promise<PrepayResult> {
  const outTradeNo = genOutTradeNo(orderId)
  const appid = process.env.WX_APPID || ''
  let prepayId = `mock_${outTradeNo}`
  let jsApi: JsApiParams | undefined
  let real = false

  if (canRealPay() && appid && !openid.startsWith('dev_')) {
    try {
      prepayId = await jsapiPrepay({
        appid,
        description,
        outTradeNo,
        amountFen,
        openid,
        notifyUrl: notifyUrl(),
      })
      jsApi = buildJsapiPayParams(appid, prepayId)
      real = true
    } catch (err: any) {
      console.warn(`[wxpay] 真实下单失败，回退 mock: ${err?.message || err}`)
    }
  }

  await execute(
    `INSERT INTO payment (order_id, out_trade_no, method, amount_fen, status, prepay_id)
     VALUES (?,?,?,?, 'pending', ?)`,
    [orderId, outTradeNo, 'wechat', amountFen, prepayId],
  )

  return { prepayId, outTradeNo, jsApi, real }
}

/**
 * 处理支付成功（回调验签解密后 / dev mock 调用）：幂等标记 payment + order 已支付。
 * @param paidAmountFen 微信回调带回的实付金额（分）；提供时与下单金额比对，不符则拒绝（防篡改/串单）。
 */
export async function handlePaidNotify(
  outTradeNo: string,
  transactionId: string | null,
  paidAmountFen?: number,
): Promise<{ ok: boolean }> {
  const row = await queryOne<{ id: number; order_id: number; status: string; amount_fen: number }>(
    'SELECT id, order_id, status, amount_fen FROM payment WHERE out_trade_no = ?',
    [outTradeNo],
  )
  if (!row) return { ok: false }
  if (row.status === 'success') return { ok: true } // 幂等

  // 金额校验：回调带回金额时必须与下单金额一致，防止伪造小额支付完成大额订单
  if (typeof paidAmountFen === 'number' && paidAmountFen !== row.amount_fen) {
    console.warn(`[wxpay] 金额不符，拒绝落库: out_trade_no=${outTradeNo} 期望=${row.amount_fen} 实收=${paidAmountFen}`)
    return { ok: false }
  }

  await execute(
    'UPDATE payment SET status = ?, transaction_id = ?, paid_at = NOW() WHERE id = ?',
    ['success', transactionId, row.id],
  )
  await execute(
    `UPDATE \`order\` SET status = 'paid', pay_method = '微信支付', paid_at = NOW()
     WHERE id = ? AND status = 'pending'`,
    [row.order_id],
  )
  return { ok: true }
}
