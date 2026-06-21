/**
 * 发现页配图 + 商品详情默认内容（app_config 键 feed_discover / product_detail）
 */
import { getPublicValue } from './config.service.js'

export interface DiscoverImageSlot {
  id: string
  title?: string
  cover?: string
  en?: string
  desc?: string
}

export interface FeedDiscoverImages {
  hero: string
  modelA: string
  modelB: string
  sockA: string
  sockB: string
  /** 浏览页顶部 NavBar 大标题（默认「发现」） */
  navTitle: string
  /** 每个主题 Tab 下展示的花型条数（1–50，默认 10） */
  pageSize: number
}

export interface ProductDetailDefault {
  navTitle: string
  seriesTitle: string
  description: string
  cover: string
  slides: string[]
  gallery: string[]
}

const DEFAULT_DISCOVER_SLOTS: DiscoverImageSlot[] = [
  { id: 'nav_title', title: '发现' },
  { id: 'list_size', title: '展示数量', en: '10' },
  { id: 'hero', title: '顶部背景', cover: 'https://onnsa.cn/aisock/static/images/feed-hero.webp' },
  { id: 'model_a', title: '模特A', cover: '/static/discover/model-a.png' },
  { id: 'model_b', title: '模特B', cover: '/static/discover/model-b.png' },
  { id: 'sock_a', title: '袜子A', cover: '/static/discover/sock-a.png' },
  { id: 'sock_b', title: '袜子B', cover: '/static/discover/sock-b.png' },
]


function clampPageSize(raw: string): number {
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n)) return 10
  return Math.min(50, Math.max(1, n))
}

function pickPageSize(slot: DiscoverImageSlot | undefined): number {
  if (!slot) return 10
  const fromEn = slot.en?.trim()
  if (fromEn) return clampPageSize(fromEn)
  const fromTitle = slot.title?.trim()
  if (fromTitle && /^\d+$/.test(fromTitle)) return clampPageSize(fromTitle)
  return 10
}

const DEFAULT_DETAIL_SLOTS: DiscoverImageSlot[] = [
  {
    id: 'main',
    title: '袜版定制 · 杭城',
    en: '杭城袜韵',
    cover: 'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-hero.webp',
    desc: '将杭州城市文化融入袜品设计\n舒适与美学兼具\n传递城市温度与品质生活',
  },
  { id: 'slide_2', cover: 'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-hero.webp' },
  { id: 'slide_3', cover: 'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-hero.webp' },
  { id: 'slide_4', cover: 'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-hero.webp' },
  { id: 'grid_1', cover: 'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-1.webp' },
  { id: 'grid_2', cover: 'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-2.webp' },
  { id: 'grid_3', cover: 'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-3.webp' },
]

function slotMap(slots: DiscoverImageSlot[]): Record<string, DiscoverImageSlot> {
  const m: Record<string, DiscoverImageSlot> = {}
  for (const s of slots) m[s.id] = s
  return m
}

function pickCover(m: Record<string, DiscoverImageSlot>, id: string, fallback: string): string {
  const c = m[id]?.cover?.trim()
  return c || fallback
}

export function parseFeedDiscover(slots: DiscoverImageSlot[]): FeedDiscoverImages {
  const m = slotMap(slots)
  const heroFb = pickCover(m, 'hero', 'https://onnsa.cn/aisock/static/images/feed-hero.webp')
  const navSlot = m.nav_title
  const sizeSlot = m.list_size
  return {
    hero: heroFb,
    modelA: pickCover(m, 'model_a', '/static/discover/model-a.png'),
    modelB: pickCover(m, 'model_b', '/static/discover/model-b.png'),
    sockA: pickCover(m, 'sock_a', '/static/discover/sock-a.png'),
    sockB: pickCover(m, 'sock_b', '/static/discover/sock-b.png'),
    navTitle: (navSlot?.title?.trim() || '发现'),
    pageSize: pickPageSize(sizeSlot),
  }
}

export function parseProductDetail(slots: DiscoverImageSlot[]): ProductDetailDefault {
  const m = slotMap(slots)
  const main = m.main
  const coverFb = pickCover(m, 'main', 'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-hero.webp')
  const slides = ['main', 'slide_2', 'slide_3', 'slide_4']
    .map((id) => pickCover(m, id, coverFb))
    .filter(Boolean)
  const gallery = ['grid_1', 'grid_2', 'grid_3']
    .map((id) => pickCover(m, id, ''))
    .filter(Boolean)
  return {
    navTitle: main?.title?.trim() || '袜版定制 · 杭城',
    seriesTitle: (main?.en as string | undefined)?.trim() || '杭城袜韵',
    description: (main?.desc as string | undefined)?.trim() || '将杭州城市文化融入袜品设计\n舒适与美学兼具\n传递城市温度与品质生活',
    cover: coverFb,
    slides: slides.length ? slides : [coverFb],
    gallery: gallery.length ? gallery : [
      'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-1.webp',
      'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-2.webp',
      'https://onnsa.cn/aisock/pkg/static/detail/hangzhou-3.webp',
    ],
  }
}

export async function getFeedDiscoverBundle(): Promise<{ discover: FeedDiscoverImages; detail: ProductDetailDefault }> {
  const [discoverSlots, detailSlots] = await Promise.all([
    getPublicValue<DiscoverImageSlot[]>('feed_discover', DEFAULT_DISCOVER_SLOTS),
    getPublicValue<DiscoverImageSlot[]>('product_detail', DEFAULT_DETAIL_SLOTS),
  ])
  return {
    discover: parseFeedDiscover(discoverSlots),
    detail: parseProductDetail(detailSlots),
  }
}
