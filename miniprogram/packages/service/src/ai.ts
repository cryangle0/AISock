import { http } from './http.js'
import type { AiTask } from '@aisock/common/types'

export function getQuota() {
  return http.get<{ limit: number; remaining: number }>('/api/v1/app/ai/quota', undefined, { showLoading: false })
}

export function generate(data: { type?: string; prompt?: string; refImage?: string; platform?: string }) {
  return http.post<AiTask>('/api/v1/app/ai/generate', { platform: 'miniprogram', ...data }, { loadingText: 'AI 生成中...' })
}

export function listTasks() {
  return http.get<AiTask[]>('/api/v1/app/ai/tasks')
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

export function inviteBonus(bonus = 3) {
  return http.post<{ remaining: number }>('/api/v1/app/ai/invite-bonus', { bonus }, { silent: true })
}
