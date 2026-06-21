import axios from 'axios'

export interface Pattern {
  id: number
  category_id: number | null
  name: string
  image_url: string
  thumb_url: string | null
  display_config: PatternDisplayConfig | null
  source: string
  status: number
}

export interface PatternDisplayConfig {
  feedTitle?: string
  feedCover?: string
  detailTitle?: string
  detailDescription?: string
  detailSlides?: string[]
  detailGallery?: string[]
}

export interface PatternCategory {
  id: number
  name: string
  description: string | null
  sort: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
  pages: number
}

export function listCategories() {
  return axios.get<PatternCategory[]>('/api/v1/admin/patterns/categories')
}

export function createCategory(data: { name: string; description?: string; sort?: number }) {
  return axios.post<{ id: number }>('/api/v1/admin/patterns/categories', data)
}

export function updateCategory(id: number, data: { name?: string; description?: string | null; sort?: number }) {
  return axios.put(`/api/v1/admin/patterns/categories/${id}`, data)
}

export function deleteCategory(id: number) {
  return axios.delete(`/api/v1/admin/patterns/categories/${id}`)
}

export function listPatterns(params: { pageNum?: number; pageSize?: number; categoryId?: number; keyword?: string; themeIds?: number[] }) {
  const { themeIds, ...rest } = params
  return axios.get<PageResult<Pattern>>('/api/v1/admin/patterns', {
    params: {
      ...rest,
      ...(themeIds?.length ? { themeIds: themeIds.join(',') } : {}),
    },
  })
}

export function createPattern(data: { name: string; imageUrl: string; thumbUrl?: string; categoryId?: number; displayConfig?: PatternDisplayConfig | null }) {
  return axios.post<{ id: number }>('/api/v1/admin/patterns', data)
}

export function updatePattern(id: number, data: { name?: string; imageUrl?: string; thumbUrl?: string; categoryId?: number | null; displayConfig?: PatternDisplayConfig | null }) {
  return axios.put(`/api/v1/admin/patterns/${id}`, data)
}

export function deletePattern(id: number) {
  return axios.delete(`/api/v1/admin/patterns/${id}`)
}
