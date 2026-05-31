/**
 * 款式衍生 / 亲子袜 编排 —— 配方来自服务端（运营可控、多端一致），
 * 客户端把配方套用到「用户当前印花」上渲染预览缩略图。
 *
 * 关键：衍生/亲子保留用户当前印花（含 AI 生成图），仅变化配色与排布，
 * 这样「应用此款 / 保存套装」能完整还原一套可再编辑的设计。
 */
import { aiApi } from '@aisock/service'
import type { VariantRecipe } from '@aisock/service'
import type { SockColors, SockParams } from '@/components/editor/sockShape'
import { renderVariantCover } from './variantRender'

/** 一个可应用 / 可保存的完整变体设计 */
export interface DesignVariant {
  id: string
  /** 展示名 */
  name: string
  /** 配色方案名 */
  scheme: string
  patternId: string | null
  printImage: string | null
  printName: string
  colors: SockColors
  params: SockParams
  /** 预览缩略图临时路径 */
  cover: string
  tag?: 'adult' | 'kid'
}

/** 当前编辑器的印花基线（衍生/亲子都基于它，仅替换配色与参数） */
export interface VariantBase {
  printName?: string
  patternId?: string | null
  printImage?: string | null
}

/** 把一条服务端配方 + 当前印花 组合成完整变体（含预览渲染） */
async function recipeToVariant(recipe: VariantRecipe, base: VariantBase): Promise<DesignVariant> {
  const colors: SockColors = { ...recipe.colors }
  const params: SockParams = { ...recipe.params }
  const cover = await renderVariantCover({
    patternId: base.patternId ?? null,
    printImage: base.printImage ?? null,
    colors,
    params,
  })
  const baseName = base.printName || '袜款'
  return {
    id: recipe.id,
    name: `${baseName} · ${recipe.name}`,
    scheme: recipe.scheme,
    patternId: base.patternId ?? null,
    printImage: base.printImage ?? null,
    printName: base.printName || '',
    colors,
    params,
    cover,
    tag: recipe.tag,
  }
}

/** 款式衍生：取 N 套配方并渲染（并行渲染提升速度） */
export async function generateDeriveVariants(base: VariantBase, count: number): Promise<DesignVariant[]> {
  const res = await aiApi.derive(count)
  return Promise.all(res.data.map((r) => recipeToVariant(r, base)))
}

/** 亲子袜：成人 + 儿童两款 */
export async function generateFamilyVariants(base: VariantBase): Promise<DesignVariant[]> {
  const res = await aiApi.family()
  return Promise.all(res.data.map((r) => recipeToVariant(r, base)))
}
