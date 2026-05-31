/**
 * 订单支付编排（web）—— 对已存在的待支付订单发起支付。
 * web 不在微信环境，真实 JSAPI 不可用，演示态走 prepay → mockPaid 落库。
 * 真实支付在微信端完成；web 端仅作下单与演示支付闭环。
 */
import { orderApi } from '@/api'

export interface PayResult {
  paid: boolean
  orderNo: string
}

/** 对已存在订单发起支付（预下单 → 演示落库） */
export async function payExistingOrder(orderId: number, orderNo = ''): Promise<PayResult> {
  const pre = await orderApi.prepay(orderId)
  const real = (pre.data as { real?: boolean }).real
  if (real) {
    // web 无法拉起微信 JSAPI；提示去小程序/微信内支付，订单保持待支付
    return { paid: false, orderNo }
  }
  await orderApi.mockPaid(pre.data.outTradeNo)
  return { paid: true, orderNo }
}
