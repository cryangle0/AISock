import { http } from './http.js'
import type { AiTask } from '@aisock/common/types'

export { streamChat } from './ai-chat.js'
export type { StreamChatTurn, StreamChatPayload, StreamChatHandlers, StreamChatHandle } from './ai-chat.js'

export function getQuota() {
  return http.get<{ limit: number; remaining: number }>('/api/v1/app/ai/quota', undefined, { showLoading: false })
}

export function generate(data: { type?: string; prompt?: string; refImage?: string; platform?: string }) {
  // AI 出图后端同步轮询最长 ~90s，故放宽超时到 120s，避免前端先超时而后端已成功
  return http.post<AiTask>('/api/v1/app/ai/generate', { platform: 'miniprogram', ...data }, { loadingText: 'AI 生成中...', timeout: 120000 })
}

/**
 * 意图分析：把模糊指令优化成高质量提示词。
 * @param options.showLoading 是否显示全屏 loading 遮罩（默认 true）。
 *   对话场景应传 false，避免遮罩打断流式打字动画。
 */
export function optimizePrompt(prompt: string, options?: { showLoading?: boolean }) {
  return http.post<{ original: string; optimized: string }>(
    '/api/v1/app/ai/optimize-prompt',
    { prompt, platform: 'miniprogram' },
    { loadingText: 'AI 优化中...', timeout: 30000, showLoading: options?.showLoading ?? true, silent: options?.showLoading === false },
  )
}

/** 图生图 / 指令改色：基于参考图 + 指令生成（如改背景、换配色风格） */
export function remixImage(refImage: string, prompt: string) {
  return http.post<AiTask>('/api/v1/app/ai/generate', { platform: 'miniprogram', type: 'img2img', refImage, prompt }, { loadingText: 'AI 改色中...', timeout: 120000 })
}

export function listTasks() {
  return http.get<AiTask[]>('/api/v1/app/ai/tasks')
}

/** 语音识别：把已上传的音频 URL 转写为文本（千问 ASR） */
export function asr(audioUrl: string) {
  return http.post<{ text: string }>('/api/v1/app/ai/asr', { audioUrl, platform: 'miniprogram' }, { loadingText: '识别中...', timeout: 30000 })
}

export interface VariantColors {
  bodyHex: string
  weltHex: string
  heelHex: string
  toeHex: string
}
export interface VariantParams {
  density: number
  rotation: number
  singleMode: boolean
  tileDensity: number
}
/** 服务端下发的变体「配方」：配色 + 调节参数，由客户端套用到当前印花渲染预览 */
export interface VariantRecipe {
  id: string
  name: string
  scheme: string
  colors: VariantColors
  params: VariantParams
  tag?: 'adult' | 'kid'
}

/** 款式衍生：取 N 套配色/排布配方 */
export function derive(count: number) {
  return http.post<VariantRecipe[]>('/api/v1/app/ai/derive', { count }, { loadingText: 'AI 创作中...' })
}

/** 亲子袜：成人 + 儿童配方 */
export function family() {
  return http.post<VariantRecipe[]>('/api/v1/app/ai/family', {}, { loadingText: 'AI 创作中...' })
}
