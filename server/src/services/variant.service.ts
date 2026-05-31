/**
 * 款式衍生 / 亲子袜 —— 变体「配方」服务（服务端权威，运营可控、多端一致）。
 *
 * 设计取舍：预览图必须在客户端用 canvas 渲染（服务端无低成本渲染），
 * 但「用哪几套配色 + 调节参数」这类策划决策由服务端统一下发，
 * 客户端只负责把配方套用到「当前印花」上渲染预览。
 * 这样：① 衍生保留用户当前印花（含 AI 生成图）；② 配色方案可后台调整；③ web/小程序一致。
 */

export interface VariantColors {
  bodyHex: string
  weltHex: string
  heelHex: string
  toeHex: string
}

export interface VariantParams {
  density: number
  rotation: number
  singleMode: boolean
  tileDensity: number
}

export interface VariantRecipe {
  id: string
  /** 展示名，如「同款·暖调」 */
  name: string
  /** 配色方案名，如「朱砂 + 沙金」 */
  scheme: string
  colors: VariantColors
  params: VariantParams
  /** 亲子袜区分成人/儿童 */
  tag?: 'adult' | 'kid'
}

/** 款式衍生：同一印花的不同配色 + 排布方案（策划精选，非随机） */
const DERIVE_SCHEMES: Omit<VariantRecipe, 'id'>[] = [
  {
    name: '同款·暖调', scheme: '朱砂 + 沙金',
    colors: { bodyHex: '#f6f1e7', weltHex: '#c5483c', heelHex: '#a05a3c', toeHex: '#a05a3c' },
    params: { density: 100, rotation: 0, singleMode: true, tileDensity: 3 },
  },
  {
    name: '同款·冷调', scheme: '螺青 + 月白',
    colors: { bodyHex: '#eef2f6', weltHex: '#3a5a8a', heelHex: '#3a6fa3', toeHex: '#3a6fa3' },
    params: { density: 100, rotation: 12, singleMode: false, tileDensity: 3 },
  },
  {
    name: '同款·撞色', scheme: '帝王红 + 松绿',
    colors: { bodyHex: '#3f6f5a', weltHex: '#c5482b', heelHex: '#dfc28a', toeHex: '#dfc28a' },
    params: { density: 110, rotation: -18, singleMode: false, tileDensity: 4 },
  },
  {
    name: '同款·低饱和', scheme: '莫兰迪灰粉',
    colors: { bodyHex: '#dad1c4', weltHex: '#8a7e75', heelHex: '#bcb0c0', toeHex: '#bcb0c0' },
    params: { density: 90, rotation: 0, singleMode: true, tileDensity: 3 },
  },
]

/** 生成 N 套款式衍生配方（1~4） */
export function deriveStyleVariants(count: number): VariantRecipe[] {
  const n = Math.max(1, Math.min(DERIVE_SCHEMES.length, count || 2))
  return DERIVE_SCHEMES.slice(0, n).map((s, i) => ({ id: `derive-${i}`, ...s }))
}

/** 亲子袜：成人款 + 儿童款（同印花，配色/排布按年龄区分） */
export function deriveFamilyPair(): VariantRecipe[] {
  return [
    {
      id: 'adult', name: '成人款', scheme: '沉稳深色', tag: 'adult',
      colors: { bodyHex: '#2f3a52', weltHex: '#dfc28a', heelHex: '#dfc28a', toeHex: '#dfc28a' },
      params: { density: 100, rotation: 0, singleMode: true, tileDensity: 3 },
    },
    {
      id: 'kid', name: '儿童款', scheme: '糖果柔粉', tag: 'kid',
      colors: { bodyHex: '#f0b8c4', weltHex: '#a4d4b9', heelHex: '#a4d4b9', toeHex: '#a4d4b9' },
      params: { density: 80, rotation: 0, singleMode: false, tileDensity: 4 },
    },
  ]
}
