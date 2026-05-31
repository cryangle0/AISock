/**
 * 设计快照序列化 —— 把编辑器完整状态打包成 regions JSON 存库，并能无损还原。
 * 结构与小程序端 designSnapshot 保持一致（v:1），保证同一后端数据两端通用。
 */
import type { SockColors, SockParams } from './types'

export interface DesignSnapshot {
  sockTypeId: string
  printImage: string | null
  printName: string
  params: SockParams
  colors: SockColors
  paletteId: string | null
  paletteStrength: number
}

/** 编辑器状态 → 可存库的 regions 对象 */
export function toRegions(s: DesignSnapshot): Record<string, unknown> {
  return {
    v: 1,
    sockTypeId: s.sockTypeId,
    printImage: s.printImage,
    printName: s.printName,
    params: { ...s.params },
    colors: { ...s.colors },
    paletteId: s.paletteId,
    paletteStrength: s.paletteStrength,
  }
}

/** 库里的 regions → 编辑器状态（带兜底，兼容老数据 / 小程序写入的快照） */
export function fromRegions(regions: Record<string, unknown> | null | undefined): Partial<DesignSnapshot> {
  if (!regions || typeof regions !== 'object') return {}
  const r = regions as Record<string, any>
  return {
    sockTypeId: typeof r.sockTypeId === 'string' ? r.sockTypeId : undefined,
    printImage: r.printImage ?? null,
    printName: typeof r.printName === 'string' ? r.printName : '',
    params: r.params && typeof r.params === 'object' ? r.params : undefined,
    colors: r.colors && typeof r.colors === 'object' ? r.colors : undefined,
    paletteId: r.paletteId ?? null,
    paletteStrength: typeof r.paletteStrength === 'number' ? r.paletteStrength : undefined,
  }
}
