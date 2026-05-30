/**
 * 小程序袜版矢量渲染 — 纯函数，与组件解耦。
 *
 * 设计取舍：小程序端无法高性能地做"PNG 蒙版逐像素"管线（getImageData + 连通域），
 * 因此用 canvas 2d 矢量绘制真实袜形：分区上色 + 印花裁剪到袜身 + 缩放/旋转/平铺。
 * 体验远优于纯 view 色块，且性能稳定、可导出图片用于保存/下单封面。
 */

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
}

export interface SockGeometry {
  /** 袜身（含螺口）外轮廓路径点，归一化 0~1 */
  bodyTop: number
  weltBottom: number
}

const DEFAULTS = {
  body: '#efe4cc',
  welt: '#d9c8a8',
  heel: '#d9c8a8',
  toe: '#d9c8a8',
}

/** 在给定矩形区域内描出袜子轮廓路径（不 fill/stroke，调用方决定） */
function traceSockPath(ctx: any, x: number, y: number, w: number, h: number): void {
  // 以 480×640 比例为基准，等比映射到 w×h
  const sx = w / 480
  const sy = h / 640
  const P = (px: number, py: number): [number, number] => [x + px * sx, y + py * sy]
  ctx.beginPath()
  let p = P(140, 40)
  ctx.moveTo(p[0], p[1])
  p = P(340, 40)
  ctx.lineTo(p[0], p[1])
  p = P(340, 360)
  ctx.lineTo(p[0], p[1])
  // 脚踝转折到脚掌
  const c1 = P(340, 410)
  const c2 = P(322, 432)
  p = P(300, 452)
  ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p[0], p[1])
  p = P(210, 560)
  ctx.lineTo(p[0], p[1])
  const c3 = P(192, 580)
  const c4 = P(168, 580)
  p = P(150, 568)
  ctx.bezierCurveTo(c3[0], c3[1], c4[0], c4[1], p[0], p[1])
  p = P(140, 540)
  ctx.lineTo(p[0], p[1])
  ctx.closePath()
}

function clipRect(ctx: any, x: number, y: number, w: number, h: number): void {
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
}

/**
 * 主绘制：在 ctx 上画出 w×h 的袜版。
 * @param printImg 已通过 canvas.createImage 加载好的印花图（可空）
 */
export function drawSock(
  ctx: any,
  w: number,
  h: number,
  colors: SockColors,
  params: SockParams,
  printImg: any | null,
): void {
  ctx.clearRect(0, 0, w, h)
  ctx.save()

  // 1) 整体裁剪到袜形
  traceSockPath(ctx, 0, 0, w, h)
  ctx.clip()

  const sy = h / 640
  const weltBottom = 150 * sy // 螺口段底边
  const footTop = 452 * sy // 脚掌起始

  // 2) 袜身底色（整体铺底）
  ctx.fillStyle = colors.bodyHex || DEFAULTS.body
  ctx.fillRect(0, 0, w, h)

  // 3) 螺口段
  ctx.save()
  clipRect(ctx, 0, 0, w, weltBottom)
  ctx.fillStyle = colors.weltHex || DEFAULTS.welt
  ctx.fillRect(0, 0, w, weltBottom)
  ctx.restore()

  // 4) 印花（裁剪到袜身中段：螺口以下、脚掌以上）
  if (printImg) {
    ctx.save()
    clipRect(ctx, 0, weltBottom, w, footTop - weltBottom)
    drawPrint(ctx, w, h, weltBottom, footTop, params, printImg)
    ctx.restore()
  }

  // 5) 脚掌（袜跟+袜头）
  ctx.save()
  clipRect(ctx, 0, footTop, w, h - footTop)
  ctx.fillStyle = colors.heelHex || DEFAULTS.heel
  ctx.fillRect(0, footTop, w * 0.42, h - footTop)
  ctx.fillStyle = colors.toeHex || colors.heelHex || DEFAULTS.toe
  ctx.fillRect(w * 0.42, footTop, w * 0.58, h - footTop)
  ctx.restore()

  ctx.restore()

  // 6) 袜形描边（柔和暗边）
  ctx.save()
  traceSockPath(ctx, 0, 0, w, h)
  ctx.lineWidth = Math.max(1, w * 0.004)
  ctx.strokeStyle = 'rgba(43,31,20,0.18)'
  ctx.stroke()
  ctx.restore()
}

function drawPrint(
  ctx: any,
  w: number,
  h: number,
  top: number,
  bottom: number,
  params: SockParams,
  img: any,
): void {
  const regionH = bottom - top
  const cx = w / 2
  const cy = top + regionH / 2
  const scale = (params.density || 100) / 100
  const rad = ((params.rotation || 0) * Math.PI) / 180
  const ratio = (img.width || 1) / (img.height || 1)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rad)

  if (params.singleMode) {
    let drawW: number
    let drawH: number
    const regionRatio = w / regionH
    if (ratio > regionRatio) {
      drawH = regionH * scale
      drawW = drawH * ratio
    } else {
      drawW = w * scale
      drawH = drawW / ratio
    }
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
  } else {
    const tileDensity = params.tileDensity || 3
    const baseSize = ((ratio > 1 ? w : regionH) / tileDensity) * scale
    const singleW = Math.max(8, baseSize)
    const singleH = Math.max(8, baseSize / ratio)
    const span = Math.max(w, regionH) * 1.6
    const cols = Math.ceil((span * 2) / singleW)
    const rows = Math.ceil((span * 2) / singleH)
    const startX = -(cols * singleW) / 2
    const startY = -(rows * singleH) / 2
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        ctx.drawImage(img, startX + c * singleW, startY + r * singleH, singleW, singleH)
      }
    }
  }
  ctx.restore()
}
