/**
 * 阿里云 OSS 上传（无第三方依赖，自实现 V1 签名）。
 * - 复用 onnsa 项目同一 bucket，公网经 CDN 域名访问。
 * - 未配置 OSS 凭证时 ossEnabled() 返回 false，调用方回退本地磁盘。
 *
 * 签名规范见阿里云文档「在请求中包含签名（V1）」：
 *   Authorization = "OSS " + AccessKeyId + ":" + base64(hmac-sha1(SecretKey, StringToSign))
 *   StringToSign  = VERB\nContent-MD5\nContent-Type\nDate\nCanonicalizedOSSHeaders+CanonicalizedResource
 */
import { createHmac, createHash, randomBytes } from 'node:crypto'

export function ossEnabled(): boolean {
  return !!(
    process.env.OSS_ACCESS_KEY &&
    process.env.OSS_SECRET_KEY &&
    process.env.OSS_BUCKET &&
    process.env.OSS_ENDPOINT
  )
}

/** 公网访问地址：优先 CDN 域名，否则用 bucket.endpoint */
function publicUrl(objectKey: string): string {
  const cdn = process.env.OSS_CDN_DOMAIN
  if (cdn) {
    const base = cdn.startsWith('http') ? cdn : `https://${cdn}`
    return `${base.replace(/\/$/, '')}/${objectKey}`
  }
  const bucket = process.env.OSS_BUCKET
  const endpoint = process.env.OSS_ENDPOINT
  return `https://${bucket}.${endpoint}/${objectKey}`
}

/** 生成对象 key，如 ai/202605/ab12cd34ef.png */
export function genObjectKey(prefix: string, ext = 'png'): string {
  const d = new Date()
  const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
  const id = randomBytes(8).toString('hex')
  const cleanExt = ext.replace(/^\./, '').toLowerCase().slice(0, 6) || 'png'
  return `${prefix.replace(/\/$/, '')}/${yyyymm}/${id}.${cleanExt}`
}

/**
 * 上传二进制到 OSS，返回公网可访问 URL。
 * @param objectKey 对象路径（不以 / 开头）
 * @param data      文件内容
 * @param mime      Content-Type
 */
export async function putObject(objectKey: string, data: Buffer, mime = 'application/octet-stream'): Promise<string> {
  const accessKey = process.env.OSS_ACCESS_KEY!
  const secretKey = process.env.OSS_SECRET_KEY!
  const bucket = process.env.OSS_BUCKET!
  const endpoint = process.env.OSS_ENDPOINT!

  const date = new Date().toUTCString()
  const contentMd5 = createHash('md5').update(data).digest('base64')
  const resource = `/${bucket}/${objectKey}`
  const stringToSign = ['PUT', contentMd5, mime, date, resource].join('\n')
  const signature = createHmac('sha1', secretKey).update(stringToSign).digest('base64')

  const host = `${bucket}.${endpoint}`
  const resp = await fetch(`https://${host}/${objectKey}`, {
    method: 'PUT',
    headers: {
      Host: host,
      Date: date,
      'Content-Type': mime,
      'Content-MD5': contentMd5,
      Authorization: `OSS ${accessKey}:${signature}`,
    },
    body: data,
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`OSS PUT ${resp.status}: ${text.slice(0, 200)}`)
  }
  return publicUrl(objectKey)
}

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}

/**
 * 抓取远程图片并转存到 OSS（用于 AI 出图等临时 URL 落地）。
 * 失败时返回原始 URL，保证不阻断业务。
 */
export async function persistRemoteImage(remoteUrl: string, prefix = 'ai'): Promise<string> {
  if (!ossEnabled()) return remoteUrl
  try {
    const resp = await fetch(remoteUrl, { signal: AbortSignal.timeout(45_000) })
    if (!resp.ok) throw new Error(`下载源图 ${resp.status}`)
    const buf = Buffer.from(await resp.arrayBuffer())
    const ctype = resp.headers.get('content-type') || ''
    let ext = (remoteUrl.split('?')[0].match(/\.([a-z0-9]{1,5})$/i)?.[1] || '').toLowerCase()
    if (!ext) ext = ctype.includes('jpeg') ? 'jpg' : ctype.includes('webp') ? 'webp' : 'png'
    const mime = MIME_BY_EXT[ext] || ctype || 'image/png'
    const key = genObjectKey(prefix, ext)
    return await putObject(key, buf, mime)
  } catch (err: any) {
    console.warn(`[OSS] 转存远程图失败，回退原始 URL: ${err?.message || err}`)
    return remoteUrl
  }
}

/**
 * 把 base64 dataURL（如设计封面快照）转存到 OSS，返回短 URL。
 * - 非 dataURL 原样返回（已是普通 URL）
 * - 未配置 OSS 或失败时返回空串（调用方应避免把超长 base64 落库）
 */
export async function persistDataUrl(dataUrl: string, prefix = 'cover'): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl
  if (!ossEnabled()) return ''
  try {
    const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/s)
    if (!match) return ''
    const mime = match[1] || 'image/png'
    const isBase64 = /;base64,/.test(dataUrl)
    const buf = isBase64
      ? Buffer.from(match[2], 'base64')
      : Buffer.from(decodeURIComponent(match[2]), 'utf-8')
    const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : mime.includes('svg') ? 'svg' : 'png'
    const key = genObjectKey(prefix, ext)
    return await putObject(key, buf, mime)
  } catch (err: any) {
    console.warn(`[OSS] dataURL 转存失败: ${err?.message || err}`)
    return ''
  }
}
