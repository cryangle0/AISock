/**
 * 图片加载工具 — 统一处理跨域、失败兜底，供渲染管线复用。
 */

const CACHE = new Map<string, HTMLImageElement | null>()

/** 加载单张图片，失败返回 null（不抛错，保证渲染链路不中断） */
export function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  const cached = CACHE.get(src)
  if (cached !== undefined) return Promise.resolve(cached)
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (CACHE.size > 60) CACHE.clear()
      CACHE.set(src, img)
      resolve(img)
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** 把 dataURL 压缩到指定最大宽度，避免存储体积过大 */
export async function compressDataURL(dataURL: string, maxW = 280, mime: 'image/png' | 'image/jpeg' = 'image/png', quality = 0.85): Promise<string> {
  if (!dataURL) return ''
  const img = await loadImage(dataURL)
  if (!img) return ''
  const ratio = img.width / img.height
  const w = Math.min(maxW, img.width)
  const h = Math.round(w / ratio)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)
  try {
    return c.toDataURL(mime, quality)
  } catch {
    return ''
  }
}
