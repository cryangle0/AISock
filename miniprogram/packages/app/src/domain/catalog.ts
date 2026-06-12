/**
 * 商品/花型领域映射与路由构造（浏览、详情、AI 推荐共用，保证下单闭环一致）。
 *
 * 「可下单商品」统一以后端公共花型库（pattern，含真实 http 图）为数据源：
 * 详情/推荐携带真实封面 → 购买页据此 createDesign → 成单。
 */
import type { Pattern } from '@aisock/common/types'

/** 可下单商品（由后端花型映射而来） */
export interface BuyableProduct {
  /** 来源花型 ID */
  patternId: number
  /** 商品名（= 花型名） */
  name: string
  /** 真实可下单封面（http URL，购买页据此建 design） */
  cover: string
  /** 分类 ID（便于按主题筛选/扩展） */
  categoryId: number | null
}

/** 后端花型 → 可下单商品 */
export function patternToProduct(p: Pattern): BuyableProduct {
  return {
    patternId: p.id,
    name: p.name,
    cover: p.image_url,
    categoryId: p.category_id,
  }
}

/** 是否为可下单的真实远程封面（http(s) URL） */
export function isRemoteCover(cover?: string | null): boolean {
  return !!cover && /^https?:/i.test(cover)
}

export interface PurchaseTarget {
  name: string
  cover?: string | null
  patternId?: number
}

/**
 * 构造「立即购买」路由（携带真实封面 + 来源花型，使购买页可直接成单）。
 * 统一编码，避免各页面手写 query 出错。
 */
export function purchaseRoute(target: PurchaseTarget): string {
  const params = [`name=${encodeURIComponent(target.name)}`]
  if (target.cover) params.push(`cover=${encodeURIComponent(target.cover)}`)
  if (target.patternId) params.push(`patternId=${target.patternId}`)
  return `/pages/purchase/index?${params.join('&')}`
}

/** 详情页路由（按花型 ID 打开真实商品详情） */
export function detailRoute(patternId: number): string {
  return `/pages/detail/index?id=${patternId}`
}

/** 携带封面进入「定制」流程的本地存储 key（与 upload/editor 约定一致） */
export const CUSTOMIZE_IMAGE_KEY = 'aisock_upload_image'

/** 把商品封面暂存，供 upload/editor 渲染到袜版 */
export function stashCustomizeCover(cover?: string | null): void {
  if (isRemoteCover(cover)) uni.setStorageSync(CUSTOMIZE_IMAGE_KEY, cover)
}
