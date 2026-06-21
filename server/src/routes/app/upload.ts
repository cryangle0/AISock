/**
 * 文件上传路由（multipart/form-data）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { saveBuffer } from '../../services/upload.service.js'

export const uploadRouter = new Hono()

// 允许位图、PDF 与常见音频（语音输入 ASR）；SVG 可内嵌脚本（存储型 XSS）故不允许
const ALLOW_MIME = /^(image\/(png|jpe?g|webp|gif|heic|heif)|application\/pdf|audio\/(mpeg|mp3|aac|x-m4a|mp4|wav|x-wav|webm|amr|ogg))$/

const EXT_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.pdf': 'application/pdf',
}

/** 小程序 uni.uploadFile 常不带 MIME，按扩展名推断 */
function resolveMime(name: string, declared: string): string {
  if (declared && ALLOW_MIME.test(declared)) return declared
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ''
  if (ext && EXT_MIME[ext]) return EXT_MIME[ext]
  return declared || 'application/octet-stream'
}

function isAllowedUpload(name: string, mime: string): boolean {
  if (ALLOW_MIME.test(mime)) return true
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ''
  if (ext && EXT_MIME[ext]) return true
  return /\.(mp3|aac|m4a|wav|amr|ogg|webm)$/i.test(name)
}

uploadRouter.post('/', async (c) => {
  const form = await c.req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return fail(c, '缺少文件')
  if (file.size > 10 * 1024 * 1024) return fail(c, '文件超过 10MB 上限')
  const buf = Buffer.from(await file.arrayBuffer())
  const mime = resolveMime(file.name, file.type || '')
  if (!isAllowedUpload(file.name, mime)) return fail(c, '文件类型不允许')

  const result = await saveBuffer(getUserId(c) || null, file.name, mime, buf)
  return ok(c, result)
})
