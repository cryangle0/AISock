/**
 * 袜版蒙版预处理 — 把 sock/mask/othermask/lineart 四张图解析成可印区蒙版：
 *   - mask        完整可印区（含螺口），带 bounds
 *   - bodyMask    袜身（去掉顶部螺口段）
 *   - weltMask    螺口段（由 lineart 顶部竖纹定位）
 *   - heelMask/toeMask  袜跟/袜头（othermask 连通域拆分）
 * 纯函数实现（无框架依赖），供 web/小程序复用同一套算法。
 */
import { loadImage } from './imageLoader'
import type { BinaryMask, MaskBounds, SockResources } from './types'

const ASSET_BASE = `${import.meta.env.BASE_URL}image-tool/`

function createCtx(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  return { canvas, ctx }
}

/** 二值蒙版 — 白(亮度>128)+不透明(alpha>100) 视为可印 */
function buildBinaryMask(img: HTMLImageElement, w: number, h: number): BinaryMask {
  const { ctx } = createCtx(w, h)
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  const mask = new Uint8Array(w * h)
  let count = 0
  let minX = w
  let maxX = 0
  let minY = h
  let maxY = 0
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (brightness > 128 && data[i + 3] > 100) {
      const px = i / 4
      mask[px] = 1
      count += 1
      const x = px % w
      const y = (px - x) / w
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return { mask, count, bounds: { minX, minY, maxX, maxY } }
}

/** 把二值 mask 渲染成纯白 RGBA 画布（供 source-in 裁剪使用） */
function buildMaskCanvas(mask: Uint8Array, w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = createCtx(w, h)
  const imgData = ctx.createImageData(w, h)
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i] === 1) {
      const idx = i * 4
      imgData.data[idx] = 255
      imgData.data[idx + 1] = 255
      imgData.data[idx + 2] = 255
      imgData.data[idx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)
  return canvas
}

/** 基于 lineart 顶部竖纹定位真正的袜口螺口区域 */
function buildWeltMaskFromLineart(
  lineartImg: HTMLImageElement | null,
  w: number,
  h: number,
  fallbackBounds: MaskBounds,
): Uint8Array | null {
  if (!lineartImg) return null
  const total = w * h
  const mask = new Uint8Array(total)

  const { ctx } = createCtx(w, h)
  ctx.drawImage(lineartImg, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const rowCounts = new Uint16Array(h)
  const maskWidth = fallbackBounds.maxX - fallbackBounds.minX
  const searchTop = Math.max(0, fallbackBounds.minY - Math.round(maskWidth * 0.36))
  const searchBottom = Math.min(h - 1, fallbackBounds.minY + Math.round(maskWidth * 0.32))
  const searchLeft = Math.max(0, fallbackBounds.minX - Math.round(maskWidth * 0.08))
  const searchRight = Math.min(w - 1, fallbackBounds.maxX + Math.round(maskWidth * 0.08))

  for (let y = searchTop; y <= searchBottom; y += 1) {
    let count = 0
    for (let x = searchLeft; x <= searchRight; x += 1) {
      const idx = (y * w + x) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      if (data[idx + 3] > 20 && brightness > 35) count += 1
    }
    rowCounts[y] = count
  }

  const minRowPixels = Math.max(8, Math.floor(maskWidth * 0.035))
  let top = -1
  let bottom = -1
  let gap = 0
  for (let y = searchTop; y <= searchBottom; y += 1) {
    if (rowCounts[y] >= minRowPixels) {
      if (top < 0) top = y
      bottom = y
      gap = 0
    } else if (top >= 0) {
      gap += 1
      if (gap > 3) break
    }
  }
  if (top < 0 || bottom < 0) return null

  let left = w
  let right = 0
  for (let y = top; y <= bottom; y += 1) {
    for (let x = searchLeft; x <= searchRight; x += 1) {
      const idx = (y * w + x) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      if (data[idx + 3] > 20 && brightness > 35) {
        if (x < left) left = x
        if (x > right) right = x
      }
    }
  }

  const padX = 5
  const padTop = 2
  const padBottom = Math.round((right - left) * 0.035)
  left = Math.max(0, left - padX)
  right = Math.min(w - 1, right + padX)
  top = Math.max(0, top - padTop)
  bottom = Math.min(h - 1, bottom + padBottom)

  const radius = Math.max(8, Math.round((right - left) * 0.05))
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      let include = true
      if (y < top + radius && x < left + radius) {
        const dx = left + radius - x
        const dy = top + radius - y
        include = dx * dx + dy * dy <= radius * radius
      } else if (y < top + radius && x > right - radius) {
        const dx = x - (right - radius)
        const dy = top + radius - y
        include = dx * dx + dy * dy <= radius * radius
      }
      if (include) mask[y * w + x] = 1
    }
  }
  return mask
}

function splitWeltAndBody(fullMask: Uint8Array, weltMask: Uint8Array | null): Uint8Array {
  const total = fullMask.length
  const bodyMask = new Uint8Array(total)
  for (let i = 0; i < total; i += 1) {
    if (fullMask[i] === 1 && (!weltMask || weltMask[i] !== 1)) bodyMask[i] = 1
  }
  return bodyMask
}

