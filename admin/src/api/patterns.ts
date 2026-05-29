import axios from 'axios'

export interface Pattern {
  id: number
  category_id: number | null
  name: string
  image_url: string
  thumb_url: string | null
  source: string
  status: number
}

export interface PatternCategory {
  id: number
  name: string
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

export function createCategory(data: { name: string; sort?: number }) {
  return axios.post<{ id: number }>('/api/v1/admin/patterns/categories', data)
}

export function listPatterns(params: { pageNum?: number; pageSize?: number; categoryId?: number; keyword?: string }) {
  return axios.get<PageResult<Pattern>>('/api/v1/admin/patterns', { params })
}

export function createPattern(data: { name: string; imageUrl: string; thumbUrl?: string; categoryId?: number }) {
  return axios.post<{ id: number }>('/api/v1/admin/patterns', data)
}

export function deletePattern(id: number) {
  return axios.delete(`/api/v1/admin/patterns/${id}`)
}
