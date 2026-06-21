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
  const display = p.display_config
  return {
    patternId: p.id,
    name: display?.feedTitle || p.name,
    cover: display?.feedCover || p.image_url,
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
  return `/pkg/purchase/index?${params.join('&')}`
}

/** 从后台配置的 link 解析花型 ID（pattern:5、/pkg/detail/index?id=5、/product/5） */
export function parsePatternIdFromLink(link?: string | null): number | null {
  if (!link) return null
  const m =
    link.match(/(?:^|\/)product\/(\d+)/i) ||
    link.match(/[?&]id=(\d+)/) ||
    link.match(/^pattern:(\d+)$/i) ||
    link.match(/^(\d+)$/)
  const id = m ? Number(m[1]) : NaN
  return Number.isInteger(id) && id > 0 ? id : null
}

/** 详情页路由（按花型 ID 打开真实商品详情） */
export function detailRoute(patternId: number): string {
  return `/pkg/detail/index?id=${patternId}`
}

/** 携带封面进入「定制」流程的本地存储 key（与 upload/editor 约定一致） */
export const CUSTOMIZE_IMAGE_KEY = 'aisock_upload_image'

/** 把商品封面暂存，供 upload/editor 渲染到袜版 */
export function stashCustomizeCover(cover?: string | null): void {
  if (isRemoteCover(cover)) uni.setStorageSync(CUSTOMIZE_IMAGE_KEY, cover)
}

/** 首页底部轮播 → 详情页 携带的详情配置本地存储 key */
export const CASE_DETAIL_KEY = 'aisock_detail_config'

/** 首页轮播携带到详情页的详情内容（来自后台「首页主题配置」每张轮播的详情页配置） */
export interface CaseDetailPayload {
  navTitle?: string
  seriesTitle?: string
  description?: string
  cover?: string
  slides?: string[]
  gallery?: string[]
}

/** 暂存首页轮播对应的详情页配置，供详情页读取后渲染 */
export function stashCaseDetail(payload: CaseDetailPayload): void {
  try {
    uni.setStorageSync(CASE_DETAIL_KEY, JSON.stringify(payload))
  } catch {
    /* 存储失败时详情页走默认/花型配置兜底 */
  }
}

/** 读取并清除首页轮播暂存的详情页配置（只消费一次） */
export function takeCaseDetail(): CaseDetailPayload | null {
  try {
    const raw = uni.getStorageSync(CASE_DETAIL_KEY)
    if (!raw) return null
    uni.removeStorageSync(CASE_DETAIL_KEY)
    return JSON.parse(raw) as CaseDetailPayload
  } catch {
    return null
  }
}
