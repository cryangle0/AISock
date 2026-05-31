/**
 * 站点品牌配置（访客可访问）—— Web/小程序读取 logo/标题/品牌名等。
 */
import { Hono } from 'hono'
import { ok } from '../../utils/response.js'
import { getSiteConfig } from '../../services/siteConfig.service.js'

export const siteConfigRouter = new Hono()

siteConfigRouter.get('/', async (c) => {
  return ok(c, await getSiteConfig())
})
