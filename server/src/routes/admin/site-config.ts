/**
 * Admin 站点品牌配置：读取 / 保存 logo、标题、品牌名、副标题、版权等。
 */
import { Hono } from 'hono'
import { ok } from '../../utils/response.js'
import { getSiteConfig, saveSiteConfig, BUILTIN_SITE, type SiteConfig } from '../../services/siteConfig.service.js'

export const adminSiteConfigRouter = new Hono()

adminSiteConfigRouter.get('/', async (c) => {
  const config = await getSiteConfig()
  return ok(c, { config, builtinDefault: BUILTIN_SITE })
})

adminSiteConfigRouter.put('/', async (c) => {
  const body = await c.req.json<Partial<SiteConfig>>()
  await saveSiteConfig(body)
  return ok(c, { saved: true })
})
