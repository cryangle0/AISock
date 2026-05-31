import axios from 'axios'
import type { PageResult } from './patterns'

export interface AdminOrder {
  id: number
  order_no: string
  user_id: number
  user_phone: string | null
  user_nickname: string | null
  design_name: string | null
  quantity: number
  total_amount: number
  material: string | null
  craft: string | null
  address: string | null
  status: string
  pay_method: string | null
  paid_at: string | null
  created_at: string
  remark?: string | null
  sizes?: Record<string, number> | null
}

export function listOrders(params: { pageNum?: number; pageSize?: number; status?: string; keyword?: string }) {
  return axios.get<PageResult<AdminOrder>>('/api/v1/admin/orders', { params })
}

export function getOrder(id: number) {
  return axios.get<AdminOrder>(`/api/v1/admin/orders/${id}`)
}

export function updateOrderStatus(id: number, status: string) {
  return axios.put(`/api/v1/admin/orders/${id}/status`, { status })
}
