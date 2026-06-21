/**
 * 图片加载工具 — 统一处理跨域、失败兜底，供渲染管线复用。
 */

const CACHE = new Map<string, HTMLImageElement | null>()

function apiBase(): string {
  const base = import.meta.env.VITE_API_BASE_URL || '/aisock-api'
  return base.replace(/\/$/, '')
}

/** 跨域 OSS 图走同源代理，避免 Canvas 因 CORS 无法绘制 */
export function imageProxyUrl(remote: string): string {
  return `${apiBase()}/api/v1/app/image-proxy?url=${encodeURIComponent(remote)}`
}

function shouldProxy(src: string): boolean {
  if (!/^https?:\/\//i.test(src)) return false
  if (src.includes('/api/v1/app/image-proxy')) return false
  try {
    const host = new URL(src).hostname
    if (host === location.hostname) return false
    return true
  } catch {
    return false
  }
}

function tryLoad(src: string, crossOrigin: boolean): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** 加载单张图片，失败返回 null（不抛错，保证渲染链路不中断） */
export async function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  const cached = CACHE.get(src)
  if (cached !== undefined) return cached

  let img = await tryLoad(src, !src.startsWith('data:') && !src.startsWith('blob:'))
  if (!img && shouldProxy(src)) {
    img = await tryLoad(imageProxyUrl(src), false)
  }
  if (CACHE.size > 60) CACHE.clear()
  CACHE.set(src, img)
  return img
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
