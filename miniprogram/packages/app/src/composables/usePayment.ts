/**
 * 支付编排（小程序）—— 把「预下单 → 拉起微信支付 / 演示落库」收敛到一处。
 *
 * 真实模式：prepay 返回 jsApi 签名参数 → uni.requestPayment 拉起微信支付，
 *           支付成功由微信异步回调 /pay/notify 落库（前端轮询订单状态确认）。
 * 演示模式：prepay 返回 real=false → 调 /pay/mock-paid 直接落库，保证闭环可演示。
 *
 * 设计原则：单一职责、可复用（编辑器下单 / 订单列表补付 共用）、对调用方屏蔽真假支付差异。
 */
import { orderApi } from '@aisock/service'
import type { CreateOrderInput, PrepayResult } from '@aisock/service'

export interface PayResult {
  orderId: number
  orderNo: string
  /** 是否完成支付（真实模式下需轮询确认，这里为乐观值） */
  paid: boolean
  /** 是否真实微信支付（false=演示 mock） */
  real: boolean
}

type JsApiParams = NonNullable<PrepayResult['jsApi']>

/** 拉起微信支付（真实模式）。resolve(true)=用户完成支付，resolve(false)=取消/失败 */
function requestWxPayment(jsApi: JsApiParams): Promise<boolean> {
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
    } as unknown as UniApp.RequestPaymentOptions)
  })
}

/** 对一个已存在的待支付订单发起支付（预下单 → 微信支付 / mock 落库） */
export async function payOrderById(orderId: number, orderNo = ''): Promise<PayResult> {
  const pre = await orderApi.prepay(orderId)
  const { outTradeNo, jsApi, real } = pre.data

  if (real && jsApi) {
    const ok = await requestWxPayment(jsApi)
    return { orderId, orderNo, paid: ok, real: true }
  }
  // 演示模式：mock 落库
  await orderApi.mockPaid(outTradeNo)
  return { orderId, orderNo, paid: true, real: false }
}

/** 创建订单并完成支付（编辑器下单链路） */
export async function createOrderAndPay(input: CreateOrderInput): Promise<PayResult> {
  const created = await orderApi.createOrder(input)
  return payOrderById(created.data.id, created.data.orderNo)
}

/**
 * 轮询订单是否已支付（真实微信支付为异步回调落库，需确认最终状态）。
 * @param orderId 订单 id
 * @param opts.attempts 轮询次数（默认 5）  opts.interval 间隔 ms（默认 1500）
 * @returns 是否在轮询窗口内确认已支付
 */
export async function pollOrderPaid(
  orderId: number,
  opts: { attempts?: number; interval?: number } = {},
): Promise<boolean> {
  const attempts = opts.attempts ?? 5
  const interval = opts.interval ?? 1500
  for (let i = 0; i < attempts; i += 1) {
    await new Promise((r) => setTimeout(r, interval))
    try {
      const res = await orderApi.getOrder(orderId)
      if (res.data && res.data.status !== 'pending') return true
    } catch {
      /* 忽略单次失败，继续轮询 */
    }
  }
  return false
}
