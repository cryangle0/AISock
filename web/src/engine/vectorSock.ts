/**
 * 矢量袜版渲染 — 纯函数，从导入的分区几何（body/welt/foot 的 Path2D）合成袜版。
 * 取代旧的 2000px 像素蒙版管线：无需 getImageData / 连通域，缩放清晰、性能稳定。
 *
 * 渲染顺序：袜身底色 → 印花(裁剪到袜身) → 螺口色 → 脚部(跟/头)色 → 描边定形。
 */
import type { SockColors, SockParams } from './types'
import { loadImage } from './imageLoader'

export interface RawGeometry {
  viewBox: [number, number]
  bodyBox: [number, number, number, number] | null
  body: string[]
  welt: string[]
  foot: string[]
  outline: string[]
}

export interface ParsedGeometry {
  vw: number
  vh: number
  body: Path2D
  welt: Path2D | null
  foot: Path2D | null
  outline: Path2D[]
  box: { cx: number; cy: number; w: number; h: number }
  ready: boolean
}

/** 渲染倍率：画布内部分辨率 = viewBox × 此值，保证清晰可导出 */
export const VECTOR_RENDER_SCALE = 2

const DEFAULTS = { body: '#ffffff', welt: '#ffffff', foot: '#ffffff' }

function union(ds: string[]): Path2D | null {
  if (!ds?.length) return null
  const p = new Path2D()
  for (const d of ds) {
    try { p.addPath(new Path2D(d)) } catch { /* 跳过坏路径 */ }
  }
  return p
}

function collectPoints(d: string, pts: Array<[number, number]>) {
  const toks = d.match(/[MLHVCQZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi)
  if (!toks) return
  let i = 0
  let cmd = ''
  let cx = 0
  let cy = 0
  const num = () => parseFloat(toks[i++])
  while (i < toks.length) {
    const t = toks[i]
    if (/^[MLHVCQZ]$/i.test(t)) { cmd = t.toUpperCase(); i += 1 }
    if (cmd === 'M' || cmd === 'L') {
      const x = num(); const y = num()
      cx = x; cy = y; pts.push([x, y])
    } else if (cmd === 'H') {
      const x = num()
      cx = x; pts.push([x, cy])
    } else if (cmd === 'V') {
      const y = num()
      cy = y; pts.push([cx, y])
    } else if (cmd === 'C') {
      const x1 = num(); const y1 = num(); const x2 = num(); const y2 = num(); const x = num(); const y = num()
      pts.push([x1, y1], [x2, y2], [x, y]); cx = x; cy = y
    } else if (cmd === 'Q') {
      const x1 = num(); const y1 = num(); const x = num(); const y = num()
      pts.push([x1, y1], [x, y]); cx = x; cy = y
    } else {
      i += 1
    }
  }
}

function computeBBox(groups: string[][]): { x: number; y: number; w: number; h: number } | null {
  const pts: Array<[number, number]> = []
  for (const group of groups) {
    for (const d of group || []) collectPoints(d, pts)
  }
  if (!pts.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of pts) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  if (!(maxX > minX) || !(maxY > minY)) return null
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export function parseGeometry(geo: RawGeometry | null | undefined): ParsedGeometry | null {
  if (!geo || !geo.viewBox || !geo.body?.length) return null
  const [vw, vh] = geo.viewBox
  const body = union(geo.body)
  if (!body) return null
  const bodyBBox = computeBBox([geo.body])
  const meta = geo.bodyBox || [vw * 0.3, vh * 0.2, vw * 0.7, vh * 0.8]
  const bb = bodyBBox ? [bodyBBox.x, bodyBBox.y, bodyBBox.x + bodyBBox.w, bodyBBox.y + bodyBBox.h] : meta
  return {
    vw,
    vh,
    body,
    welt: union(geo.welt),
    foot: union(geo.foot),
    outline: (geo.outline || []).map((d) => { try { return new Path2D(d) } catch { return null } }).filter(Boolean) as Path2D[],
    box: { cx: (bb[0] + bb[2]) / 2, cy: (bb[1] + bb[3]) / 2, w: bb[2] - bb[0], h: bb[3] - bb[1] },
    ready: true,
  }
}

function sizeSinglePrint(w: number, h: number, ratio: number, scale: number, cover: boolean): { drawW: number; drawH: number } {
  const boxRatio = w / h
  if (cover) {
    if (ratio > boxRatio) {
      const drawH = h * scale
      return { drawW: drawH * ratio, drawH }
    }
    const drawW = w * scale
    return { drawW, drawH: drawW / ratio }
  }
  if (ratio > boxRatio) {
    const drawW = w * scale
    return { drawW, drawH: drawW / ratio }
  }
  const drawH = h * scale
  return { drawW: drawH * ratio, drawH }
}

function drawPrint(ctx: CanvasRenderingContext2D, box: ParsedGeometry['box'], img: HTMLImageElement, params: SockParams) {
  const scale = (params.density || 100) / 100
  const rad = ((params.rotation || 0) * Math.PI) / 180
  const ratio = (img.width || 1) / (img.height || 1)
  const { cx, cy, w, h } = box
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rad)
  if (params.singleMode) {
    const { drawW, drawH } = sizeSinglePrint(w, h, ratio, scale, params.coverMode ?? false)
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
  } else {
    const tileDensity = params.tileDensity || 3
    const base = ((ratio > 1 ? w : h) / tileDensity) * scale
    const sw = Math.max(8, base)
    const sh = Math.max(8, base / ratio)
    const span = Math.max(w, h) * 1.6
    const cols = Math.ceil((span * 2) / sw)
    const rows = Math.ceil((span * 2) / sh)
    const sx = -(cols * sw) / 2
    const sy = -(rows * sh) / 2
    for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) ctx.drawImage(img, sx + c * sw, sy + r * sh, sw, sh)
  }
  ctx.restore()
}

