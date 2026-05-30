/**
 * 款式衍生 / 亲子袜 — 基于当前完整设计（印花 + 各部位颜色 + 调节参数）生成整套变体，
 * 每套都离屏渲染出完整袜版预览图，应用时可一次性回填印花/颜色/参数。
 */
import { PATTERN_LIST } from '@/data/editor'
import { patternToImageURL } from './patternImage'
import { renderSockToDataURL } from './sockRenderer'
import type { SockColors, SockParams, SockResources } from './types'

export interface DesignVariant {
  id: string
  label: string
  scheme: string
  pattern: string
  printImage: string
  printName: string
  colors: SockColors
  params: SockParams
  cover: string
  tag?: string
}

interface BaseDesign {
  printName?: string
  colors?: Partial<SockColors>
  params?: Partial<SockParams>
}

const COLOR_SCHEMES = [
  { id: 'classic', name: '经典米白', body: '#f6f1e7', welt: '#3f6f5a', heel: '#3f6f5a', toe: '#3f6f5a' },
  { id: 'vintage', name: '复古驼色', body: '#c9a982', welt: '#5b4d44', heel: '#5b4d44', toe: '#5b4d44' },
  { id: 'mono', name: '极简黑灰', body: '#1a1c20', welt: '#9aa0a8', heel: '#9aa0a8', toe: '#9aa0a8' },
  { id: 'pastel', name: '糖果柔粉', body: '#f0b8c4', welt: '#a4d4b9', heel: '#a4d4b9', toe: '#a4d4b9' },
  { id: 'navy', name: '海军学院', body: '#2f3a52', welt: '#dfc28a', heel: '#dfc28a', toe: '#dfc28a' },
  { id: 'forest', name: '森系松绿', body: '#3f6f5a', welt: '#efe4cc', heel: '#a05a3c', toe: '#a05a3c' },
  { id: 'mustard', name: '芥末暖意', body: '#c79b54', welt: '#1a1c20', heel: '#1a1c20', toe: '#1a1c20' },
  { id: 'sky', name: '云雾天蓝', body: '#a8c9e3', welt: '#2f3a52', heel: '#2f3a52', toe: '#2f3a52' },
]

const ROTATION_BUCKET = [0, 12, -18, 28, -30, 45, -45, 90]

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let rnd = seed || Date.now()
  for (let i = a.length - 1; i > 0; i -= 1) {
    rnd = (rnd * 9301 + 49297) % 233280
    const j = Math.floor((rnd / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 生成 N 套款式变体（含离屏渲染好的 cover） */
export async function deriveStyleVariants(
  baseDesign: BaseDesign,
  count: number,
  resources: SockResources | null,
): Promise<DesignVariant[]> {
  if (!resources?.ready) return []
  const seed = Date.now() % 9999
  const patterns = shuffle(PATTERN_LIST, seed).slice(0, count)
  const schemes = shuffle(COLOR_SCHEMES, seed + 1).slice(0, count)

  return Promise.all(
    patterns.map(async (p, i) => {
      const scheme = schemes[i]
      const colors: SockColors = { bodyHex: scheme.body, weltHex: scheme.welt, heelHex: scheme.heel, toeHex: scheme.toe }
      const baseDensity = baseDesign?.params?.density ?? 100
      const density = Math.max(60, Math.min(260, Math.round(baseDensity * (0.85 + ((i * 17) % 30) / 100))))
      const params: SockParams = {
        density,
        rotation: ROTATION_BUCKET[(i + (seed % 8)) % ROTATION_BUCKET.length],
        singleMode: i % 2 === 0 ? (baseDesign?.params?.singleMode ?? true) : false,
        tileDensity: 2 + (i % 3),
        debugMode: false,
      }
      const printImage = patternToImageURL(p.id, 320)
      const printName = `${p.name}·${scheme.name}`
      const cover = await renderSockToDataURL(resources, printImage, colors, params)
      return {
        id: `${p.id}-${scheme.id}-${i}`,
        label: printName,
        scheme: scheme.name,
        pattern: p.name,
        printImage,
        printName,
        colors,
        params,
        cover,
      }
    }),
  )
}

/** 亲子袜：成人款（保留当前设计）+ 儿童款（更柔的配色 + 更密平铺） */
export async function deriveFamilyPair(
  baseDesign: BaseDesign,
  resources: SockResources | null,
): Promise<DesignVariant[]> {
  if (!resources?.ready) return []
  const printName = baseDesign.printName || '亲子款'
  const printImage = patternToImageURL('p-flower-big', 320)

  const adultColors: SockColors = {
    bodyHex: baseDesign.colors?.bodyHex ?? '#2f3a52',
    weltHex: baseDesign.colors?.weltHex ?? '#dfc28a',
    heelHex: baseDesign.colors?.heelHex ?? '#dfc28a',
    toeHex: baseDesign.colors?.toeHex ?? '#dfc28a',
  }
  const kidColors: SockColors = { bodyHex: '#f0b8c4', weltHex: '#a4d4b9', heelHex: '#a4d4b9', toeHex: '#a4d4b9' }

  const adultParams: SockParams = {
    density: baseDesign.params?.density ?? 100,
    rotation: baseDesign.params?.rotation ?? 0,
    singleMode: baseDesign.params?.singleMode ?? true,
    tileDensity: 3,
    debugMode: false,
  }
  const kidParams: SockParams = { density: 80, rotation: 0, singleMode: false, tileDensity: 4, debugMode: false }

  const [adultCover, kidCover] = await Promise.all([
    renderSockToDataURL(resources, printImage, adultColors, adultParams),
    renderSockToDataURL(resources, printImage, kidColors, kidParams),
  ])

  return [
    { id: 'adult', label: `${printName} · 成人款`, scheme: '成人款', pattern: printName, printImage, printName: `${printName} 成人款`, colors: adultColors, params: adultParams, cover: adultCover, tag: 'adult' },
    { id: 'kid', label: `${printName} · 儿童款`, scheme: '儿童款', pattern: printName, printImage, printName: `${printName} 儿童款`, colors: kidColors, params: kidParams, cover: kidCover, tag: 'kid' },
  ]
}

export const STYLE_VARIANT_COUNTS = [1, 2, 4]
