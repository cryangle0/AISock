/**
 * AI 生成配置 —— 按平台（小程序 / web / 默认）可配的模型与提示词模板。
 *
 * 存储：复用 app_config 表，key = 'ai_generation'，value 为 AiGenerationConfig（JSON）。
 * 解析优先级：平台覆盖 > default > 环境变量/内置默认（保证未配置时仍可用，向后兼容）。
 * 读多写少，复用 config.service 的 Redis 短缓存。
 */
import { getPublicValue, upsertConfig } from './config.service.js'

export type AiPlatform = 'miniprogram' | 'web' | 'default'

/** 单平台的 AI 生成参数 */
export interface AiPlatformConfig {
  /** 文生图模型 */
  text2imgModel: string
  /** 图生图模型 */
  img2imgModel: string
  /** 提示词模板，{prompt} 为用户输入占位符 */
  promptTemplate: string
  /** 出图比例，如 1:1 / 3:4 */
  aspectRatio: string
}

/** 完整配置：default 必填，miniprogram/web 为可选覆盖 */
export interface AiGenerationConfig {
  default: AiPlatformConfig
  miniprogram?: Partial<AiPlatformConfig>
  web?: Partial<AiPlatformConfig>
}

export const AI_CONFIG_KEY = 'ai_generation'

/** 内置默认（与历史写死值一致，保证未配置时行为不变） */
export const BUILTIN_DEFAULT: AiPlatformConfig = {
  text2imgModel: 'google/nano-banana',
  img2imgModel: 'google/nano-banana-edit',
  promptTemplate: '袜款印花图案，{prompt}，平铺无缝，高清细节，flat lay',
  aspectRatio: '1:1',
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
    remark: '按平台配置文/图生图模型与提示词模板',
  })
}

/**
 * 解析某平台的生效参数：平台覆盖 > default > 内置默认。
 * 任一字段缺失都逐级回退，永不返回空值。
 */
export async function resolvePlatformConfig(platform: AiPlatform): Promise<AiPlatformConfig> {
  const cfg = await getAiConfig()
  const base = { ...BUILTIN_DEFAULT, ...(cfg.default || {}) }
  if (platform === 'default') return base
  const override = cfg[platform] || {}
  return {
    text2imgModel: override.text2imgModel || base.text2imgModel,
    img2imgModel: override.img2imgModel || base.img2imgModel,
    promptTemplate: override.promptTemplate || base.promptTemplate,
    aspectRatio: override.aspectRatio || base.aspectRatio,
  }
}

/** 用模板渲染最终提示词；模板无 {prompt} 占位时自动追加用户输入 */
export function renderPrompt(template: string, userPrompt: string): string {
  const p = userPrompt || '装饰纹样'
  if (template.includes('{prompt}')) return template.replace(/\{prompt\}/g, p)
  return `${template}，${p}`
}

/** 规范化：保证 default 各字段齐全，去除平台覆盖里的空字符串 */
function normalize(config: AiGenerationConfig): AiGenerationConfig {
  const def = { ...BUILTIN_DEFAULT, ...(config.default || {}) }
  const clean = (o?: Partial<AiPlatformConfig>): Partial<AiPlatformConfig> | undefined => {
    if (!o) return undefined
    const out: Partial<AiPlatformConfig> = {}
    ;(Object.keys(o) as (keyof AiPlatformConfig)[]).forEach((k) => {
      const v = o[k]
      if (typeof v === 'string' && v.trim()) out[k] = v.trim()
    })
    return Object.keys(out).length ? out : undefined
  }
  return { default: def, miniprogram: clean(config.miniprogram), web: clean(config.web) }
}
