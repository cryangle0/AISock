import axios from 'axios'

/** 图像服务提供方 */
export type AiProvider = 'dashscope' | 'kie' | 'generic' | 'openai' | 'nanobanana' | 'doubao'

/** 单平台 AI 生成参数 */
export interface AiPlatformConfig {
  /** 图像服务提供方 */
  provider: AiProvider
  text2imgModel: string
  img2imgModel: string
  /** 文本模型（提示词优化 / 推荐官对话，多为多模态，可图文输入） */
  textModel: string
  /** 语音识别模型（如 qwen3-asr-flash） */
  asrModel: string
  promptTemplate: string
  aspectRatio: string
  /** 服务 API 密钥（留空用服务器环境变量） */
  apiKey: string
  /** 服务接口基址（留空用各 provider 默认/环境变量） */
  apiBaseUrl: string
}

/** 完整配置：default 必填，miniprogram/web 为可选覆盖 */
export interface AiGenerationConfig {
  default: AiPlatformConfig
  miniprogram?: Partial<AiPlatformConfig>
  web?: Partial<AiPlatformConfig>
}

export function getAiConfig() {
  return axios.get<{ config: AiGenerationConfig; builtinDefault: AiPlatformConfig }>('/api/v1/admin/ai-config')
}

export function saveAiConfig(config: AiGenerationConfig) {
  return axios.put('/api/v1/admin/ai-config', config)
}

/** 拉取该 provider 账号下可用图像模型（填了 key 后动态获取，永远跟最新） */
export function fetchProviderModels(payload: { provider: AiProvider; apiKey?: string; apiBaseUrl?: string }) {
  return axios.post<{ models: string[] }>('/api/v1/admin/ai-config/models', payload)
}

/** 测试：用给定配置真实出一张测试图 */
export function testProvider(payload: Partial<AiPlatformConfig>) {
  return axios.post<{ ok: boolean; url?: string; message: string; elapsedMs: number }>('/api/v1/admin/ai-config/test', payload)
}
