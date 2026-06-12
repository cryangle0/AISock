import axios from 'axios'

/** 单平台 AI 生成参数 */
export interface AiPlatformConfig {
  /** 图像服务提供方：dashscope=阿里万相 / kie=KIE / generic=通用接口 */
  provider: 'dashscope' | 'kie' | 'generic'
  text2imgModel: string
  img2imgModel: string
  /** 文本模型（提示词优化，如 qwen-plus / qwen3.7-max） */
  textModel: string
  /** 语音识别模型（如 qwen3-asr-flash） */
  asrModel: string
  promptTemplate: string
  aspectRatio: string
  /** 服务 API 密钥（留空用服务器环境变量） */
  apiKey: string
  /** 服务接口基址（留空用默认/环境变量） */
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
