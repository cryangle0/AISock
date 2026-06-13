/**
 * 设计快照序列化 —— 把编辑器完整状态打包成 regions JSON 存库，
 * 以及从库里的 regions 还原回编辑器状态。保证"保存 → 再打开继续编辑"无损。
 */
import type { SockColors, SockParams } from '@/components/editor/sockShape'

export interface DesignSnapshot {
  sockTypeId: string
  patternId: string | null
  printImage: string | null
  printName: string
  params: SockParams
  colors: SockColors
  paletteId: string | null
}

/** 编辑器状态 → 可存库的 regions 对象 */
export function toRegions(s: DesignSnapshot): Record<string, unknown> {
  return {
    v: 1,
    sockTypeId: s.sockTypeId,
    patternId: s.patternId,
    printImage: s.printImage,
    printName: s.printName,
    params: { ...s.params },
    colors: { ...s.colors },
    paletteId: s.paletteId,
  }
}

/** 库里的 regions → 编辑器状态（带默认值兜底，兼容老数据） */
export function fromRegions(regions: Record<string, unknown> | null | undefined): Partial<DesignSnapshot> {
  if (!regions || typeof regions !== 'object') return {}
  const r = regions as Record<string, any>
  return {
    sockTypeId: r.sockTypeId,
    patternId: r.patternId ?? null,
    printImage: r.printImage ?? null,
    printName: r.printName ?? '',
    params: r.params,
    colors: r.colors,
    paletteId: r.paletteId ?? null,
  }
}
