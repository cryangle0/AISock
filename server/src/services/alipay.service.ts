/**
 * 支付宝服务编排层 —— 电脑网站支付（alipay.trade.page.pay）+ 异步回调验签落库。
 *
 * - 凭证齐全：构造已签名的网页支付跳转 URL，前端 window.location 跳转支付宝收银台。
 * - 回调：验签 + trade_status 校验 + 金额校验后幂等落库。
 *
 * 纯 node:crypto 签名，无第三方 SDK，部署仅需配置 ALIPAY_* 环境变量与密钥文件。
 */
import { sign, verify, canAlipay } from './alipay/signer.js'
import { upsertPendingPayment, markPaid } from './payment.repo.js'

export { canAlipay }

function gateway(): string {
  return process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do'
}

/** 支付宝要求 yyyy-MM-dd HH:mm:ss（北京时间 UTC+8） */
function beijingTimestamp(): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(
    d.getUTCMinutes(),
  )}:${p(d.getUTCSeconds())}`
}

export interface AlipayOrderResult {
  payUrl: string
  outTradeNo: string
  real: boolean
}

/**
 * 创建支付宝电脑网站支付订单：落库 pending 流水 + 返回带签名的收银台跳转 URL。
 */
export async function createAlipayOrder(
  orderId: number,
  amountFen: number,
  subject: string,
): Promise<AlipayOrderResult> {
  const { outTradeNo } = await upsertPendingPayment(orderId, amountFen, 'alipay', null)

  if (!canAlipay()) {
    // 凭证缺失：返回 mock 标记，前端走演示落库（与微信 mock 一致）
    return { payUrl: '', outTradeNo, real: false }
  }

  const bizContent = JSON.stringify({
    out_trade_no: outTradeNo,
    total_amount: (amountFen / 100).toFixed(2),
    subject,
    product_code: 'FAST_INSTANT_TRADE_PAY',
  })

  const params: Record<string, string> = {
    app_id: process.env.ALIPAY_APPID!,
    method: 'alipay.trade.page.pay',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: beijingTimestamp(),
    version: '1.0',
    biz_content: bizContent,
  }
  if (process.env.ALIPAY_NOTIFY_URL) params.notify_url = process.env.ALIPAY_NOTIFY_URL
  if (process.env.ALIPAY_RETURN_URL) params.return_url = process.env.ALIPAY_RETURN_URL

  params.sign = sign(params)

  const query = Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')

  return { payUrl: `${gateway()}?${query}`, outTradeNo, real: true }
}

/**
 * 处理支付宝异步通知：验签 → 交易状态 → 金额校验 → 幂等落库。
 * @returns 是否处理成功（决定回 'success' / 'failure'）
 */
export async function handleAlipayNotify(params: Record<string, string>): Promise<boolean> {
  const signature = params.sign
  if (!signature) return false
  if (!verify(params, signature)) {
    console.warn('[alipay] 回调验签失败')
    return false
  }
  const tradeStatus = params.trade_status
  if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
    // 非成功事件也视为已接收（避免支付宝重复通知），但不落库
    return true
  }
  const outTradeNo = params.out_trade_no
  const tradeNo = params.trade_no || null
  if (!outTradeNo) return false
  // total_amount 元 → 分，做金额校验
  const paidFen = params.total_amount ? Math.round(Number(params.total_amount) * 100) : undefined
  const res = await markPaid(outTradeNo, tradeNo, paidFen, '支付宝')
  return res.ok
}
