/**
 * App 运营配置路由（访客可读）：小程序首页主题 / 功能区 / 案例展示等。
 * 只返回启用项的 value，带 Redis 短缓存，后台改动约 1 分钟内自动生效。
 */
import { Hono } from 'hono'
import { ok } from '../../utils/response.js'
import { getPublicValue } from '../../services/config.service.js'

export const appConfigRouter = new Hono()

/** 首页聚合配置：一次返回主题/功能区/案例，减少小程序请求数 */
appConfigRouter.get('/home', async (c) => {
  const [themes, zones, cases] = await Promise.all([
    getPublicValue('home_themes', []),
    getPublicValue('home_zones', []),
    getPublicValue('home_cases', []),
  ])
  return ok(c, { themes, zones, cases })
})

/** 通用：按 key 取单个配置 value（便于后续扩展更多配置块） */
appConfigRouter.get('/:key', async (c) => {
  const value = await getPublicValue(c.req.param('key'), [])
  return ok(c, value)
})

export default appConfigRouter
