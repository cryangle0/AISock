/**
 * 变体预览离屏渲染 —— 纯渲染工具，与数据来源解耦。
 * 把「印花 + 配色 + 参数」渲染成一张临时图片路径，用于衍生/亲子袜预览缩略图。
 */
import { drawSock, type SockColors, type SockParams } from '@/components/editor/sockShape'
import { drawPatternTexture } from '@/components/editor/patternDraw'

/** 预览缩略图尺寸（逻辑像素，渲染时 ×2 提升清晰度） */
const PREVIEW_W = 150
const PREVIEW_H = 200

export interface RenderInput {
  /** 内置花型 id（与 AI 图二选一） */
  patternId?: string | null
  /** AI 生成 / 上传的印花图 URL（优先级高于内置花型） */
  printImage?: string | null
  colors: SockColors
  params: SockParams
}

/** 创建离屏 canvas（失败返回 null，调用方兜底） */
function createOffscreen(width: number, height: number): any {
  return (uni as any).createOffscreenCanvas?.({ type: '2d', width, height }) ?? null
}

/** 把印花图 URL 加载为 canvas image 源 */
function loadImage(canvas: any, url: string): Promise<any> {
  return new Promise((resolve) => {
    try {
      const img = canvas.createImage()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = url
    } catch {
      resolve(null)
    }
  })
}

/** 构建印花图源：优先 AI/上传图，其次内置花型纹理 */
async function buildPrintSource(canvas: any, input: RenderInput): Promise<any> {
  if (input.printImage) {
    const img = await loadImage(canvas, input.printImage)
    if (img) return img
  }
  if (input.patternId) {
    const pat = createOffscreen(200, 200)
    if (pat) {
      drawPatternTexture(pat, pat.getContext('2d'), 200, input.patternId)
      return pat
    }
  }
  return null
}

/** 渲染单个变体预览 → 临时文件路径（失败返回空串，不阻断业务） */
export function renderVariantCover(input: RenderInput): Promise<string> {
  return new Promise(async (resolve) => {
    try {
      const off = createOffscreen(PREVIEW_W * 2, PREVIEW_H * 2)
      if (!off) return resolve('')
      const ctx = off.getContext('2d')
      ctx.scale(2, 2)
      const printSrc = await buildPrintSource(off, input)
      drawSock(ctx, PREVIEW_W, PREVIEW_H, input.colors, input.params, printSrc)
      ;(uni.canvasToTempFilePath as any)({
        canvas: off,
        success: (r: any) => resolve(r.tempFilePath || ''),
        fail: () => resolve(''),
      })
    } catch {
      resolve('')
    }
  })
}
