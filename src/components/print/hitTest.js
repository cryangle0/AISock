// 袜版命中测试 — 给定 canvas 像素坐标，返回所点中的区域 key
//
// 使用 useSockResources 输出的 mask（bodyMask / weltMask / heelMask / toeMask），
// 这些都是与 sock 同尺寸的 Uint8Array(1=可印 / 0=非)。
// 命中优先级：welt > heel > toe > body（防止包含关系误判）

const HIT_ORDER = ['welt', 'heel', 'toe', 'body']

const MASK_KEYS = {
  welt: 'weltMask',
  heel: 'heelMask',
  toe:  'toeMask',
  body: 'bodyMask',
}

/**
 * @param {object} resources  useSockResources state
 * @param {number} x          canvas 内 x 坐标（已转换为像素，0..width）
 * @param {number} y          canvas 内 y 坐标（已转换为像素，0..height）
 * @returns {'body'|'welt'|'heel'|'toe'|null}
 */
export function hitTestRegion(resources, x, y) {
  if (!resources?.ready) return null
  const w = resources.meta.width
  const h = resources.meta.height
  const ix = Math.round(x)
  const iy = Math.round(y)
  if (ix < 0 || iy < 0 || ix >= w || iy >= h) return null
  const idx = iy * w + ix
  for (const key of HIT_ORDER) {
    const mask = resources[MASK_KEYS[key]]
    if (mask && mask[idx] === 1) return key
  }
  return null
}

/**
 * 区域 key → 对应 colors 字段名 + 中文名
 */
export const REGION_INFO = {
  body: { colorKey: 'bodyHex', label: '袜身底色' },
  welt: { colorKey: 'weltHex', label: '螺口' },
  heel: { colorKey: 'heelHex', label: '袜跟' },
  toe:  { colorKey: 'toeHex',  label: '袜头' },
}
