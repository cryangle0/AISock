/**
 * 色卡映射 — 把任意印花图的每个像素映射到色卡里距离最近的颜色，输出新 dataURL。
 * strength=0 不映射，1 完全替换，中间值线性混合。结果做 LRU 缓存避免重复计算。
 */
import { loadImage } from './imageLoader'

interface RGB {
  r: number
  g: number
  b: number
}

const MEMO = new Map<string, string>()

function hexToRgb(hex: string): RGB {
  const m = hex.replace('#', '')
  const v =
    m.length === 3
      ? m.split('').map((ch) => parseInt(ch + ch, 16))
      : [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)]
  return { r: v[0], g: v[1], b: v[2] }
}

function findNearest(r: number, g: number, b: number, palette: RGB[]): RGB {
  let bestDist = Infinity
  let best = palette[0]
  for (let i = 0; i < palette.length; i += 1) {
    const p = palette[i]
    const dr = p.r - r
    const dg = p.g - g
    const db = p.b - b
    const d = dr * dr + dg * dg + db * db
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best
}

export interface PaletteInput {
  id: string
  colors: string[]
}

/**
 * 对印花图做色卡映射。
 * @returns 映射后的 dataURL；失败/无需映射时返回原 URL
 */
export async function applyPaletteMapping(
  imageURL: string,
  palette: PaletteInput,
  strength = 1,
): Promise<string> {
  if (!imageURL || !palette || strength <= 0) return imageURL
  const key = `${imageURL.slice(0, 80)}|${palette.id}|${Math.round(strength * 100)}`
  const cached = MEMO.get(key)
  if (cached) return cached

  try {
    const img = await loadImage(imageURL)
    if (!img) return imageURL
    const w = img.width
    const h = img.height
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    if (!ctx) return imageURL
    ctx.drawImage(img, 0, 0)
    const imgData = ctx.getImageData(0, 0, w, h)
    const data = imgData.data
    const palRGB = palette.colors.map(hexToRgb)
    const k = Math.max(0, Math.min(1, strength))
    const inv = 1 - k

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const best = findNearest(r, g, b, palRGB)
      data[i] = Math.round(r * inv + best.r * k)
      data[i + 1] = Math.round(g * inv + best.g * k)
      data[i + 2] = Math.round(b * inv + best.b * k)
    }
    ctx.putImageData(imgData, 0, 0)
    const out = c.toDataURL('image/png')
    if (MEMO.size > 30) MEMO.clear()
    MEMO.set(key, out)
    return out
  } catch {
    return imageURL
  }
}
