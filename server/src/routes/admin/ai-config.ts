/**
 * Admin AI 生成配置：按平台（默认 / 小程序 / web）配置文图生图模型与提示词模板。
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { requireRole } from '../../middleware/auth.js'
import {
  getAiConfig, saveAiConfig, BUILTIN_DEFAULT,
  type AiGenerationConfig,
} from '../../services/aiConfig.service.js'

export const adminAiConfigRouter = new Hono()

// 配置含明文 apiKey，读写均限管理员角色
adminAiConfigRouter.use('*', requireRole('admin'))

/** 读取当前配置 + 内置默认（供前端展示占位/重置） */
adminAiConfigRouter.get('/', async (c) => {
  const config = await getAiConfig()
  return ok(c, { config, builtinDefault: BUILTIN_DEFAULT })
})

/** 保存配置 */
adminAiConfigRouter.put('/', async (c) => {
  const body = await c.req.json<AiGenerationConfig>()
  if (!body?.default?.text2imgModel || !body?.default?.img2imgModel) {
    return fail(c, '默认平台的文生图/图生图模型不能为空')
  }
  await saveAiConfig(body)
  return ok(c, { saved: true })
})
