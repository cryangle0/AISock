/**
 * AI 生成配置 —— 按平台（小程序 / web / 默认）可配的模型与提示词模板。
 *
 * 存储：复用 app_config 表，key = 'ai_generation'，value 为 AiGenerationConfig（JSON）。
 * 解析优先级：平台覆盖 > default > 环境变量/内置默认（保证未配置时仍可用，向后兼容）。
 * 读多写少，复用 config.service 的 Redis 短缓存。
 */
import { getPublicValue, upsertConfig } from './config.service.js'

export type AiPlatform = 'miniprogram' | 'web' | 'default'

/** 图像服务提供方 */
export type AiProvider = 'dashscope' | 'kie' | 'generic' | 'openai' | 'nanobanana' | 'doubao'

/**
 * 各提供方默认接口基址（后台「接口基址」留空时用）。
 * 模型名一律不写死，由后台填写 / 「拉取模型」动态获取，确保始终能用各家最新模型。
 */
export const PROVIDER_DEFAULT_BASE: Record<AiProvider, string> = {
  openai: 'https://api.openai.com/v1',
  nanobanana: 'https://generativelanguage.googleapis.com/v1beta',
  doubao: 'https://ark.cn-beijing.volces.com/api/v3',
  dashscope: 'https://dashscope.aliyuncs.com',
  kie: 'https://api.kie.ai',
  generic: '',
}

/** 单平台的 AI 生成参数 */
export interface AiPlatformConfig {
  /** 图像服务提供方：dashscope=阿里万相 / kie=KIE / openai / nanobanana=Gemini / doubao=火山方舟 / generic=通用接口 */
  provider: AiProvider
  /** 文生图模型（如 万相 wan2.7-t2i-preview） */
  text2imgModel: string
  /** 图生图 / 图像编辑模型（如 万相 wan2.7-image-edit） */
  img2imgModel: string
  /** 文本模型：提示词优化（如 qwen-plus / qwen3.7-max） */
  textModel: string
  /** 语音识别模型（如 qwen3-asr-flash） */
  asrModel: string
  /** 提示词模板，{prompt} 为用户输入占位符 */
  promptTemplate: string
  /** 出图比例，如 1:1 / 3:4 */
  aspectRatio: string
  /** 服务 API 密钥（留空则用服务器环境变量）。后台可配，便于免改 .env 切换密钥 */
  apiKey: string
  /** 服务接口基址（留空用默认/环境变量），如 https://dashscope.aliyuncs.com */
  apiBaseUrl: string
}

/** 完整配置：default 必填，miniprogram/web 为可选覆盖 */
export interface AiGenerationConfig {
  default: AiPlatformConfig
  miniprogram?: Partial<AiPlatformConfig>
  web?: Partial<AiPlatformConfig>
}

export const AI_CONFIG_KEY = 'ai_generation'

/** 内置默认：通义万相 wan2.7 统一图像模型（已对线上 DashScope 账号实测可用；后台可改）。
 *  wan2.7-image-pro 统一文生图/图像编辑，走 multimodal-generation 同步接口。 */
export const BUILTIN_DEFAULT: AiPlatformConfig = {
  provider: 'dashscope',
  text2imgModel: 'wan2.7-image-pro',
  img2imgModel: 'wan2.7-image-pro',
  textModel: 'qwen3.7-max',
  asrModel: 'qwen3-asr-flash',
  promptTemplate: '袜款印花图案，{prompt}，平铺无缝，高清细节，flat lay',
  aspectRatio: '1:1',
  apiKey: '',
  apiBaseUrl: '',
}

/** 读取完整配置（后台编辑用）；不存在时返回内置默认结构 */
export async function getAiConfig(): Promise<AiGenerationConfig> {
  return getPublicValue<AiGenerationConfig>(AI_CONFIG_KEY, { default: BUILTIN_DEFAULT })
}

/** 保存完整配置（后台写入） */
export async function saveAiConfig(config: AiGenerationConfig): Promise<void> {
  await upsertConfig({
    configKey: AI_CONFIG_KEY,
    title: 'AI 生成模型配置',
    value: normalize(config),
    status: 1,
    remark: '按平台配置 文本/文生图/图生图/语音识别 模型与提示词模板',
  })
}

