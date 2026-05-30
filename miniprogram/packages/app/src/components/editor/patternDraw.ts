/**
 * 小程序内置花型矢量绘制 — 在离屏 canvas 上把 patternId 画成一张方形纹理图，
 * 返回可被主渲染 drawImage 使用的图源（ImageData→canvas / 或直接返回离屏 canvas）。
 *
 * 之所以矢量自绘而非加载 SVG dataURL：小程序 canvas.createImage 对 base64/SVG 兼容性差，
 * 矢量自绘最稳定，且与 PatternThumb 的视觉一致。
 */

interface PatternStyle {
  bg: string
  fg: string
}

const STYLES: Record<string, PatternStyle> = {
  'p-floral': { bg: '#fff7fa', fg: '#d4376b' },
  'p-stripe': { bg: '#ffffff', fg: '#d4376b' },
  'p-dots': { bg: '#fdf3f8', fg: '#d4376b' },
  'p-checker': { bg: '#ffffff', fg: '#d4376b' },
  'p-flower-big': { bg: '#fff7fa', fg: '#e85a8a' },
  'p-blue': { bg: '#eef4fb', fg: '#3a6fb0' },
  'p-mono': { bg: '#23262d', fg: '#aab1bd' },
  'p-gold': { bg: '#fff8e7', fg: '#b8893a' },
  'p-mint': { bg: '#eaf6f0', fg: '#5fb18a' },
}

/** 在离屏 canvas 上画满一种花型纹理，返回该 canvas（可作为 drawImage 源） */
export function drawPatternTexture(offscreen: any, ctx: any, size: number, patternId: string): void {
  const style = STYLES[patternId] || STYLES['p-floral']
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = style.bg
  ctx.fillRect(0, 0, size, size)

  const tile = patternId === 'p-flower-big' ? size / 3 : size / 5
  const cols = Math.ceil(size / tile)
  const rows = Math.ceil(size / tile)
  ctx.fillStyle = style.fg

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = c * tile
      const y = r * tile
      drawTile(ctx, patternId, x, y, tile, style)
    }
  }
}

function drawTile(ctx: any, id: string, x: number, y: number, t: number, style: PatternStyle): void {
  const cx = x + t / 2
  const cy = y + t / 2
  switch (id) {
    case 'p-stripe':
      ctx.fillRect(x, y, t / 2, t)
      break
    case 'p-checker':
      ctx.fillRect(x, y, t / 2, t / 2)
      ctx.fillRect(x + t / 2, y + t / 2, t / 2, t / 2)
      break
    case 'p-mono':
      ctx.globalAlpha = 0.3
      ctx.fillRect(x, y, t, t)
      ctx.globalAlpha = 1
      break
    case 'p-gold':
      drawStar(ctx, cx, cy, t * 0.32, t * 0.14)
      break
    case 'p-flower-big':
    case 'p-floral':
      drawFlower(ctx, cx, cy, t * 0.34, style.fg)
      break
    default:
      ctx.beginPath()
      ctx.arc(cx, cy, t * 0.22, 0, Math.PI * 2)
      ctx.fill()
  }
}

function drawFlower(ctx: any, cx: number, cy: number, r: number, fg: string): void {
  ctx.save()
  ctx.fillStyle = fg
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2
    ctx.beginPath()
    ctx.ellipse(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.42, r * 0.24, a, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#fff0a8'
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawStar(ctx: any, cx: number, cy: number, outer: number, inner: number): void {
  ctx.beginPath()
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const px = cx + Math.cos(a) * r
    const py = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

export function patternStyle(patternId: string): PatternStyle {
  return STYLES[patternId] || STYLES['p-floral']
}
