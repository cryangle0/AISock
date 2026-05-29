import { http } from './http.js'
import type { UserInfo } from '@aisock/common/types'

export function getProfile() {
  return http.get<UserInfo>('/api/v1/app/user/profile')
}

export function updateProfile(data: { nickname?: string; avatar?: string }) {
  return http.put('/api/v1/app/user/profile', data)
}

export function getOverview() {
  return http.get<{ designs: number; orders: Record<string, number> }>('/api/v1/app/user/overview', undefined, { showLoading: false })
}
