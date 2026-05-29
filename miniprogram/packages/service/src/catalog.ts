import { http } from './http.js'
import type { SockModel, Pattern, PatternCategory, PageResult } from '@aisock/common/types'

/** 首页聚合 */
export function getHome() {
  return http.get<{ banners: unknown[]; socks: SockModel[]; categories: PatternCategory[] }>(
    '/api/v1/app/home',
    undefined,
    { showLoading: false },
  )
}

export function listSocks() {
  return http.get<SockModel[]>('/api/v1/app/socks', undefined, { showLoading: false })
}

export function listPatternCategories() {
  return http.get<PatternCategory[]>('/api/v1/app/patterns/categories', undefined, { showLoading: false })
}

export function listPatterns(params: { pageNum?: number; pageSize?: number; categoryId?: number; keyword?: string }) {
  return http.get<PageResult<Pattern>>('/api/v1/app/patterns', params, { showLoading: false })
}

export function listMyPatterns(params: { pageNum?: number; pageSize?: number }) {
  return http.get<PageResult<Pattern>>('/api/v1/app/patterns/mine', params)
}

export function uploadMyPattern(data: { name: string; imageUrl: string; thumbUrl?: string; categoryId?: number }) {
  return http.post<{ id: number }>('/api/v1/app/patterns/mine', data)
}

export function deleteMyPattern(id: number) {
  return http.delete(`/api/v1/app/patterns/mine/${id}`)
}
