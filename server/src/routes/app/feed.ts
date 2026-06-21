/**
 * 推荐流 / 资讯 / FAQ（访客可访问）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { listArticles, getArticle } from '../../services/article.service.js'
import { getFeedDiscoverBundle } from '../../services/feed-discover.service.js'

export const feedRouter = new Hono()

/** 发现页配图 + 商品详情默认内容（后台「小程序配置」可维护） */
feedRouter.get('/discover', async (c) => {
  return ok(c, await getFeedDiscoverBundle())
})

feedRouter.get('/', async (c) => {
  return ok(c, await listArticles('feed'))
})

feedRouter.get('/news', async (c) => {
  return ok(c, await listArticles('news'))
})

feedRouter.get('/faq', async (c) => {
  return ok(c, await listArticles('faq'))
})

feedRouter.get('/:id', async (c) => {
  const a = await getArticle(Number(c.req.param('id')))
  if (!a) return fail(c, '文章不存在', 404)
  return ok(c, a)
})