/**
 * 解析某平台的生效参数：平台覆盖 > default > 内置默认。
 * 任一字段缺失/空串都逐级回退，永不返回空值（apiKey/apiBaseUrl 允许空 = 用环境变量）。
 */
export async function resolvePlatformConfig(platform: AiPlatform): Promise<AiPlatformConfig> {
  const cfg = await getAiConfig()
  const base = { ...BUILTIN_DEFAULT }
  ;(Object.keys(BUILTIN_DEFAULT) as (keyof AiPlatformConfig)[]).forEach((k) => {
    const v = cfg.default?.[k]
    if (typeof v === 'string' && (v.trim() || k === 'apiKey' || k === 'apiBaseUrl')) {
      ;(base as Record<string, string>)[k] = v.trim()
    }
  })
  if (platform === 'default') return base
  const override = cfg[platform] || {}
  return {
    provider: override.provider || base.provider,
    text2imgModel: override.text2imgModel || base.text2imgModel,
    img2imgModel: override.img2imgModel || base.img2imgModel,
    textModel: override.textModel || base.textModel,
    asrModel: override.asrModel || base.asrModel,
    promptTemplate: override.promptTemplate || base.promptTemplate,
    aspectRatio: override.aspectRatio || base.aspectRatio,
    apiKey: override.apiKey || base.apiKey,
    apiBaseUrl: override.apiBaseUrl || base.apiBaseUrl,
  }
}

/** 用模板渲染最终提示词；模板无 {prompt} 占位时自动追加用户输入 */
export function renderPrompt(template: string, userPrompt: string): string {
  const p = userPrompt || '装饰纹样'
  if (template.includes('{prompt}')) return template.replace(/\{prompt\}/g, p)
  return `${template}，${p}`
}

/**
 * 文本/对话端点解析（OpenAI 兼容 chat/completions）。
 * 后台配置了 openai / doubao / dashscope / nanobanana 且填了密钥 + 文本模型时返回端点，
 * 否则返回 null，调用方回退到原有环境变量逻辑（DeepSeek / DashScope），不破坏现网。
 * 返回的 apiUrl 为基址，调用方自行拼接 `/chat/completions`。
 * 这些新模型多为多模态，可在 messages 里附带图片（OpenAI 兼容的 image_url 格式）。
 */
export function resolveTextTarget(cfg: AiPlatformConfig | null): { apiUrl: string; apiKey: string; model: string } | null {
  if (!cfg || !cfg.apiKey || !cfg.textModel) return null
  const key = cfg.apiKey
  const model = cfg.textModel
  const base = (cfg.apiBaseUrl || PROVIDER_DEFAULT_BASE[cfg.provider] || '').replace(/\/$/, '')
  switch (cfg.provider) {
    case 'openai':
    case 'doubao':
      return base ? { apiUrl: base, apiKey: key, model } : null
    case 'nanobanana':
      // Google Gemini 的 OpenAI 兼容端点
      return { apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', apiKey: key, model }
    case 'dashscope':
      return { apiUrl: `${base}/compatible-mode/v1`, apiKey: key, model }
    default:
      return null
  }
}

/** 规范化：保证 default 各字段齐全（空串不覆盖内置默认），去除平台覆盖里的空字符串。
 *  apiKey/apiBaseUrl 例外 —— 空串本身就是「用服务器环境变量」的合法语义。 */
function normalize(config: AiGenerationConfig): AiGenerationConfig {
  const def = { ...BUILTIN_DEFAULT }
  ;(Object.keys(BUILTIN_DEFAULT) as (keyof AiPlatformConfig)[]).forEach((k) => {
    const v = config.default?.[k]
    if (typeof v === 'string' && (v.trim() || k === 'apiKey' || k === 'apiBaseUrl')) {
      ;(def as Record<string, string>)[k] = v.trim()
    }
  })
  const clean = (o?: Partial<AiPlatformConfig>): Partial<AiPlatformConfig> | undefined => {
    if (!o) return undefined
    const out: Partial<AiPlatformConfig> = {}
    ;(Object.keys(o) as (keyof AiPlatformConfig)[]).forEach((k) => {
      const v = o[k]
      if (typeof v === 'string' && v.trim()) (out as Record<string, string>)[k] = v.trim()
    })
    return Object.keys(out).length ? out : undefined
  }
  return { default: def, miniprogram: clean(config.miniprogram), web: clean(config.web) }
}
