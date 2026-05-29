/**
 * Admin 花型管理（公共库增删 + 分类）
 */
import { Hono } from 'hono'
import { ok, fail, paginated } from '../../utils/response.js'
import { getPageQuery } from '../../utils/context.js'
import { listPatterns, listCategories, createPattern, deletePattern } from '../../services/pattern.service.js'
import { execute } from '../../db.js'

export const adminPatternsRouter = new Hono()

adminPatternsRouter.get('/categories', async (c) => {
  return ok(c, await listCategories())
})

adminPatternsRouter.post('/categories', async (c) => {
  const { name, sort } = await c.req.json<{ name?: string; sort?: number }>()
  if (!name) return fail(c, '分类名不能为空')
  const r = await execute('INSERT INTO pattern_category (name, sort) VALUES (?, ?)', [name, sort ?? 0])
  return ok(c, { id: r.insertId })
})

adminPatternsRouter.get('/', async (c) => {
  const { pageNum, pageSize, offset } = getPageQuery(c, 20)
  const categoryId = c.req.query('categoryId') ? Number(c.req.query('categoryId')) : undefined
  const keyword = c.req.query('keyword') || undefined
  const { list, total } = await listPatterns({ categoryId, keyword, offset, pageSize })
  return paginated(c, list, total, pageNum, pageSize)
})

adminPatternsRouter.post('/', async (c) => {
  const body = await c.req.json()
  if (!body?.name || !body?.imageUrl) return fail(c, '名称和图片不能为空')
  const id = await createPattern({
    name: body.name,
    image_url: body.imageUrl,
    thumb_url: body.thumbUrl ?? null,
    category_id: body.categoryId ?? null,
    source: 'public',
  })
  return ok(c, { id })
})

adminPatternsRouter.delete('/:id', async (c) => {
  await deletePattern(Number(c.req.param('id')))
  return ok(c, { deleted: true })
})
