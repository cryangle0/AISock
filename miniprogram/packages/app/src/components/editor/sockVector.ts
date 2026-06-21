/**
 * 小程序袜版矢量渲染 —— 回放后台导入的归一化分区路径（与 web 同一份 geometry_json）。
 *
 * 小程序 canvas 2d 无 Path2D，故用一个极简「绝对路径 d → ctx 命令」回放器：
 * 导入时已用 svgpath 归一化为绝对 M/L/H/V/C/Q/Z，这里只需直绘，安全可靠。
 * 渲染顺序：袜身底色 → 印花(裁剪到袜身) → 螺口 → 脚部(跟/头) → 描边。
 */

export interface SockGeometry {
  viewBox: [number, number]
  bodyBox: [number, number, number, number] | null
  body: string[]
  welt: string[]
  foot: string[]
  outline: string[]
}
export interface SockColors {
  bodyHex: string | null
  weltHex: string | null
  heelHex: string | null
  toeHex: string | null
}
export interface SockParams {
  density: number
  rotation: number
  singleMode: boolean
  tileDensity?: number
  /** true 时单图模式按 cover 铺满袜身印花区（预览推荐卡用，避免上下留白缝隙） */
  coverMode?: boolean
}

const DEF = { body: '#efe4cc', welt: '#ffffff', foot: '#ffffff' }
const PAGE_BG = '#f5ede0'

type TF = (x: number, y: number) => [number, number]