/** 4 邻域 BFS 连通域 */
function splitConnectedComponents(mask: Uint8Array, w: number, h: number) {
  const total = w * h
  const labels = new Int16Array(total)
  const queue = new Int32Array(total)
  const comps: Array<{ label: number; area: number; avgY: number }> = []
  let nextLabel = 0

  for (let start = 0; start < total; start += 1) {
    if (mask[start] !== 1 || labels[start] !== 0) continue
    nextLabel += 1
    let head = 0
    let tail = 0
    queue[tail] = start
    tail += 1
    labels[start] = nextLabel
    let area = 0
    let sumY = 0
    while (head < tail) {
      const idx = queue[head]
      head += 1
      area += 1
      const x = idx % w
      const y = (idx - x) / w
      sumY += y
      if (x > 0) {
        const ni = idx - 1
        if (mask[ni] === 1 && labels[ni] === 0) { labels[ni] = nextLabel; queue[tail] = ni; tail += 1 }
      }
      if (x < w - 1) {
        const ni = idx + 1
        if (mask[ni] === 1 && labels[ni] === 0) { labels[ni] = nextLabel; queue[tail] = ni; tail += 1 }
      }
      if (idx >= w) {
        const ni = idx - w
        if (mask[ni] === 1 && labels[ni] === 0) { labels[ni] = nextLabel; queue[tail] = ni; tail += 1 }
      }
      if (idx + w < total) {
        const ni = idx + w
        if (mask[ni] === 1 && labels[ni] === 0) { labels[ni] = nextLabel; queue[tail] = ni; tail += 1 }
      }
    }
    comps.push({ label: nextLabel, area, avgY: sumY / area })
  }
  return { labels, comps }
}

/** othermask 拆为 heel/toe；不可拆时回退单整体 */
function buildHeelToeMasks(otherMask: Uint8Array, w: number, h: number) {
  const { labels, comps } = splitConnectedComponents(otherMask, w, h)
  if (comps.length < 2) return { heelMask: otherMask, toeMask: null, separable: false }
  const topTwo = [...comps].sort((a, b) => b.area - a.area).slice(0, 2)
  topTwo.sort((a, b) => a.avgY - b.avgY)
  const heelLabel = topTwo[0].label
  const toeLabel = topTwo[1].label
  const total = w * h
  const heelMask = new Uint8Array(total)
  const toeMask = new Uint8Array(total)
  for (let i = 0; i < total; i += 1) {
    const lab = labels[i]
    if (lab === heelLabel) heelMask[i] = 1
    else if (lab === toeLabel) toeMask[i] = 1
  }
  return { heelMask, toeMask, separable: true }
}

/**
 * 加载并预处理某个袜型的全部资源。
 * 当前所有袜型共用 default 资源（image-tool 根目录），后续替换为各自子目录即可。
 */
export async function buildSockResources(_sockTypeId: string): Promise<SockResources> {
  const [sock, maskImg, otherMaskImg, lineart] = await Promise.all([
    loadImage(`${ASSET_BASE}sock.png`),
    loadImage(`${ASSET_BASE}mask.png`),
    loadImage(`${ASSET_BASE}othermask.png`),
    loadImage(`${ASSET_BASE}lineart.png`),
  ])

  if (!sock) {
    return { ...emptyReady(), error: '袜版底图加载失败' }
  }

  const w = sock.width
  const h = sock.height
  const { ctx: sctx } = createCtx(w, h)
  sctx.drawImage(sock, 0, 0)
  const sockPixels = sctx.getImageData(0, 0, w, h).data

  const fallbackMask = maskImg || sock
  const built = buildBinaryMask(fallbackMask, w, h)
  const weltMask = buildWeltMaskFromLineart(lineart, w, h, built.bounds)
  const bodyMask = splitWeltAndBody(built.mask, weltMask)
  const bodyMaskCanvas = buildMaskCanvas(bodyMask, w, h)

  let heelMask: Uint8Array | null = null
  let toeMask: Uint8Array | null = null
  let separable = false
  if (otherMaskImg) {
    const otherBuilt = buildBinaryMask(otherMaskImg, w, h)
    const split = buildHeelToeMasks(otherBuilt.mask, w, h)
    heelMask = split.heelMask
    toeMask = split.toeMask
    separable = split.separable
  }

  return {
    ready: true,
    error: null,
    sockImage: sock,
    lineart,
    mask: built,
    bodyMask,
    weltMask,
    bodyMaskCanvas,
    heelMask,
    toeMask,
    sockPixels,
    separable,
    meta: { count: built.count, width: w, height: h },
  }
}

function emptyReady(): SockResources {
  return {
    ready: false,
    error: null,
    sockImage: null,
    lineart: null,
    mask: null,
    bodyMask: null,
    weltMask: null,
    bodyMaskCanvas: null,
    heelMask: null,
    toeMask: null,
    sockPixels: null,
    separable: false,
    meta: { count: 0, width: 0, height: 0 },
  }
}

/** 是否展示"袜跟/袜头分别上色" */
export function isHeelToeSeparable(resources: SockResources | null): boolean {
  return Boolean(resources?.separable && resources?.heelMask && resources?.toeMask)
}
