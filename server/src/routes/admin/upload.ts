/**
 * Admin 图片上传（multipart/form-data）→ 转存 OSS → 返回可访问 URL
 * 后台各处「图片 URL」输入框统一改为上传：上传到 OSS 后把返回的 URL 存库。
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { saveBuffer } from '../../services/upload.service.js'

export const adminUploadRouter = new Hono()

// 后台仅允许图片（位图）；SVG 可内嵌脚本（存储型 XSS）故不允许
const ALLOW_MIME = /^image\/(png|jpe?g|webp|gif)$/

adminUploadRouter.post('/', async (c) => {
  const form = await c.req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return fail(c, '缺少文件')
  if (file.size > 10 * 1024 * 1024) return fail(c, '图片超过 10MB 上限')
  if (!ALLOW_MIME.test(file.type)) return fail(c, '仅支持 PNG/JPG/WEBP/GIF 图片')
  const buf = Buffer.from(await file.arrayBuffer())
  // 后台上传不归属具体用户（user_id = null），仅转存 OSS 并记录到 upload 表
  const result = await saveBuffer(null, file.name, file.type || 'image/png', buf)
  return ok(c, result)
})
