/**
 * Admin AI 生成配置：按平台（默认 / 小程序 / web）配置文图生图模型与提示词模板。
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { requireRole } from '../../middleware/auth.js'
import {
  getAiConfig, saveAiConfig, BUILTIN_DEFAULT,
  type AiGenerationConfig, type AiPlatformConfig, type AiProvider,
} from '../../services/aiConfig.service.js'
import { listProviderModels, testProvider } from '../../services/ai.service.js'

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

/** 拉取某 provider 账号下可用的图像模型列表（填了 key 后动态获取，永远跟最新，不写死） */
adminAiConfigRouter.post('/models', async (c) => {
  const { provider, apiKey, apiBaseUrl } = await c.req.json<{ provider?: AiProvider; apiKey?: string; apiBaseUrl?: string }>()
  if (!provider) return fail(c, '缺少 provider')
  const models = await listProviderModels(provider, apiKey, apiBaseUrl)
  return ok(c, { models })
})

/** 测试：用给定配置真实出一张测试图，返回结果图地址或真实错误信息（不消耗用户配额） */
adminAiConfigRouter.post('/test', async (c) => {
  const body = await c.req.json<Partial<AiPlatformConfig>>()
  const cfg: AiPlatformConfig = {
    ...BUILTIN_DEFAULT,
    ...body,
    provider: (body.provider as AiProvider) || BUILTIN_DEFAULT.provider,
  }
  const result = await testProvider(cfg)
  return ok(c, result)
})
