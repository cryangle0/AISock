/**
 * 下单 + 支付编排（小程序）—— 把"创建订单 → 预下单 → 拉起微信支付 / mock → 落库"
 * 收敛到一个组合式函数，组件只负责 UI，逻辑清晰、易测、易扩展。
 *
 * 真实模式：prepay 返回 jsApi 签名参数 → uni.requestPayment 拉起微信支付，
 *           支付成功由微信异步回调 /pay/notify 落库（前端只需轮询/刷新订单）。
 * 演示模式：prepay 返回 real=false → 调 /pay/mock-paid 直接落库，保证闭环可演示。
 */
import { orderApi } from '@aisock/service'
import type { CreateOrderInput } from '@aisock/service'

export interface PayResult {
  orderId: number
  orderNo: string
  paid: boolean
  real: boolean
}

/** 拉起微信支付（真实模式），resolve(true)=成功 */
function requestWxPayment(jsApi: NonNullable<Awaited<ReturnType<typeof orderApi.prepay>>['data']['jsApi']>): Promise<boolean> {
  return new Promise((resolve) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: jsApi.timeStamp,
      nonceStr: jsApi.nonceStr,
      package: jsApi.package,
      signType: jsApi.signType,
      paySign: jsApi.paySign,
      success: () => resolve(true),
      fail: () => resolve(false),
    } as any)
  })
}

/**
 * 创建订单并完成支付。
 * @returns 订单信息 + 是否支付成功
 */
export async function createOrderAndPay(input: CreateOrderInput): Promise<PayResult> {
  // 1) 创建订单
  const created = await orderApi.createOrder(input)
  const orderId = created.data.id
  const orderNo = created.data.orderNo

  // 2) 预下单
  const pre = await orderApi.prepay(orderId)
  const { outTradeNo, jsApi, real } = pre.data as { outTradeNo: string; jsApi?: any; real?: boolean }

  // 3) 支付
  if (real && jsApi) {
    const ok = await requestWxPayment(jsApi)
    // 真实支付成功后，微信回调异步落库；这里乐观返回，由订单页轮询确认最终状态
    return { orderId, orderNo, paid: ok, real: true }
  }

  // 演示模式：mock 落库
  await orderApi.mockPaid(outTradeNo)
  return { orderId, orderNo, paid: true, real: false }
}
