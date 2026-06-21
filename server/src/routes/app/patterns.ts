/**
 * App 花型路由：分类 / 公共库（访客）/ 个人库（登录）
 */
import { Hono } from 'hono'
import { ok, paginated, fail } from '../../utils/response.js'
import { getUserId, getPageQuery } from '../../utils/context.js'
import { listCategories, listPatterns, createPattern, deletePattern, getPublicPatternById } from '../../services/pattern.service.js'

export const patternsRouter = new Hono()

/** 解析逗号分隔的正整数 id 列表（如 "1,2,3"），过滤非法值 */
function parseIdList(csv?: string): number[] {
  if (!csv) return []
  return csv
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
}

/** 分类列表 */
patternsRouter.get('/categories', async (c) => {
  return ok(c, await listCategories())
})

/** 公共花型库（分页 + 分类/关键词/标签筛选） */
patternsRouter.get('/', async (c) => {
  const { pageNum, pageSize, offset } = getPageQuery(c, 20)
  const categoryId = c.req.query('categoryId') ? Number(c.req.query('categoryId')) : undefined
  const keyword = c.req.query('keyword') || undefined
  // 标签筛选：sceneIds / styleIds / themeIds 为逗号分隔的标签 id；维度内 OR，维度间 AND
  const sceneIds = parseIdList(c.req.query('sceneIds'))
  const styleIds = parseIdList(c.req.query('styleIds'))
  const themeIds = parseIdList(c.req.query('themeIds'))
  const tagIdGroups = [sceneIds, styleIds, themeIds].filter((g) => g.length)
  const { list, total } = await listPatterns({ categoryId, keyword, tagIdGroups, offset, pageSize })
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

/** 公共花型详情（访客可读）。放在最后，避免与 /categories、/mine 等静态路由冲突 */
patternsRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) return fail(c, '无效的花型 ID')
  const pattern = await getPublicPatternById(id)
  if (!pattern) return fail(c, '花型不存在', 404)
  return ok(c, pattern)
})
