// 袜版合成渲染 — 与组件解耦的纯函数。
// 入参：canvas + 资源 + 印花图 + 颜色与参数；出参：在 canvas 上完成绘制。
// 渲染顺序：
//   1) sock.png 底图
//   2) bodyColor 或 dom 自动 → mask 区域底色
//   3) heelColor / toeColor 或 dom 自动 → heelMask/toeMask 区域上色
//   4) 印花（按 maskCanvas 裁剪）
//   5) lineart multiply 叠加
//   6) debug 蒙版（开发态）

const HEX_RGB_CACHE = new Map()
const hexToRgb = (hex) => {
  if (!hex) return null
  if (HEX_RGB_CACHE.has(hex)) return HEX_RGB_CACHE.get(hex)
  const m = hex.replace('#', '')
  const v = m.length === 3
    ? m.split('').map((ch) => parseInt(ch + ch, 16))
    : [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)]
  const o = { r: v[0], g: v[1], b: v[2] }
  HEX_RGB_CACHE.set(hex, o)
  return o
}

// 在临时画布上绘制 "把指定 mask 区域填充为指定 RGB 颜色"，返回画布
const fillMaskWithColor = (mask, sockPixels, rgb, w, h) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
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

// 基于印花图算主色调（缩到 100×100，量化 RGB）— 不变更，纯放置在这里
const extractDominantColor = (image) => {
  const c = document.createElement('canvas')
  const size = 100
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  ctx.drawImage(image, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  const map = new Map()
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

const drawPatternOnRegion = (ctx, pattern, mask, maskCanvas, params, w, h) => {
  const { bounds } = mask
  const sockW = bounds.maxX - bounds.minX
  const sockH = bounds.maxY - bounds.minY
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2

  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = w
  patternCanvas.height = h
  const pctx = patternCanvas.getContext('2d')
  const rad = (params.rotation * Math.PI) / 180
  const scale = params.density / 100
  const ratio = pattern.width / pattern.height

  pctx.save()
  pctx.translate(cx, cy)
  pctx.rotate(rad)

  if (params.singleMode) {
    let drawW
    let drawH
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
    const baseSize = ((ratio > 1 ? sockW : sockH) / params.tileDensity) * scale
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

  if (maskCanvas) {
    const clipped = document.createElement('canvas')
    clipped.width = w
    clipped.height = h
    const cctx = clipped.getContext('2d')
    cctx.drawImage(maskCanvas, 0, 0)
    cctx.globalCompositeOperation = 'source-in'
    cctx.drawImage(patternCanvas, 0, 0)
    ctx.drawImage(clipped, 0, 0)
  }
}

const drawDebugMask = (ctx, mask, w, h) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const cctx = c.getContext('2d')
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

/**
 * 主合成入口
 * @param {HTMLCanvasElement} canvas
 * @param {Object} resources  来自 useSockResources 的状态
 * @param {HTMLImageElement|null} patternImage  当前印花
 * @param {Object} colors  { bodyHex, heelHex, toeHex }  null/undefined 表示走自动
 * @param {Object} params  { density, tileDensity, rotation, singleMode, debugMode }
 */
export function renderSock(canvas, resources, patternImage, colors, params) {
  if (!canvas || !resources?.sockImage) return
  const { sockImage, lineart, mask, maskCanvas, heelMask, toeMask, sockPixels } = resources
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(sockImage, 0, 0)

  // 计算 dom 色（自动模式 fallback）
  const dom = patternImage ? extractDominantColor(patternImage) : null

  // 1) bodyColor — 在 mask 主可印区铺底色（patternImage 会盖住印花区，相当于"非印花处的底色"）
  const bodyHex = colors?.bodyHex
  if (bodyHex && mask?.mask && sockPixels) {
    const rgb = hexToRgb(bodyHex)
    if (rgb) {
      const layer = fillMaskWithColor(mask.mask, sockPixels, rgb, w, h)
      ctx.drawImage(layer, 0, 0)
    }
  }

  // 2) heelColor / toeColor — 各自蒙版上色；指定颜色优先，否则用印花主色（保留旧行为）
  const heelHex = colors?.heelHex
  const toeHex = colors?.toeHex
  if (heelMask && sockPixels) {
    const rgb = heelHex ? hexToRgb(heelHex) : dom
    if (rgb) {
      const layer = fillMaskWithColor(heelMask, sockPixels, rgb, w, h)
      ctx.drawImage(layer, 0, 0)
    }
  }
  if (toeMask && sockPixels) {
    const rgb = toeHex ? hexToRgb(toeHex) : dom
    if (rgb) {
      const layer = fillMaskWithColor(toeMask, sockPixels, rgb, w, h)
      ctx.drawImage(layer, 0, 0)
    }
  }

  // 3) 印花主图
  if (patternImage && mask) {
    drawPatternOnRegion(ctx, patternImage, mask, maskCanvas, params, w, h)
  }

  // 4) lineart 叠加
  if (lineart) {
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(lineart, 0, 0, w, h)
    ctx.restore()
  }

  // 5) debug 半透明绿色蒙版
  if (params?.debugMode && mask) {
    drawDebugMask(ctx, mask.mask, w, h)
  }
}

// 让外部知道要不要展示"袜跟/袜头分别上色"控件
export function isHeelToeSeparable(resources) {
  return Boolean(resources?.separable && resources?.heelMask && resources?.toeMask)
}

const loadOnce = (src) => new Promise((resolve) => {
  if (!src) return resolve(null)
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = () => resolve(null)
  img.src = src
})

/**
 * 离屏渲染：给定印花 URL + 颜色 + 参数，把整个袜版渲染为 PNG dataURL。
 * 用于保存设计 cover、亲子套装批量保存等场景。
 */
export async function renderSockToDataURL(resources, printImageURL, colors, params) {
  if (!resources?.ready) return ''
  const canvas = document.createElement('canvas')
  canvas.width = resources.meta.width
  canvas.height = resources.meta.height
  const pattern = await loadOnce(printImageURL)
  renderSock(canvas, resources, pattern, colors, params)
  try { return canvas.toDataURL('image/png') } catch { return '' }
}

/** 把 dataURL 缩到指定最大宽度，避免 localStorage 体积爆掉 */
export async function compressDataURL(dataURL, maxW = 280) {
  if (!dataURL) return ''
  const img = await loadOnce(dataURL)
  if (!img) return ''
  const ratio = img.width / img.height
  const w = Math.min(maxW, img.width)
  const h = Math.round(w / ratio)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  try { return c.toDataURL('image/png') } catch { return '' }
}
