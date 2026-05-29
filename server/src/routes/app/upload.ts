/**
 * 文件上传路由（multipart/form-data）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { saveBuffer } from '../../services/upload.service.js'

export const uploadRouter = new Hono()

const ALLOW_MIME = /^(image\/(png|jpe?g|webp|gif|svg\+xml)|application\/pdf)$/

uploadRouter.post('/', async (c) => {
  const form = await c.req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return fail(c, '缺少文件')
  if (file.size > 10 * 1024 * 1024) return fail(c, '文件超过 10MB 上限')
  if (!ALLOW_MIME.test(file.type)) return fail(c, '文件类型不允许')

  const buf = Buffer.from(await file.arrayBuffer())
  const result = await saveBuffer(getUserId(c) || null, file.name, file.type, buf)
  return ok(c, result)
})
