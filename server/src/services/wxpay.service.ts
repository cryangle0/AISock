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
import { jsapiPrepay, nativePrepay } from './wxpay/client.js'
import { upsertPendingPayment, setPrepayId, markPaid } from './payment.repo.js'

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
  // 复用未支付的 payment：同一订单多次发起支付时不重复落库，金额变化则更新
  const existing = await queryOne<{ id: number; out_trade_no: string; status: string }>(
    'SELECT id, out_trade_no, status FROM payment WHERE order_id = ? ORDER BY id DESC LIMIT 1',
    [orderId],
  )
  const reusePending = existing && existing.status === 'pending'
  const outTradeNo = reusePending ? existing!.out_trade_no : genOutTradeNo(orderId)
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

  if (reusePending) {
    await execute(
      `UPDATE payment SET amount_fen = ?, prepay_id = ? WHERE id = ?`,
      [amountFen, prepayId, existing!.id],
    )
  } else {
    await execute(
      `INSERT INTO payment (order_id, out_trade_no, method, amount_fen, status, prepay_id)
       VALUES (?,?,?,?, 'pending', ?)`,
      [orderId, outTradeNo, 'wechat', amountFen, prepayId],
    )
  }

  return { prepayId, outTradeNo, jsApi, real }
}

export interface NativePrepayResult {
  /** 微信 Native 二维码链接（前端渲染二维码）；mock 模式为空串 */
  codeUrl: string
  outTradeNo: string
  /** true=真实微信 Native 下单；false=演示 mock */
  real: boolean
}

/** web Native（扫码）appid：默认复用公众号/网站应用 appid，回落到小程序 appid */
function nativeAppid(): string {
  return process.env.WXPAY_NATIVE_APPID || process.env.WX_APPID || ''
}

/**
 * 创建微信 Native（扫码）预支付单 —— 供 web/PC 端使用。
 * 落库 pending 流水，调用 Native 下单取 code_url；凭证缺失或失败回退 mock。
 */
export async function createNativePrepay(
  orderId: number,
  amountFen: number,
  description: string,
): Promise<NativePrepayResult> {
  const appid = nativeAppid()
  const { outTradeNo } = await upsertPendingPayment(orderId, amountFen, 'wechat', null)
  let codeUrl = ''
  let real = false

  if (canRealPay() && appid) {
    try {
      codeUrl = await nativePrepay({
        appid,
        description,
        outTradeNo,
        amountFen,
        notifyUrl: notifyUrl(),
      })
      await setPrepayId(outTradeNo, codeUrl)
      real = true
    } catch (err: any) {
      console.warn(`[wxpay] Native 下单失败，回退 mock: ${err?.message || err}`)
    }
  }

  return { codeUrl, outTradeNo, real }
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
  return markPaid(outTradeNo, transactionId, paidAmountFen, '微信支付')
}
