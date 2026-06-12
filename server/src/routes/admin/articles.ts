/**
 * Admin 推荐流 / 资讯 / FAQ 管理
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { listArticles, getArticle, createArticle, updateArticle, deleteArticle } from '../../services/article.service.js'

export const adminArticlesRouter = new Hono()

adminArticlesRouter.get('/', async (c) => {
  const kind = c.req.query('kind')
  // 后台需看到全部状态（含已下线），便于重新上线/编辑
  return ok(c, await listArticles(kind, 200, true))
})

adminArticlesRouter.get('/:id', async (c) => {
  const a = await getArticle(Number(c.req.param('id')), true)
  if (!a) return fail(c, '文章不存在', 404)
  return ok(c, a)
})

adminArticlesRouter.post('/', async (c) => {
  const body = await c.req.json()
  if (!body?.title) return fail(c, '标题不能为空')
  const id = await createArticle(body)
  return ok(c, { id })
})

adminArticlesRouter.put('/:id', async (c) => {
  await updateArticle(Number(c.req.param('id')), await c.req.json())
  return ok(c, { updated: true })
})

adminArticlesRouter.delete('/:id', async (c) => {
  await deleteArticle(Number(c.req.param('id')))
  return ok(c, { deleted: true })
})
