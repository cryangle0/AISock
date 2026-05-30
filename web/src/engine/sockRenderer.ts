/**
 * 袜版合成渲染 — 纯函数，与组件解耦。
 * 渲染顺序：sock 底图 → 袜身底色 → 螺口色 → 袜跟/袜头色 → 印花(按 bodyMask 裁剪) → lineart 叠加 → debug。
 */
import { loadImage } from './imageLoader'
import type { BinaryMask, SockColors, SockParams, SockResources } from './types'

interface RGB {
  r: number
  g: number
  b: number
}

const HEX_RGB_CACHE = new Map<string, RGB>()

function hexToRgb(hex: string | null): RGB | null {
  if (!hex) return null
  const cached = HEX_RGB_CACHE.get(hex)
  if (cached) return cached
  const m = hex.replace('#', '')
  const v =
    m.length === 3
      ? m.split('').map((ch) => parseInt(ch + ch, 16))
      : [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)]
  const o = { r: v[0], g: v[1], b: v[2] }
  HEX_RGB_CACHE.set(hex, o)
  return o
}

function fillMaskWithColor(
  mask: Uint8Array,
  sockPixels: Uint8ClampedArray | null,
  rgb: RGB,
  w: number,
  h: number,
): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const imgData = ctx.createImageData(w, h)
  const d = imgData.data
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i] !== 1) continue
    const idx = i * 4
    if (sockPixels && sockPixels[idx + 3] === 0) continue
    d[idx] = rgb.r
    d[idx + 1] = rgb.g
    d[idx + 2] = rgb.b
    d[idx + 3] = 255
  }
  ctx.putImageData(imgData, 0, 0)
  return c
}

/** 印花主色调（缩到 100×100 量化） */
function extractDominantColor(image: HTMLImageElement): RGB {
  const c = document.createElement('canvas')
  const size = 100
  c.width = size
  c.height = size
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(image, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  const map = new Map<number, number>()
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 128) continue
    const r = (data[i] >> 5) << 5
    const g = (data[i + 1] >> 5) << 5
    const b = (data[i + 2] >> 5) << 5
    const key = (r << 16) | (g << 8) | b
    map.set(key, (map.get(key) || 0) + 1)
  }
  let bestKey = -1
  let bestCount = 0
  for (const [k, v] of map.entries()) {
    if (v > bestCount) {
      bestCount = v
      bestKey = k
    }
  }
  if (bestKey < 0) return { r: 200, g: 200, b: 200 }
  return { r: (bestKey >> 16) & 0xff, g: (bestKey >> 8) & 0xff, b: bestKey & 0xff }
}

function drawPatternOnRegion(
  ctx: CanvasRenderingContext2D,
  pattern: HTMLImageElement,
  mask: BinaryMask,
  maskCanvas: HTMLCanvasElement,
  params: SockParams,
  w: number,
  h: number,
): void {
  const { bounds } = mask
  const sockW = bounds.maxX - bounds.minX
  const sockH = bounds.maxY - bounds.minY
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2

  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = w
  patternCanvas.height = h
  const pctx = patternCanvas.getContext('2d')!
  const rad = (params.rotation * Math.PI) / 180
  const scale = params.density / 100
  const ratio = pattern.width / pattern.height

  pctx.save()
  pctx.translate(cx, cy)
  pctx.rotate(rad)

  if (params.singleMode) {
    let drawW: number
    let drawH: number
    const sockRatio = sockW / sockH
    if (ratio > sockRatio) {
      drawH = sockH * scale
      drawW = drawH * ratio
    } else {
      drawW = sockW * scale
      drawH = drawW / ratio
    }
    pctx.drawImage(pattern, -drawW / 2, -drawH / 2, drawW, drawH)
  } else {
    const tileDensity = params.tileDensity || 3
    const baseSize = ((ratio > 1 ? sockW : sockH) / tileDensity) * scale
    const singleW = baseSize
    const singleH = baseSize / ratio
    const cols = Math.ceil(sockW / singleW) + 2
    const rows = Math.ceil(sockH / singleH) + 2
    const startX = -(cols * singleW) / 2
    const startY = -(rows * singleH) / 2
    for (let r = 0; r < rows; r += 1) {
      for (let cc = 0; cc < cols; cc += 1) {
        pctx.drawImage(pattern, startX + cc * singleW, startY + r * singleH, singleW, singleH)
      }
    }
  }
  pctx.restore()

  const clipped = document.createElement('canvas')
  clipped.width = w
  clipped.height = h
  const cctx = clipped.getContext('2d')!
  cctx.drawImage(maskCanvas, 0, 0)
  cctx.globalCompositeOperation = 'source-in'
  cctx.drawImage(patternCanvas, 0, 0)
  ctx.drawImage(clipped, 0, 0)
}

