/** 金额格式化（分→元 or 元保留两位） */
export function formatPrice(value: number): string {
  return `¥${value.toFixed(2)}`
}

/** 手机号脱敏 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return '未登录'
  const s = String(phone)
  if (s.length < 7) return s
  return `${s.slice(0, 3)} **** ${s.slice(-4)}`
}

/** 相对时间（简化） */
export function fromNow(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day} 天前`
  return dateStr.slice(0, 10)
}
