import { http } from './http.js'
import type { Design } from '@aisock/common/types'

export function listDesigns() {
  return http.get<Design[]>('/api/v1/app/designs')
}

export function getDesign(id: number) {
  return http.get<Design>(`/api/v1/app/designs/${id}`)
}

export interface SaveDesignInput {
  name: string
  sockModelId?: number
  regions?: Record<string, unknown>
  coverUrl?: string
  fromPreset?: boolean
}

export function createDesign(data: SaveDesignInput) {
  return http.post<{ id: number }>('/api/v1/app/designs', data)
}

export function updateDesign(id: number, data: SaveDesignInput) {
  return http.put(`/api/v1/app/designs/${id}`, data)
}

export function deleteDesign(id: number) {
  return http.delete(`/api/v1/app/designs/${id}`)
}
