import { http } from './http.js'
import type { SockModel, Pattern, PatternCategory, PageResult } from '@aisock/common/types'
import type { ConfigItem } from './config.js'

/** 首页运营 Banner（后台「Banner 管理」可配） */
export interface Banner {
  id: number
  title: string | null
  subtitle: string | null
  image_url: string
  link: string | null
}

/** 首页聚合：Banner + 主题/功能区/案例 + 袜型/分类（后台均可配） */
export interface HomeAggregate {
  banners: Banner[]
  socks: SockModel[]
  categories: PatternCategory[]
  themes: ConfigItem[]
  zones: ConfigItem[]
  cases: ConfigItem[]
}

/** 首页聚合（一次请求拿全）。启动期非关键：静默 + 8s 快速超时，失败回退本地默认 */
export function getHome() {
  return http.get<HomeAggregate>('/api/v1/app/home', undefined, { showLoading: false, silent: true, timeout: 8000 })
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
