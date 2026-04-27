// 色卡颜色映射 — 把任意 image dataURL/URL 的每个像素映射到色卡里距离最近的颜色，
// 输出新的 dataURL。strength=0 不映射，1 完全替换，中间值线性混合。

const MEMO = new Map() // key: `${url}|${paletteId}|${Math.round(strength*100)}`

const hexToRgb = (hex) => {
  const m = hex.replace('#', '')
  const v = m.length === 3
    ? m.split('').map(ch => parseInt(ch + ch, 16))
    : [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)]
  return { r: v[0], g: v[1], b: v[2] }
}

const findNearest = (r, g, b, palette) => {
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

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = (e) => reject(e)
  img.src = src
})

/**
 * @param {string} imageURL  原图（dataURL / 同源 URL）
 * @param {{id:string,colors:string[]}} palette  色卡
 * @param {number} strength  映射强度 0~1
 * @returns {Promise<string>}  替换后的 dataURL（失败时返回原 URL）
 */
export async function applyPaletteMapping(imageURL, palette, strength = 1) {
  if (!imageURL || !palette || strength <= 0) return imageURL
  const key = `${imageURL.slice(0, 80)}|${palette.id}|${Math.round(strength * 100)}`
  if (MEMO.has(key)) return MEMO.get(key)

  try {
    const img = await loadImage(imageURL)
    const w = img.width
    const h = img.height
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
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

// 工具：清缓存（极少用到，主要给开发期）
export function clearMappingCache() {
  MEMO.clear()
}
