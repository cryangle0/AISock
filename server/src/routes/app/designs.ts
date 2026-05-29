/**
 * App 设计稿路由（需登录）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import {
  listDesigns, getDesign, createDesign, updateDesign, deleteDesign,
} from '../../services/design.service.js'

export const designsRouter = new Hono()

designsRouter.get('/', async (c) => {
  return ok(c, await listDesigns(getUserId(c)))
})

designsRouter.get('/:id', async (c) => {
  const d = await getDesign(Number(c.req.param('id')), getUserId(c))
  if (!d) return fail(c, '设计稿不存在', 404)
  return ok(c, d)
})

designsRouter.post('/', async (c) => {
  const body = await c.req.json()
  if (!body?.name) return fail(c, '设计名称不能为空')
  const id = await createDesign(getUserId(c), body)
  return ok(c, { id })
})

designsRouter.put('/:id', async (c) => {
  const body = await c.req.json()
  await updateDesign(Number(c.req.param('id')), getUserId(c), body)
  return ok(c, { updated: true })
})

designsRouter.delete('/:id', async (c) => {
  await deleteDesign(Number(c.req.param('id')), getUserId(c))
  return ok(c, { deleted: true })
})
