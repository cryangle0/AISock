/**
 * 商品/花型领域映射（Web 端浏览、详情、推荐共用）
 */
import type { Pattern } from '@/api'

/** 静态大图基址（与小程序 cdnImg 一致） */
export const CDN_BASE = 'https://onnsa.cn/aisock'

export const CUSTOMIZE_IMAGE_KEY = 'aisock_upload_image'

export function resolveCfgImg(url: string, fallback: string): string {
  const u = url?.trim()
  if (!u) return fallback
  if (/^https?:/i.test(u)) return u
  if (u.startsWith('/static/') || u.startsWith('/pkg/')) return `${CDN_BASE}${u}`
  return u
}

export function stashCustomizeCover(cover?: string | null): void {
  if (isRemoteCover(cover)) sessionStorage.setItem(CUSTOMIZE_IMAGE_KEY, cover!)
}

export interface BuyableProduct {
  patternId: number
  name: string
  cover: string
  categoryId: number | null
}

export function patternToProduct(p: Pattern): BuyableProduct {
  const display = p.display_config
  return {
    patternId: p.id,
    name: display?.feedTitle || p.name,
    cover: display?.feedCover || p.thumb_url || p.image_url,
    categoryId: p.category_id ?? null,
  }
}

export function isRemoteCover(cover?: string | null): boolean {
  return !!cover && /^https?:/i.test(cover)
}

export function detailRoute(patternId: number): { name: string; params: { id: string } } {
  return { name: 'ProductDetail', params: { id: String(patternId) } }
}

/** 从后台配置的 link 字段解析花型 ID（支持 pattern:5、/product/5、?id=5） */
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
