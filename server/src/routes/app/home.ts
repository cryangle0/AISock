/**
 * App 首页聚合路由（访客可访问）
 * 返回 banner + 主题 + 推荐袜型 + 公共花型分类
 */
import { Hono } from 'hono'
import { ok } from '../../utils/response.js'
import { query } from '../../db.js'
import { listSocks } from '../../services/sock.service.js'
import { listCategories } from '../../services/pattern.service.js'

export const homeRouter = new Hono()

homeRouter.get('/', async (c) => {
  const [banners, socks, categories] = await Promise.all([
    query('SELECT id, title, subtitle, image_url, link FROM banner WHERE status = 1 ORDER BY sort ASC LIMIT 5'),
    listSocks(),
    listCategories(),
  ])
  return ok(c, {
    banners,
    socks: socks.slice(0, 8),
    categories,
  })
})
