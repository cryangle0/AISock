/**
 * App 花型路由：分类 / 公共库（访客）/ 个人库（登录）
 */
import { Hono } from 'hono'
import { ok, paginated } from '../../utils/response.js'
import { getUserId, getPageQuery } from '../../utils/context.js'
import { listCategories, listPatterns, createPattern, deletePattern } from '../../services/pattern.service.js'

export const patternsRouter = new Hono()

/** 分类列表 */
patternsRouter.get('/categories', async (c) => {
  return ok(c, await listCategories())
})

/** 公共花型库（分页 + 分类/关键词筛选） */
patternsRouter.get('/', async (c) => {
  const { pageNum, pageSize, offset } = getPageQuery(c, 20)
  const categoryId = c.req.query('categoryId') ? Number(c.req.query('categoryId')) : undefined
  const keyword = c.req.query('keyword') || undefined
  const { list, total } = await listPatterns({ categoryId, keyword, offset, pageSize })
  return paginated(c, list, total, pageNum, pageSize)
})

/** 我的花型（个人库，需登录） */
patternsRouter.get('/mine', async (c) => {
  const { pageNum, pageSize, offset } = getPageQuery(c, 20)
  const { list, total } = await listPatterns({ ownerId: getUserId(c), offset, pageSize })
  return paginated(c, list, total, pageNum, pageSize)
})

/** 上传个人花型 */
patternsRouter.post('/mine', async (c) => {
  const body = await c.req.json<{ name: string; imageUrl: string; thumbUrl?: string; categoryId?: number }>()
  const id = await createPattern({
    owner_id: getUserId(c),
    name: body.name,
    image_url: body.imageUrl,
    thumb_url: body.thumbUrl ?? null,
    category_id: body.categoryId ?? null,
    source: 'personal',
  })
  return ok(c, { id })
})

/** 删除个人花型 */
patternsRouter.delete('/mine/:id', async (c) => {
  await deletePattern(Number(c.req.param('id')), getUserId(c))
  return ok(c, { deleted: true })
})
