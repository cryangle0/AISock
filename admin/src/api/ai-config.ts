import axios from 'axios'

/** 单平台 AI 生成参数 */
export interface AiPlatformConfig {
  text2imgModel: string
  img2imgModel: string
  promptTemplate: string
  aspectRatio: string
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
