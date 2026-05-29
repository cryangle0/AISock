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
