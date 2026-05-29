import axios from 'axios'
import type { PageResult } from './patterns'

export interface AdminUser {
  id: number
  phone: string | null
  nickname: string | null
  avatar: string | null
  status: number
  ai_quota_daily: number
  created_at: string
}

export function listUsers(params: { pageNum?: number; pageSize?: number; keyword?: string }) {
  return axios.get<PageResult<AdminUser>>('/api/v1/admin/users', { params })
}

export function updateUserStatus(id: number, status: number) {
  return axios.put(`/api/v1/admin/users/${id}/status`, { status })
}

export function updateUserQuota(id: number, quota: number) {
  return axios.put(`/api/v1/admin/users/${id}/quota`, { quota })
}
