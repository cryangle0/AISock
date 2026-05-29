import axios from 'axios'

export interface Article {
  id: number
  kind: string
  title: string
  cover_url: string | null
  summary: string | null
  tag: string | null
  link: string | null
  sort: number
  status: number
}

export function listArticles(kind?: string) {
  return axios.get<Article[]>('/api/v1/admin/articles', { params: kind ? { kind } : {} })
}
export function createArticle(data: Partial<Article>) {
  return axios.post<{ id: number }>('/api/v1/admin/articles', data)
}
export function updateArticle(id: number, data: Partial<Article>) {
  return axios.put(`/api/v1/admin/articles/${id}`, data)
}
export function deleteArticle(id: number) {
  return axios.delete(`/api/v1/admin/articles/${id}`)
}
