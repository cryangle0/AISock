/**
 * 下单 / 支付相关静态数据：材质、工艺、尺码、单价、加价、支付方式。
 * 与小程序保持一致，便于两端报价口径统一。
 */

export interface OptionItem {
  value: string
  label: string
  desc: string
}

export const MATERIALS: OptionItem[] = [
  { value: 'cotton', label: '精梳棉', desc: '舒适亲肤 · 日常首选' },
  { value: 'nylon', label: '锦纶', desc: '弹性强韧 · 运动通勤' },
  { value: 'combed', label: '长绒棉', desc: '高支细腻 · 高端质感' },
]

export const CRAFTS: OptionItem[] = [
  { value: 'uv', label: 'UV 印花', desc: '色彩鲜艳 · 纹理细腻' },
  { value: '3d', label: '3D 印花', desc: '立体浮雕 · 触感丰富' },
  { value: 'jacquard', label: '针织提花', desc: '织线成花 · 质感传统' },
]

export const SIZE_LIST = ['S', 'M', 'L', 'XL'] as const

/** 单价（元/双）按材质 */
export const UNIT_PRICE: Record<string, number> = {
  cotton: 6.8,
  nylon: 7.5,
  combed: 9.2,
}

/** 工艺加价（元/双） */
export const CRAFT_FEE: Record<string, number> = {
  uv: 0,
  '3d': 1.5,
  jacquard: 2.2,
}

export interface PayMethod {
  value: string
  label: string
  tip: string
  accent: string
}

export const PAY_METHODS: PayMethod[] = [
  { value: 'wechat', label: '微信支付', tip: '推荐 · 即时到账', accent: '#1aad19' },
  { value: 'alipay', label: '支付宝', tip: '安全便捷', accent: '#1677ff' },
  { value: 'corporate', label: '对公转账', tip: '大额订单适用', accent: '#946d60' },
]

export const DEFAULT_SIZES: Record<string, number> = { S: 0, M: 50, L: 30, XL: 0 }