/** 把一条绝对路径 d 回放到 ctx 当前 path（坐标经 tf 变换） */
function tracePath(ctx: any, d: string, tf: TF): void {
  const toks = d.match(/[MLHVCQZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi)
  if (!toks) return
  let i = 0
  let cmd = ''
  let cx = 0
  let cy = 0
  let sx = 0
  let sy = 0
  const num = () => parseFloat(toks[i++])
  while (i < toks.length) {
    const t = toks[i]
    if (/^[MLHVCQZ]$/i.test(t)) { cmd = t.toUpperCase(); i++ }
    if (cmd === 'M') {
      const x = num(); const y = num(); cx = x; cy = y; sx = x; sy = y
      const P = tf(x, y); ctx.moveTo(P[0], P[1]); cmd = 'L' // 后续隐式重复按 L
    } else if (cmd === 'L') {
      const x = num(); const y = num(); cx = x; cy = y
      const P = tf(x, y); ctx.lineTo(P[0], P[1])
    } else if (cmd === 'H') {
      const x = num(); cx = x; const P = tf(x, cy); ctx.lineTo(P[0], P[1])
    } else if (cmd === 'V') {
      const y = num(); cy = y; const P = tf(cx, y); ctx.lineTo(P[0], P[1])
    } else if (cmd === 'C') {
      const x1 = num(); const y1 = num(); const x2 = num(); const y2 = num(); const x = num(); const y = num()
      const P1 = tf(x1, y1); const P2 = tf(x2, y2); const P = tf(x, y)
      ctx.bezierCurveTo(P1[0], P1[1], P2[0], P2[1], P[0], P[1]); cx = x; cy = y
    } else if (cmd === 'Q') {
      const x1 = num(); const y1 = num(); const x = num(); const y = num()
      const P1 = tf(x1, y1); const P = tf(x, y)
      ctx.quadraticCurveTo(P1[0], P1[1], P[0], P[1]); cx = x; cy = y
    } else if (cmd === 'Z') {
      ctx.closePath(); cx = sx; cy = sy
    } else { i++ }
  }
}

function fillRegion(ctx: any, ds: string[], color: string, tf: TF): void {
  if (!ds?.length) return
  ctx.beginPath()
  for (const d of ds) tracePath(ctx, d, tf)
  ctx.fillStyle = color
  ctx.fill()
}

/** 收集一条绝对路径 d 上的全部坐标点（含贝塞尔控制点）。
 *  控制点会让包围盒略大于真实曲线，但只会让袜版稍微缩小、绝不会裁切，安全。 */
function collectPoints(d: string, pts: Array<[number, number]>): void {
  const toks = d.match(/[MLHVCQZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi)
  if (!toks) return
  let i = 0
  let cmd = ''
  let cx = 0
  let cy = 0
  const num = () => parseFloat(toks[i++])
  while (i < toks.length) {
    const t = toks[i]
    if (/^[MLHVCQZ]$/i.test(t)) { cmd = t.toUpperCase(); i++ }
    if (cmd === 'M' || cmd === 'L') {
      const x = num(); const y = num(); cx = x; cy = y; pts.push([x, y])
      if (cmd === 'M') cmd = 'L'
    } else if (cmd === 'H') {
      const x = num(); cx = x; pts.push([x, cy])
    } else if (cmd === 'V') {
      const y = num(); cy = y; pts.push([cx, y])
    } else if (cmd === 'C') {
      const x1 = num(); const y1 = num(); const x2 = num(); const y2 = num(); const x = num(); const y = num()
      pts.push([x1, y1], [x2, y2], [x, y]); cx = x; cy = y
    } else if (cmd === 'Q') {
      const x1 = num(); const y1 = num(); const x = num(); const y = num()
      pts.push([x1, y1], [x, y]); cx = x; cy = y
    } else if (cmd !== 'Z') {
      i++
    }
  }
}

/** 计算若干路径组的整体包围盒（袜版真实占用区域，用于铺满画布） */
function computeBBox(groups: string[][]): { x: number; y: number; w: number; h: number } | null {
  const pts: Array<[number, number]> = []
  for (const grp of groups) {
    if (!grp?.length) continue
    for (const d of grp) collectPoints(d, pts)
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

/** 印花定位框：优先袜身路径真实包围盒，比 bodyBox 元数据更贴边 */
function printBoxFromBody(
  geo: SockGeometry,
  vw: number,
  vh: number,
  ox: number,
  oy: number,
  s: number,
): { cx: number; cy: number; w: number; h: number } {
  const bb = computeBBox([geo.body])
  if (bb) {
    return {
      cx: ox + (bb.x + bb.w / 2) * s,
      cy: oy + (bb.y + bb.h / 2) * s,
      w: bb.w * s,
      h: bb.h * s,
    }
  }
  const meta = geo.bodyBox || [vw * 0.3, vh * 0.2, vw * 0.7, vh * 0.8]
  return {
    cx: ox + ((meta[0] + meta[2]) / 2) * s,
    cy: oy + ((meta[1] + meta[3]) / 2) * s,
    w: (meta[2] - meta[0]) * s,
    h: (meta[3] - meta[1]) * s,
  }
}

/** 按袜身区域与花型比例估算平铺密度（预览态：重复印花，接近实物袜） */
function estimatePreviewTileDensity(boxW: number, boxH: number, imgRatio: number): number {
  if (boxW <= 0 || boxH <= 0) return 4
  const aspect = boxH / boxW
  // 竖长袜身：沿高度约 aspect 倍于宽度，密度与长宽比、花型横宽比联动
  let td = Math.round(aspect * 0.9)
  if (imgRatio > 1.15) td = Math.max(td, Math.round(imgRatio * 0.85))
  return Math.min(7, Math.max(3, td))
}

/** AI/推荐卡预览：平铺花型铺满袜身，避免单图 cover 把一张大图拉满 */
export function buildPreviewPrintParams(
  base: SockParams,
  box: { w: number; h: number },
  imgRatio: number,
): SockParams {
  return {
    density: base.density ?? 100,
    rotation: base.rotation ?? 0,
    singleMode: false,
    tileDensity: base.tileDensity ?? estimatePreviewTileDensity(box.w, box.h, imgRatio),
    coverMode: false,
  }
}

function imgAspect(img: any): number {
  const w = img?.width || img?.naturalWidth || 0
  const h = img?.height || img?.naturalHeight || 0
  if (w > 0 && h > 0) return w / h
  return 1
}

function sizeSinglePrint(w: number, h: number, ratio: number, scale: number, cover: boolean): { dW: number; dH: number } {
  const boxRatio = w / h
  if (cover) {
    // cover：至少一边贴满印花区，另一边可溢出（裁剪区裁掉）
    if (ratio > boxRatio) {
      const dH = h * scale
      return { dW: dH * ratio, dH }
    }
    const dW = w * scale
    return { dW, dH: dW / ratio }
  }
  // contain：完整落入印花区内
  if (ratio > boxRatio) {
    const dW = w * scale
    return { dW, dH: dW / ratio }
  }
  const dH = h * scale
  return { dW: dH * ratio, dH }
}

function drawPrint(ctx: any, box: { cx: number; cy: number; w: number; h: number }, img: any, params: SockParams): void {
  const scale = (params.density || 100) / 100
  const rad = ((params.rotation || 0) * Math.PI) / 180
  const ratio = imgAspect(img)
  const { cx, cy, w, h } = box
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rad)
  if (params.singleMode) {
    const { dW, dH } = sizeSinglePrint(w, h, ratio, scale, params.coverMode ?? false)
    ctx.drawImage(img, -dW / 2, -dH / 2, dW, dH)
  } else {
    const td = params.tileDensity || 3
    const base = ((ratio > 1 ? w : h) / td) * scale
    const sw = Math.max(6, base)
    const sh = Math.max(6, base / ratio)
    const span = Math.max(w, h) * 2.2
    const cols = Math.ceil((span * 2) / sw)
    const rows = Math.ceil((span * 2) / sh)
    const startX = -(cols * sw) / 2
    const startY = -(rows * sh) / 2
    for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) ctx.drawImage(img, startX + c * sw, startY + r * sh, sw, sh)
  }
  ctx.restore()
}

/** 矢量袜版绘制选项 */
export interface DrawVectorOpts {
  /** 画布底色；传 null 则透明（预览态用，避免原生 canvas 不透明像素盖住浮层标签） */
  bg?: string | null
  /** 袜版四周留白比例（越小袜版越大，铺满程度越高） */
  padRatio?: number
  /** true 时按袜版「真实包围盒」铺满画布（忽略 viewBox 周围空白），预览态用 */
  fitContent?: boolean
  /** 顶部预留比例（0~1）：在画布顶部留出一条透明带给左上角浮层标签，袜版从该带下方开始绘制，避免盖住标签 */
  topReserveRatio?: number
  /** 预览态可关闭描边，减少分区接缝处的视觉缝隙 */
  noStroke?: boolean
  /** AI 推荐预览：平铺花型（与实物袜重复印花一致），不用单图 cover 拉伸 */
  previewPrint?: boolean
}

/** 主绘制：在 w×h 区域内回放矢量袜版（geometry 来自后台 geometry_json） */
export function drawVectorSock(
  ctx: any,
  w: number,
  h: number,
  geo: SockGeometry,
  colors: SockColors,
  params: SockParams,
  printImg: any | null,
  opts: DrawVectorOpts = {},
): void {
  const { bg = PAGE_BG, padRatio = 0.06, fitContent = false, topReserveRatio = 0, noStroke = false, previewPrint = false } = opts
  const [vw, vh] = geo.viewBox
  // 默认按 viewBox 适配；预览态按真实包围盒适配，避免 viewBox 周围留白把袜版挤小
  const region = (fitContent ? computeBBox([geo.body, geo.welt, geo.foot]) : null) || { x: 0, y: 0, w: vw, h: vh }
  const pad = Math.min(w, h) * padRatio
  // 顶部预留带：袜版只在 [boxY, h-pad] 内铺放，给左上角标签留出干净区域
  const topReserve = h * topReserveRatio
  const boxX = pad
  const boxY = pad + topReserve
  const boxW = w - pad * 2
  const boxH = h - pad * 2 - topReserve
  const s = Math.min(boxW / region.w, boxH / region.h)
  const ox = boxX + (boxW - region.w * s) / 2 - region.x * s
  const oy = boxY + (boxH - region.h * s) / 2 - region.y * s
  const tf: TF = (x, y) => [ox + x * s, oy + y * s]

  const weltColor = colors.weltHex || DEF.welt
  const footColor = colors.heelHex || colors.toeHex || DEF.foot
  const bodyColor = colors.bodyHex || DEF.body

  ctx.clearRect(0, 0, w, h)
  if (bg) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
  }

  // 0) 螺口/脚部先铺白底，避免分区路径亚像素缝隙露出袜身米色
  fillRegion(ctx, geo.foot, footColor, tf)
  fillRegion(ctx, geo.welt, weltColor, tf)

  // 1) 袜身底色
  fillRegion(ctx, geo.body, bodyColor, tf)

  // 2) 螺口 / 脚部先铺白底，避免分区路径亚像素缝隙露出袜身米色
  fillRegion(ctx, geo.welt, weltColor, tf)
  fillRegion(ctx, geo.foot, footColor, tf)

  // 3) 印花（裁剪到袜身，最后绘制以覆盖袜身中段）
  if (printImg && geo.body.length) {
    ctx.save()
    ctx.beginPath()
    for (const d of geo.body) tracePath(ctx, d, tf)
    ctx.clip()
    const box = printBoxFromBody(geo, vw, vh, ox, oy, s)
    const printParams = previewPrint
      ? buildPreviewPrintParams(params, box, imgAspect(printImg))
      : params
    drawPrint(ctx, box, printImg, printParams)
    ctx.restore()
  }

  // 4) 印花后重画非袜身区域，防止部分袜版 body 路径覆盖袜口/袜足/袜跟。
  fillRegion(ctx, geo.welt, weltColor, tf)
  fillRegion(ctx, geo.foot, footColor, tf)

  // 5) 描边：仅袜身外轮廓
  if (!noStroke) {
    ctx.lineWidth = Math.max(1, vw * s * 0.004)
    ctx.strokeStyle = 'rgba(43,31,20,0.20)'
    ctx.beginPath()
    for (const d of geo.body) tracePath(ctx, d, tf)
    ctx.stroke()
  }
}

/** 解析 geometry_json 字符串为 SockGeometry（失败返回 null） */
export function parseSockGeometry(json: string | null | undefined): SockGeometry | null {
  if (!json) return null
  try {
    const g = JSON.parse(json)
    if (!g?.viewBox || !g?.body?.length) return null
    return { viewBox: g.viewBox, bodyBox: g.bodyBox ?? null, body: g.body || [], welt: g.welt || [], foot: g.foot || [], outline: g.outline || [] }
  } catch {
    return null
  }
}
