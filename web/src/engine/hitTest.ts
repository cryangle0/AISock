/**
 * 袜版命中测试 — 给定 canvas 像素坐标，返回点中的区域 key。
 * 命中优先级：welt > heel > toe > body（避免包含关系误判）。
 */
import type { SockResources } from './types'

export type SockRegion = 'body' | 'welt' | 'heel' | 'toe'

const HIT_ORDER: SockRegion[] = ['welt', 'heel', 'toe', 'body']

const MASK_KEYS: Record<SockRegion, keyof SockResources> = {
  welt: 'weltMask',
  heel: 'heelMask',
  toe: 'toeMask',
  body: 'bodyMask',
}

export function hitTestRegion(resources: SockResources | null, x: number, y: number): SockRegion | null {
  if (!resources?.ready) return null
  const w = resources.meta.width
  const h = resources.meta.height
  const ix = Math.round(x)
  const iy = Math.round(y)
  if (ix < 0 || iy < 0 || ix >= w || iy >= h) return null
  const idx = iy * w + ix
  for (const key of HIT_ORDER) {
    const mask = resources[MASK_KEYS[key]] as Uint8Array | null
    if (mask && mask[idx] === 1) return key
  }
  return null
}

export const REGION_INFO: Record<SockRegion, { colorKey: keyof import('./types').SockColors; label: string }> = {
  body: { colorKey: 'bodyHex', label: '袜身底色' },
  welt: { colorKey: 'weltHex', label: '螺口' },
  heel: { colorKey: 'heelHex', label: '袜跟' },
  toe: { colorKey: 'toeHex', label: '袜头' },
}
