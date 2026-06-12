/**
 * 文件上传路由（multipart/form-data）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { saveBuffer } from '../../services/upload.service.js'

export const uploadRouter = new Hono()

// 允许位图、PDF 与常见音频（语音输入 ASR）；SVG 可内嵌脚本（存储型 XSS）故不允许
const ALLOW_MIME = /^(image\/(png|jpe?g|webp|gif)|application\/pdf|audio\/(mpeg|mp3|aac|x-m4a|mp4|wav|x-wav|webm|amr|ogg))$/

uploadRouter.post('/', async (c) => {
  const form = await c.req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return fail(c, '缺少文件')
  if (file.size > 10 * 1024 * 1024) return fail(c, '文件超过 10MB 上限')
  const buf = Buffer.from(await file.arrayBuffer())
  // 音频 MIME 在小程序上传时可能为空/通用，按扩展名兜底放行（仅音频）
  const isAudioExt = /\.(mp3|aac|m4a|wav|amr|ogg|webm)$/i.test(file.name)
  if (!ALLOW_MIME.test(file.type) && !isAudioExt) return fail(c, '文件类型不允许')

  const result = await saveBuffer(getUserId(c) || null, file.name, file.type || 'application/octet-stream', buf)
  return ok(c, result)
})
