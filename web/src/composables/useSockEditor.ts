/**
 * 设计器状态机 — 把袜版编辑的全部响应式状态与派生逻辑收敛到一个组合式函数，
 * 让 Editor.vue 只负责编排，组件只负责渲染。
 *
 * 职责：
 *   - 印花（图片 / 内置花型 → 统一转 dataURL）、印花名
 *   - 调节参数（缩放/旋转/单张-平铺/平铺密度）
 *   - 四区颜色（袜身/螺口/袜跟/袜头）
 *   - 色卡映射（id + 强度，异步算图带缓存，派生 finalPrintImage）
 *   - 应用衍生设计（一次性回填印花+颜色+参数）
 */
import { computed, reactive, ref, watch } from 'vue'
import {
  DEFAULT_COLORS,
  DEFAULT_PARAMS,
  applyPaletteMapping,
  patternToImageURL,
  hasPatternDef,
  type SockColors,
  type SockParams,
} from '@/engine'
import { COLOR_PALETTES, DEFAULT_SOCK_TYPE_ID } from '@/data/editor'

const PALETTE_MAP = Object.fromEntries(COLOR_PALETTES.map((p) => [p.id, p]))

export interface AppliedDesign {
  printImage?: string | null
  printName?: string
  colors?: Partial<SockColors>
  params?: Partial<SockParams>
}

export function useSockEditor() {
  const sockTypeId = ref(DEFAULT_SOCK_TYPE_ID)
  const printImage = ref<string | null>(null)
  const printName = ref('')
  const params = reactive<SockParams>({ ...DEFAULT_PARAMS })
  const colors = reactive<SockColors>({ ...DEFAULT_COLORS })
  const paletteId = ref<string | null>(null)
  const paletteStrength = ref(80)

  const hasPrint = computed(() => !!printImage.value)

  // ── 色卡映射：异步算图 → mappedImage，派生 finalPrintImage ──
  const mappedImage = ref<{ key: string; url: string | null }>({ key: '', url: null })
  const mappingKey = computed(() => {
    if (!printImage.value || !paletteId.value || paletteStrength.value <= 0) return ''
    return `${printImage.value.slice(0, 60)}|${paletteId.value}|${paletteStrength.value}`
  })

  watch(mappingKey, (key) => {
    if (!key || !paletteId.value || !printImage.value) return
    const palette = PALETTE_MAP[paletteId.value]
    if (!palette) return
    const src = printImage.value
    applyPaletteMapping(src, palette, paletteStrength.value / 100).then((url) => {
      if (mappingKey.value === key) mappedImage.value = { key, url }
    })
  })

  const finalPrintImage = computed<string | null>(() => {
    if (!printImage.value) return null
    if (!mappingKey.value) return printImage.value
    if (mappedImage.value.key === mappingKey.value && mappedImage.value.url) return mappedImage.value.url
    return printImage.value
  })

  // ── 应用印花：图片 URL / 内置花型 id（pattern:xxx 或裸 id）统一转图 ──
  function applyImage(url: string, name = '') {
    if (url?.startsWith('pattern:')) {
      const pid = url.slice('pattern:'.length)
      printImage.value = patternToImageURL(pid, 480) || null
    } else if (hasPatternDef(url)) {
      printImage.value = patternToImageURL(url, 480) || null
    } else {
      printImage.value = url || null
    }
    printName.value = name || ''
  }
  function applyPattern(patternId: string, name = '') {
    printImage.value = patternToImageURL(patternId, 480) || null
    printName.value = name || ''
  }

  function clearPrint() {
    printImage.value = null
    printName.value = ''
    paletteId.value = null
  }
  function resetParams() {
    Object.assign(params, DEFAULT_PARAMS)
    Object.assign(colors, DEFAULT_COLORS)
    paletteId.value = null
  }

  function setColors(next: SockColors) {
    Object.assign(colors, next)
  }
  function setParams(next: SockParams) {
    Object.assign(params, next)
  }

  /** 应用衍生 / 亲子设计：一次性回填整套设计 */
  function applyDesign(design: AppliedDesign) {
    if (design.printImage !== undefined) printImage.value = design.printImage
    if (design.printName !== undefined) printName.value = design.printName
    Object.assign(colors, DEFAULT_COLORS, design.colors || {})
    Object.assign(params, DEFAULT_PARAMS, design.params || {})
    paletteId.value = null
  }

  /** 从设计快照还原整套编辑器状态（继续编辑已存设计） */
  function restoreSnapshot(snap: {
    sockTypeId?: string
    printImage?: string | null
    printName?: string
    params?: Partial<SockParams>
    colors?: Partial<SockColors>
    paletteId?: string | null
    paletteStrength?: number
  }) {
    if (snap.sockTypeId) sockTypeId.value = snap.sockTypeId
    if (snap.printImage !== undefined) printImage.value = snap.printImage
    if (snap.printName !== undefined) printName.value = snap.printName
    if (snap.params) Object.assign(params, DEFAULT_PARAMS, snap.params)
    if (snap.colors) Object.assign(colors, DEFAULT_COLORS, snap.colors)
    paletteId.value = snap.paletteId ?? null
    if (typeof snap.paletteStrength === 'number') paletteStrength.value = snap.paletteStrength
  }

  const composeName = () => (printName.value ? `${printName.value} 袜款` : '未命名袜版')

  return {
    // state
    sockTypeId,
    printImage,
    printName,
    params,
    colors,
    paletteId,
    paletteStrength,
    // derived
    hasPrint,
    finalPrintImage,
    composeName,
    // actions
    applyImage,
    applyPattern,
    clearPrint,
    resetParams,
    setColors,
    setParams,
    applyDesign,
    restoreSnapshot,
  }
}
