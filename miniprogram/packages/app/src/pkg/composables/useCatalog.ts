/**
 * 目录数据（袜型 / 花型）—— 后端优先 + 本地兜底，运营后台可控、且永不空屏。
 *
 * 设计要点：
 * - 袜型：后端 sock_model → 选择条；后端无数据时回退本地 SOCK_TYPES。
 * - 花型：内置矢量花型（canvas 引擎渲染）与后端公共图案（图片印花）统一为 EditorPattern，
 *   内置款走 patternId 矢量渲染，图片款走 printImage 贴图渲染，二者在编辑器无缝并列。
 * - 全局缓存（模块级），多页面共享，避免重复请求。
 */
import { ref } from 'vue'
import { catalogApi } from '@aisock/service'
import { SOCK_TYPES, PATTERN_LIST, DEFAULT_SOCK_TYPE_ID } from '@aisock/common'

/** 编辑器袜型选项（统一模型） */
export interface EditorSock {
  id: string
  name: string
  desc: string
}

/** 编辑器花型选项（内置矢量 or 后端图片，统一模型） */
export interface EditorPattern {
  /** 唯一键 */
  key: string
  name: string
  kind: 'builtin' | 'image'
  /** 内置矢量花型 id（kind=builtin 时有效，驱动 canvas 引擎） */
  patternId?: string
  /** 图片印花 URL（kind=image 时有效，走 printImage 贴图） */
  imageUrl?: string
  /** 缩略背景 / 前景色（用于网格小卡展示） */
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

const FALLBACK_SOCKS: EditorSock[] = SOCK_TYPES.map((s) => ({ id: s.id, name: s.name, desc: s.desc }))

// ── 模块级缓存（跨页面共享，仅首次请求）──
const socks = ref<EditorSock[]>(FALLBACK_SOCKS)
const patterns = ref<EditorPattern[]>(BUILTIN_PATTERNS)
let loaded = false
let loading: Promise<void> | null = null

async function fetchCatalog(): Promise<void> {
  // 袜型：后端有数据则替换，否则保留本地兜底
  try {
    const res = await catalogApi.listSocks()
    if (res.data?.length) {
      socks.value = res.data.map((s) => ({
        id: s.code || String(s.id),
        name: s.name,
        desc: s.craft || `起订 ${s.min_order} 双`,
      }))
    }
  } catch {
    /* 保留本地兜底 */
  }

  // 公共花型：后端图片款追加到内置矢量款之后
  try {
    const res = await catalogApi.listPatterns({ pageNum: 1, pageSize: 60 })
    const serverPatterns: EditorPattern[] = (res.data?.list ?? []).map((p) => ({
      key: `srv-${p.id}`,
      name: p.name,
      kind: 'image',
      imageUrl: p.image_url,
      bg: '#f4ece0',
      fg: '#c08a5a',
    }))
    patterns.value = [...BUILTIN_PATTERNS, ...serverPatterns]
  } catch {
    /* 保留内置 */
  }
}

/** 确保目录已加载（幂等；并发调用复用同一请求） */
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

  return { socks, patterns, defaultSockId: DEFAULT_SOCK_TYPE_ID, ensureLoaded }
}
