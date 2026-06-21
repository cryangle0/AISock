/**
 * App 标签路由（访客可读）：礼赠场景 / 风格 等维度
 * GET /api/v1/app/tags?kind=scene|style   不传 kind 返回全部启用标签
 */
import { Hono } from 'hono'
import { ok } from '../../utils/response.js'
import { listTags } from '../../services/tag.service.js'

export const tagsRouter = new Hono()

tagsRouter.get('/', async (c) => {
  const kind = c.req.query('kind') || undefined
  return ok(c, await listTags(kind))
})
