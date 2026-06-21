/**
 * 袜版目录（单例）— 列表给选择器用（轻量，无几何），几何按需懒加载并缓存。
 * 数据来自后台 /api/v1/app/socks（DB sock_model，导入的 22 个真实袜版）。
 */
import { ref, computed } from 'vue'
import { catalogApi, type SockModel } from '@/api'
import { parseGeometry, type ParsedGeometry, type RawGeometry } from '@/engine'

const socks = ref<SockModel[]>([])
const loaded = ref(false)
const loading = ref(false)
const geoCache = new Map<string, ParsedGeometry | null>()

const GROUP_ORDER = ['成人', '大童', '小童']
function groupRank(name: string) {
  const i = GROUP_ORDER.findIndex((g) => name.includes(g))
  return i < 0 ? 9 : i
}

async function load() {
  if (loaded.value || loading.value) return
  loading.value = true
  try {
    const res = await catalogApi.listSocks()
    socks.value = res.data ?? []
    loaded.value = true
  } finally {
    loading.value = false
  }
}

/** 按板型分组（直板/弯板），组内按 人群→尺寸 排序 */
const families = computed(() => {
  const map = new Map<string, SockModel[]>()
  for (const s of socks.value) {
    const fam = s.family || '其他'
    if (!map.has(fam)) map.set(fam, [])
    map.get(fam)!.push(s)
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => groupRank(a.name) - groupRank(b.name) || (a.phys_height_mm ?? 0) - (b.phys_height_mm ?? 0))
  }
  // 直板在前、弯板在后
  return [...map.entries()].sort((a, b) => (a[0] === '直板' ? -1 : b[0] === '直板' ? 1 : 0))
})

async function getGeometry(code: string): Promise<ParsedGeometry | null> {
  if (geoCache.has(code)) return geoCache.get(code)!
  await load()
  const sock = socks.value.find((s) => s.code === code)
  if (!sock) { geoCache.set(code, null); return null }
  try {
    const detail = await catalogApi.getSock(sock.id)
    const raw = detail.data.geometry_json ? (JSON.parse(detail.data.geometry_json) as RawGeometry) : null
    const parsed = parseGeometry(raw)
    geoCache.set(code, parsed)
    return parsed
  } catch {
    geoCache.set(code, null)
    return null
  }
}

function findByCode(code: string) {
  return socks.value.find((s) => s.code === code) || null
}
function defaultCode(): string | null {
  return socks.value[0]?.code ?? null
}

export function useSockCatalog() {
  return { socks, families, loaded, loading, load, getGeometry, findByCode, defaultCode }
}
