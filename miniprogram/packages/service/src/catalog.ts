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

/** 公共花型详情（访客可读） */
export function getPattern(id: number) {
  return http.get<Pattern>(`/api/v1/app/patterns/${id}`, undefined, { showLoading: false })
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

// ── 推荐流 / 资讯 / FAQ ──
export interface Article {
  id: number
  kind: string
  title: string
  cover_url: string | null
  summary: string | null
  tag: string | null
  link: string | null
}

export function listFeed() {
  return http.get<Article[]>('/api/v1/app/feed', undefined, { showLoading: false })
}

export function listNews() {
  return http.get<Article[]>('/api/v1/app/feed/news', undefined, { showLoading: false })
}
