/**
 * 订单支付辅助（web）—— 真实支付的状态轮询。
 *
 * web/PC 端真实支付：
 *   - 微信：Native 扫码（/pay/native 返回 code_url → 前端渲染二维码），用户扫码后微信异步回调落库。
 *   - 支付宝：电脑网站支付（/pay/alipay 返回收银台 URL → 新窗口打开），支付后异步回调落库。
 * 两者均由前端轮询 /pay/status 确认最终结果（success）。
 *
 * 凭证缺失时后端返回 real=false，调用方回退 /pay/mock-paid 演示落库。
 */
import { orderApi } from '@/api'

export interface PollSignal {
  cancelled: boolean
}

/**
 * 轮询支付流水状态，success 即支付成功。
 * @param outTradeNo 商户订单号
 * @param opts.attempts 轮询次数（默认 60）  opts.interval 间隔 ms（默认 3000，约 3 分钟窗口）
 * @param opts.signal 外部取消信号（用户关闭弹窗时置 cancelled=true 终止轮询）
 */
export async function pollPaymentStatus(
  outTradeNo: string,
  opts: { attempts?: number; interval?: number; signal?: PollSignal } = {},
): Promise<boolean> {
  const attempts = opts.attempts ?? 60
  const interval = opts.interval ?? 3000
  for (let i = 0; i < attempts; i += 1) {
    await new Promise((r) => setTimeout(r, interval))
    if (opts.signal?.cancelled) return false
    try {
      const res = await orderApi.payStatus(outTradeNo)
      if (res.data.status === 'success') return true
    } catch {
      /* 忽略单次失败，继续轮询 */
    }
  }
  return false
}
