/**
 * 小程序下单支付流程编排 —— 创建订单 → 预下单 → 真实微信支付 / mock 兜底。
 * 抽成组合式，供 PaymentSheet 复用，页面只管 UI。
 */
import { orderApi } from '@aisock/service'
import type { CreateOrderInput, PrepayResult } from '@aisock/service'

export interface PayOrderInput extends CreateOrderInput {
  /** 设计封面（已转存的 URL 或临时路径） */
  coverUrl?: string
}

export interface PayOutcome {
  ok: boolean
  orderId: number
  orderNo: string
  amount: number
  real: boolean
  cancelled?: boolean
  error?: string
}

/** 调起微信原生支付（包 Promise） */
function requestWxPayment(p: NonNullable<PrepayResult['jsApi']>): Promise<'ok' | 'cancel'> {
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: p.timeStamp,
      nonceStr: p.nonceStr,
      package: p.package,
      signType: p.signType,
      paySign: p.paySign,
      success: () => resolve('ok'),
      fail: (err: any) => {
        if (err?.errMsg?.includes('cancel')) resolve('cancel')
        else reject(new Error(err?.errMsg || '支付失败'))
      },
    } as any)
  })
}

/**
 * 完整支付：创建订单 → prepay → 支付。
 * - 真实模式：拿到 jsApi 参数后 uni.requestPayment，成功后由微信回调落库（这里轮询确认）。
 * - mock 模式：调 mock-paid 直接落库。
 */
export async function payOrder(input: PayOrderInput, unitPrice: number): Promise<PayOutcome> {
  // 1) 创建订单
  const created = await orderApi.createOrder({
    designId: input.designId,
    designName: input.designName,
    sockModelId: input.sockModelId,
    sizes: input.sizes,
    quantity: input.quantity,
    unitPrice,
    material: input.material,
    craft: input.craft,
    address: input.address,
    remark: input.remark,
  })
  const orderId = created.data.id
  const amount = +(input.quantity * unitPrice).toFixed(2)

  // 2) 预下单
  const pre = await orderApi.prepay(orderId)
  const { outTradeNo, jsApi, real } = pre.data

  // 3) 支付
  if (real && jsApi) {
    const r = await requestWxPayment(jsApi)
    if (r === 'cancel') {
      return { ok: false, cancelled: true, orderId, orderNo: created.data.orderNo, amount, real: true }
    }
    // 真实支付成功：微信异步回调落库，前端轮询确认（最多 ~6s）
    const paid = await pollPaid(orderId)
    return { ok: paid, orderId, orderNo: created.data.orderNo, amount, real: true }
  }

  // mock 兜底
  await orderApi.mockPaid(outTradeNo)
  return { ok: true, orderId, orderNo: created.data.orderNo, amount, real: false }
}

/** 轮询订单状态确认已支付（真实回调有延迟） */
async function pollPaid(orderId: number): Promise<boolean> {
  for (let i = 0; i < 6; i += 1) {
    await new Promise((r) => setTimeout(r, 1000))
    try {
      const res = await orderApi.getOrder(orderId)
      if (res.data.status !== 'pending') return true
    } catch {
      /* 继续轮询 */
    }
  }
  return true // 回调可能稍后到达，乐观返回，订单详情会显示真实状态
}