/** 在 canvas 上渲染矢量袜版。canvas 内部尺寸由本函数按 viewBox×scale 设置。 */
export function renderVectorSock(
  canvas: HTMLCanvasElement | null,
  parsed: ParsedGeometry | null,
  patternImg: HTMLImageElement | null,
  colors: SockColors,
  params: SockParams,
  scale = VECTOR_RENDER_SCALE,
): void {
  if (!canvas || !parsed?.ready) return
  const W = Math.round(parsed.vw * scale)
  const H = Math.round(parsed.vh * scale)
  if (canvas.width !== W) canvas.width = W
  if (canvas.height !== H) canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, parsed.vw, parsed.vh)

  const weltColor = colors.weltHex || DEFAULTS.welt
  const footColor = colors.heelHex || colors.toeHex || DEFAULTS.foot
  const bodyColor = colors.bodyHex || DEFAULTS.body

  // 1) 袜身底色
  ctx.fillStyle = bodyColor
  ctx.fill(parsed.body)

  // 2) 印花只裁剪到袜身，铺满袜身路径真实包围盒。
  if (patternImg) {
    ctx.save()
    ctx.clip(parsed.body)
    drawPrint(ctx, parsed.box, patternImg, params)
    ctx.restore()
  }

  // 3) 螺口 / 袜头袜跟盖在印花之上，保持这些区域不印花。
  if (parsed.welt) { ctx.fillStyle = weltColor; ctx.fill(parsed.welt) }
  if (parsed.foot) { ctx.fillStyle = footColor; ctx.fill(parsed.foot) }

  // 4) 描边：外轮廓 + 分区线 + SVG 线（纯黑）
  ctx.lineWidth = Math.max(1, parsed.vw * 0.004)
  ctx.strokeStyle = '#000000'
  ctx.stroke(parsed.body)
  if (parsed.welt) ctx.stroke(parsed.welt)
  if (parsed.foot) ctx.stroke(parsed.foot)
  for (const path of parsed.outline) ctx.stroke(path)
}

/** 命中测试：返回点击到的分区（body/welt/foot），用于「单击袜版定位上色区域」 */
export function hitTestVector(parsed: ParsedGeometry | null, x: number, y: number, ctx: CanvasRenderingContext2D): 'welt' | 'foot' | 'body' | null {
  if (!parsed?.ready) return null
  if (parsed.welt && ctx.isPointInPath(parsed.welt, x, y)) return 'welt'
  if (parsed.foot && ctx.isPointInPath(parsed.foot, x, y)) return 'foot'
  if (ctx.isPointInPath(parsed.body, x, y)) return 'body'
  return null
}

/** 离屏渲染：印花 URL + 颜色 + 参数 → 袜版 PNG dataURL（款式衍生/亲子袜封面） */
export async function renderVectorSockToDataURL(
  parsed: ParsedGeometry | null,
  printImageURL: string | null,
  colors: SockColors,
  params: SockParams,
  scale = 0.6,
): Promise<string> {
  if (!parsed?.ready) return ''
  const canvas = document.createElement('canvas')
  const img = await loadImage(printImageURL)
  renderVectorSock(canvas, parsed, img, colors, params, scale)
  try { return canvas.toDataURL('image/png') } catch { return '' }
}
