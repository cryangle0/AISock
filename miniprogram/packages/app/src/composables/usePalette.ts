/**
 * 色卡 → 四区配色映射。
 *
 * 小程序矢量渲染按「区域纯色」上色（袜身/螺口/袜跟+袜头），无法做逐像素印花映射，
 * 因此色卡的语义定为：把色卡里的代表色按层次套用到四个区域，一键换整体配色方案。
 * 取色策略：色卡通常按「深→浅」或主辅排列，取对比合适的几个色位，保证可读性。
 */
import type { SockColors } from '@/components/editor/sockShape'

export interface PaletteLike {
  id: string
  name: string
  colors: string[]
}

/**
 * 由色卡推导四区配色：
 * - 袜身：取较浅色（末位通常是最浅底色），保证印花/分区可读
 * - 螺口：取一个中深主色
 * - 袜跟+袜头：取一个对比强调色
 * 兜底：色卡色数不足时循环取色。
 */
export function paletteToColors(palette: PaletteLike): SockColors {
  const c = palette.colors || []
  if (!c.length) return { bodyHex: null, weltHex: null, heelHex: null, toeHex: null }
  const at = (i: number) => c[((i % c.length) + c.length) % c.length]
  // 末位多为最浅底色；首/中位为主色与强调色
  const body = at(c.length - 1)
  const welt = at(0)
  const accent = at(Math.floor(c.length / 2))
  return { bodyHex: body, weltHex: welt, heelHex: accent, toeHex: accent }
}
