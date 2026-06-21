import axios from 'axios'

/** 标签（礼赠场景 / 风格 等维度） */
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

export function listTags(kind?: string) {
  return axios.get<Tag[]>('/api/v1/admin/tags', { params: kind ? { kind } : {} })
}

export function createTag(data: {
  kind: string
  code: string
  name: string
  description?: string | null
  iconUrl?: string | null
  sort?: number
  status?: number
}) {
  return axios.post<{ id: number }>('/api/v1/admin/tags', data)
}

export function updateTag(
  id: number,
  data: {
    code?: string
    name?: string
    description?: string | null
    iconUrl?: string | null
    sort?: number
    status?: number
  },
) {
  return axios.put(`/api/v1/admin/tags/${id}`, data)
}

export function deleteTag(id: number) {
  return axios.delete(`/api/v1/admin/tags/${id}`)
}

// ── 花型 ↔ 标签 关联 ──
export function getPatternTagIds(patternId: number) {
  return axios.get<number[]>(`/api/v1/admin/patterns/${patternId}/tags`)
}

export function setPatternTags(patternId: number, tagIds: number[]) {
  return axios.put(`/api/v1/admin/patterns/${patternId}/tags`, { tagIds })
}
