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

/** 标签（礼赠场景 / 风格 等维度，后台「标签管理」可配） */
export interface Tag {
  id: number
  kind: string
  code: string
  name: string
  description: string | null
  icon_url: string | null
  sort: number
  status: number
}

/** 按维度拉取启用标签（访客可读）。启动期非关键：静默 + 8s 超时 */
export function listTags(kind: 'scene' | 'style' | (string & {})) {
  return http.get<Tag[]>('/api/v1/app/tags', { kind }, { showLoading: false, silent: true, timeout: 8000 })
}

export function listSocks() {
  return http.get<SockModel[]>('/api/v1/app/socks', undefined, { showLoading: false })
}

/** 袜型详情（含 geometry_json 矢量分区几何，按需加载） */
export function getSock(id: number) {
  return http.get<SockModel>(`/api/v1/app/socks/${id}`, undefined, { showLoading: false })
}

export function listPatternCategories() {
  return http.get<PatternCategory[]>('/api/v1/app/patterns/categories', undefined, { showLoading: false })
}

export function listPatterns(params: {
  pageNum?: number
  pageSize?: number
  categoryId?: number
  keyword?: string
  /** 按礼赠场景标签 id 筛选（维度内 OR） */
  sceneIds?: number[]
  /** 按风格标签 id 筛选（维度内 OR；与其它维度 AND） */
  styleIds?: number[]
  /** 按主题标签 id 筛选（发现页 Tab；维度内 OR；与其它维度 AND） */
  themeIds?: number[]
}) {
  const { sceneIds, styleIds, themeIds, ...rest } = params
  const q: Record<string, unknown> = { ...rest }
  // 数组转逗号分隔字符串，避免各端 query 序列化差异（与后端 parseIdList 对齐）
  if (sceneIds?.length) q.sceneIds = sceneIds.join(',')
  if (styleIds?.length) q.styleIds = styleIds.join(',')
  if (themeIds?.length) q.themeIds = themeIds.join(',')
  return http.get<PageResult<Pattern>>('/api/v1/app/patterns', q, { showLoading: false })
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

/** 发现页配图 + 商品详情默认内容 */
export interface FeedDiscoverBundle {
  discover: {
    hero: string
    modelA: string
    modelB: string
    sockA: string
    sockB: string
    navTitle: string
    pageSize: number
  }
  detail: {
    navTitle: string
    seriesTitle: string
    description: string
    cover: string
    slides: string[]
    gallery: string[]
  }
}

export function getFeedDiscover() {
  return http.get<FeedDiscoverBundle>('/api/v1/app/feed/discover', undefined, { showLoading: false, silent: true, timeout: 8000 })
}

export function listNews() {
  return http.get<Article[]>('/api/v1/app/feed/news', undefined, { showLoading: false })
}
