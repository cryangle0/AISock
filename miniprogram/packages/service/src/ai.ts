import { http } from './http.js'
import type { AiTask, PageResult } from '@aisock/common/types'
import { API_BASE_URL } from '@aisock/common/constants'

export { streamChat } from './ai-chat.js'
export type { StreamChatTurn, StreamChatPayload, StreamChatHandlers, StreamChatHandle } from './ai-chat.js'

/** OSS 结果图可能 Content-Type 与内容不一致，走同源代理嗅探格式 */
export function imageProxyUrl(remote: string): string {
  if (!remote || remote.startsWith('data:') || remote.startsWith('wxfile:') || remote.includes('/image-proxy')) {
    return remote
  }
  if (!/^https?:\/\//i.test(remote)) return remote
  return `${API_BASE_URL}/api/v1/app/image-proxy?url=${encodeURIComponent(remote)}&v=2`
}

/** 解析任务首张结果图 URL（兼容 JSON 字符串） */
export function parseAiResultUrl(task: Pick<AiTask, 'result_urls' | 'status'>): string | null {
  if (task.status === 'failed') return null
  const raw = task.result_urls
  if (!raw) return null
  let urls: string[] = []
  if (Array.isArray(raw)) urls = raw
  else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      urls = Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : []
    } catch {
      return null
    }
  }
  return urls[0] || null
}
export function getQuota() {
  return http.get<{ limit: number; remaining: number }>('/api/v1/app/ai/quota', undefined, { showLoading: false })
}

export function generate(data: { type?: string; prompt?: string; refImage?: string; refImages?: string[]; platform?: string }) {
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

/** 图生图 / 指令改色：基于参考图 + 指令生成（1–9 张） */
export function remixImage(refImages: string | string[], prompt: string) {
  const refs = (Array.isArray(refImages) ? refImages : [refImages]).filter(Boolean).slice(0, 9)
  return http.post<AiTask>(
    '/api/v1/app/ai/generate',
    { platform: 'miniprogram', type: 'img2img', refImages: refs, refImage: refs[0], prompt },
    { loadingText: 'AI 改色中...', timeout: 120000 },
  )
}

export function listTasks(params?: { pageNum?: number; pageSize?: number; q?: string }) {
  return http.get<PageResult<AiTask>>(
    '/api/v1/app/ai/tasks',
    params,
    { showLoading: false },
  )
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
