import { http } from './http.js'
import type { AiTask } from '@aisock/common/types'

export function getQuota() {
  return http.get<{ limit: number; remaining: number }>('/api/v1/app/ai/quota', undefined, { showLoading: false })
}

export function generate(data: { type?: string; prompt?: string; refImage?: string }) {
  return http.post<AiTask>('/api/v1/app/ai/generate', data, { loadingText: 'AI 生成中...' })
}

export function listTasks() {
  return http.get<AiTask[]>('/api/v1/app/ai/tasks')
}

export interface StyleVariant {
  id: string
  pattern: string
  scheme: string
  prompt: string
}

export function derive(prompt: string, count: number) {
  return http.post<StyleVariant[]>('/api/v1/app/ai/derive', { prompt, count }, { loadingText: 'AI 创作中...' })
}

export function family(prompt: string) {
  return http.post<StyleVariant[]>('/api/v1/app/ai/family', { prompt }, { loadingText: 'AI 创作中...' })
}

export function inviteBonus(bonus = 3) {
  return http.post<{ remaining: number }>('/api/v1/app/ai/invite-bonus', { bonus }, { silent: true })
}
