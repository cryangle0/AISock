/**
 * 订单计价 —— 服务端权威计算（单一数据源）。
 *
 * 安全要点：单价/工艺加价绝不信任前端传值，一律由本模块按 材质 + 工艺 计算，
 * 前端传的 unitPrice 仅作展示参考，落库金额以本模块为准。
 */

/** 材质基础单价（元/双） */
export const MATERIAL_UNIT_PRICE: Record<string, number> = {
  cotton: 28,
  nylon: 32,
}

/** 工艺加价（元/双） */
export const CRAFT_SURCHARGE: Record<string, number> = {
  uv: 0,
  '3d': 6,
  jacquard: 12,
}

export const DEFAULT_MATERIAL = 'cotton'
export const DEFAULT_CRAFT = 'uv'

/** 单笔订单数量上限（防刷） */
export const MAX_ORDER_QUANTITY = 9999

export interface PriceBreakdown {
  /** 规范化后的材质 key */
  material: string
  /** 规范化后的工艺 key */
  craft: string
  /** 材质基础单价 */
  basePrice: number
  /** 工艺加价 */
  craftFee: number
  /** 最终单价 = 基础 + 加价 */
  unitPrice: number
  /** 数量 */
  quantity: number
  /** 总价 */
  total: number
}

/**
 * 计算订单价格（服务端权威）。
 * 未知材质/工艺回退到默认值，保证永不因脏值崩溃或算出 0 元。
 */
export function computePrice(input: {
  material?: string | null
  craft?: string | null
  quantity: number
}): PriceBreakdown {
  const material = input.material && input.material in MATERIAL_UNIT_PRICE ? input.material : DEFAULT_MATERIAL
  const craft = input.craft && input.craft in CRAFT_SURCHARGE ? input.craft : DEFAULT_CRAFT

  const basePrice = MATERIAL_UNIT_PRICE[material]
  const craftFee = CRAFT_SURCHARGE[craft]
  const unitPrice = +(basePrice + craftFee).toFixed(2)

  const quantity = clampQuantity(input.quantity)
  const total = +(unitPrice * quantity).toFixed(2)

  return { material, craft, basePrice, craftFee, unitPrice, quantity, total }
}

/** 数量规范化：取整、>=1、<= 上限 */
export function clampQuantity(q: number): number {
  const n = Math.floor(Number(q) || 0)
  if (n < 1) return 1
  if (n > MAX_ORDER_QUANTITY) return MAX_ORDER_QUANTITY
  return n
}