function drawDebugMask(ctx: CanvasRenderingContext2D, mask: Uint8Array, w: number, h: number): void {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const cctx = c.getContext('2d')!
  const imgData = cctx.createImageData(w, h)
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i] === 1) {
      imgData.data[i * 4 + 1] = 200
      imgData.data[i * 4 + 3] = 100
    }
  }
  cctx.putImageData(imgData, 0, 0)
  ctx.drawImage(c, 0, 0)
}

/** 主合成入口：在传入的 canvas 上完成绘制 */
export function renderSock(
  canvas: HTMLCanvasElement | null,
  resources: SockResources | null,
  patternImage: HTMLImageElement | null,
  colors: SockColors,
  params: SockParams,
): void {
  if (!canvas || !resources?.sockImage) return
  const { sockImage, lineart, mask, bodyMask, weltMask, bodyMaskCanvas, heelMask, toeMask, sockPixels } = resources
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height

  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(sockImage, 0, 0)

  const dom = patternImage ? extractDominantColor(patternImage) : null

  const bodyHex = colors?.bodyHex
  if (bodyHex && bodyMask && sockPixels) {
    const rgb = hexToRgb(bodyHex)
    if (rgb) ctx.drawImage(fillMaskWithColor(bodyMask, sockPixels, rgb, w, h), 0, 0)
  }

  const weltHex = colors?.weltHex
  if (weltHex && weltMask && sockPixels) {
    const rgb = hexToRgb(weltHex)
    if (rgb) ctx.drawImage(fillMaskWithColor(weltMask, sockPixels, rgb, w, h), 0, 0)
  }

  const heelHex = colors?.heelHex
  const toeHex = colors?.toeHex
  if (heelMask && sockPixels) {
    const rgb = heelHex ? hexToRgb(heelHex) : dom
    if (rgb) ctx.drawImage(fillMaskWithColor(heelMask, sockPixels, rgb, w, h), 0, 0)
  }
  if (toeMask && sockPixels) {
    const rgb = toeHex ? hexToRgb(toeHex) : dom
    if (rgb) ctx.drawImage(fillMaskWithColor(toeMask, sockPixels, rgb, w, h), 0, 0)
  }

  if (patternImage && mask && bodyMaskCanvas) {
    drawPatternOnRegion(ctx, patternImage, mask, bodyMaskCanvas, params, w, h)
  }

  if (lineart) {
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(lineart, 0, 0, w, h)
    ctx.restore()
  }

  if (params?.debugMode && mask) {
    drawDebugMask(ctx, mask.mask, w, h)
  }
}

/** 离屏渲染：印花 URL + 颜色 + 参数 → 整个袜版 PNG dataURL（保存 cover / 衍生缩略图） */
export async function renderSockToDataURL(
  resources: SockResources | null,
  printImageURL: string | null,
  colors: SockColors,
  params: SockParams,
): Promise<string> {
  if (!resources?.ready) return ''
  const canvas = document.createElement('canvas')
  canvas.width = resources.meta.width
  canvas.height = resources.meta.height
  const pattern = await loadImage(printImageURL)
  renderSock(canvas, resources, pattern, colors, params)
  try {
    return canvas.toDataURL('image/png')
  } catch {
    return ''
  }
}
