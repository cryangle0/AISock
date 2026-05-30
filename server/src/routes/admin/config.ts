/**
 * Admin 小程序运营配置：首页主题 / 功能区 / 案例展示等
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { listConfigs, getConfig, upsertConfig, updateConfigValue, deleteConfig } from '../../services/config.service.js'

export const adminConfigRouter = new Hono()

/** 全部配置项 */
adminConfigRouter.get('/', async (c) => {
  return ok(c, await listConfigs())
})

/** 单个配置项 */
adminConfigRouter.get('/:key', async (c) => {
  const cfg = await getConfig(c.req.param('key'))
  if (!cfg) return fail(c, '配置项不存在', 404)
  return ok(c, cfg)
})

/** 新增 / 更新配置（upsert by key） */
adminConfigRouter.post('/', async (c) => {
  const body = await c.req.json<{ configKey?: string; title?: string; value?: unknown; status?: number; remark?: string }>()
  if (!body.configKey) return fail(c, '配置键不能为空')
  await upsertConfig({
    configKey: body.configKey,
    title: body.title,
    value: body.value,
    status: body.status,
    remark: body.remark,
  })
  return ok(c, { saved: true })
})

/** 更新某 key 的 value（+可选 status） */
adminConfigRouter.put('/:key', async (c) => {
  const body = await c.req.json<{ value?: unknown; status?: number }>()
  await updateConfigValue(c.req.param('key'), body.value, body.status)
  return ok(c, { updated: true })
})

adminConfigRouter.delete('/:key', async (c) => {
  await deleteConfig(c.req.param('key'))
  return ok(c, { deleted: true })
})
