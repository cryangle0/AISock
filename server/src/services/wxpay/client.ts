/**
 * 微信支付 V3 JSAPI 下单客户端 —— 调用 transactions/jsapi 取 prepay_id。
 */
import { buildAuthToken } from './signer.js'

const API_BASE = 'https://api.mch.weixin.qq.com'
const JSAPI_PATH = '/v3/pay/transactions/jsapi'

export interface JsapiOrderParams {
  appid: string
  description: string
  outTradeNo: string
  amountFen: number
  openid: string
  notifyUrl: string
}

/**
 * 调微信 JSAPI 下单，返回 prepay_id。
 * 失败抛错（由上层捕获回退 mock）。
 */
export async function jsapiPrepay(params: JsapiOrderParams): Promise<string> {
  const mchid = process.env.WXPAY_MCHID!
  const body = JSON.stringify({
    appid: params.appid,
    mchid,
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    amount: { total: params.amountFen, currency: 'CNY' },
    payer: { openid: params.openid },
  })

  const auth = buildAuthToken('POST', JSAPI_PATH, body)
  const resp = await fetch(`${API_BASE}${JSAPI_PATH}`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'aisock-server/1.0',
    },
    body,
  })

  const text = await resp.text()
  if (!resp.ok) {
    throw new Error(`微信下单失败 ${resp.status}: ${text.slice(0, 200)}`)
  }
  const data = JSON.parse(text) as { prepay_id?: string }
  if (!data.prepay_id) throw new Error(`微信下单无 prepay_id: ${text.slice(0, 200)}`)
  return data.prepay_id
}
