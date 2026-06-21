/**
 * 图片代理：供 Web Canvas 加载跨域 OSS 图（bucket 未配 CORS 时走同源代理）。
 * 仅允许白名单域名，防止 SSRF。
 */

const ALLOWED_HOSTS = new Set([
  'cdn.onnsa.cn',
  'sockdesign.oss-cn-hangzhou.aliyuncs.com',
  'onnsa.cn',
  'www.onnsa.cn',
])

/** 额外允许 bucket.endpoint 形态（与 OSS 环境变量一致时动态补充） */
function extraAllowedHosts(): string[] {
  const bucket = process.env.OSS_BUCKET
  const endpoint = process.env.OSS_ENDPOINT
  if (bucket && endpoint) return [`${bucket}.${endpoint}`]
  return []
}

export function isAllowedImageProxyUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    const host = u.hostname.toLowerCase()
    if (ALLOWED_HOSTS.has(host)) return true
    return extraAllowedHosts().some((h) => host === h.toLowerCase())
  } catch {
    return false
  }
}

/** 按文件头识别真实格式（避免 OSS 上扩展名/Content-Type 与内容不一致导致浏览器无法解码） */
export function sniffImageMime(buf: Buffer | Uint8Array): { mime: string; ext: string } {
  const b = buf instanceof Buffer ? buf : Buffer.from(buf)
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' }
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' }
  }
  if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp' }
  }
  if (b.length >= 6 && (b.toString('ascii', 0, 6) === 'GIF87a' || b.toString('ascii', 0, 6) === 'GIF89a')) {
    return { mime: 'image/gif', ext: 'gif' }
  }
  const head = b.subarray(0, Math.min(512, b.length)).toString('utf8').trimStart()
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    return { mime: 'image/svg+xml', ext: 'svg' }
  }
  return { mime: 'image/png', ext: 'png' }
}

export async function fetchProxiedImage(raw: string): Promise<{ body: ArrayBuffer; mime: string }> {
  const resp = await fetch(raw, { signal: AbortSignal.timeout(45_000) })
  if (!resp.ok) throw new Error(`源图 ${resp.status}`)
  const buf = Buffer.from(await resp.arrayBuffer())
  const { mime } = sniffImageMime(buf)
  if (!mime.startsWith('image/')) throw new Error('非图片资源')
  return { body: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), mime }
}
