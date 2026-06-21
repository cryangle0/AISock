/**
 * 目录数据（袜型 / 花型）— 后端公共库 + 内置矢量花型，与小程序对齐。
 */
import { ref } from 'vue'
import { catalogApi, type PatternCategory } from '@/api'
import { PATTERN_LIST } from '@/data/editor'
import { parseGeometry, type ParsedGeometry } from '@/engine'

export interface EditorSock {
  id: string
  name: string
  desc: string
  family: string | null
  _id: number
}

export interface EditorPattern {
  key: string
  name: string
  kind: 'builtin' | 'image'
  patternId?: string
  imageUrl?: string
  categoryId?: number | null
  bg: string
  fg: string
}

const BUILTIN_PATTERNS: EditorPattern[] = PATTERN_LIST.map((p) => ({
  key: p.id,
  name: p.name,
  kind: 'builtin',
  patternId: p.id,
  bg: p.bg,
  fg: p.fg,
}))

const socks = ref<EditorSock[]>([])
const patterns = ref<EditorPattern[]>(BUILTIN_PATTERNS)
const categories = ref<PatternCategory[]>([])
const geoCache = new Map<string, ParsedGeometry | null>()
let loaded = false
let loading: Promise<void> | null = null

async function fetchCatalog(): Promise<void> {
  try {
    const res = await catalogApi.listSocks()
    if (res.data?.length) {
      socks.value = res.data.map((s) => ({
        id: s.code || String(s.id),
        name: s.name,
        desc: s.craft || `起订 ${s.min_order} 双`,
        family: s.family ?? null,
        _id: s.id,
      }))
    }
  } catch {
    /* 保留空 */
  }

  try {
    const res = await catalogApi.listCategories()
    categories.value = res.data ?? []
  } catch {
    categories.value = []
  }

  try {
    const res = await catalogApi.listPatterns({ pageNum: 1, pageSize: 80 })
    const serverPatterns: EditorPattern[] = (res.data?.list ?? []).map((p) => ({
      key: `srv-${p.id}`,
      name: p.name,
      kind: 'image',
      imageUrl: p.image_url,
      categoryId: p.category_id ?? null,
      bg: '#f4ece0',
      fg: '#c08a5a',
    }))
    patterns.value = [...BUILTIN_PATTERNS, ...serverPatterns]
  } catch {
    patterns.value = BUILTIN_PATTERNS
  }
}

export function useCatalog() {
  async function ensureLoaded(): Promise<void> {
    if (loaded) return
    if (!loading) {
      loading = fetchCatalog().finally(() => {
        loaded = true
        loading = null
      })
    }
    return loading
  }

  async function getGeometry(code: string): Promise<ParsedGeometry | null> {
    if (geoCache.has(code)) return geoCache.get(code)!
    await ensureLoaded()
    const sock = socks.value.find((s) => s.id === code)
    if (!sock?._id) {
      geoCache.set(code, null)
      return null
    }
    try {
      const res = await catalogApi.getSock(sock._id)
      const raw = res.data?.geometry_json ? JSON.parse(res.data.geometry_json) : null
      const geo = parseGeometry(raw)
      geoCache.set(code, geo)
      return geo
    } catch {
      geoCache.set(code, null)
      return null
    }
  }

  return { socks, patterns, categories, ensureLoaded, getGeometry }
}
