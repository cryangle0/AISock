import { http } from './http.js'
import type { Order } from '@aisock/common/types'

export function listOrders(status?: string) {
  return http.get<Order[]>('/api/v1/app/orders', status ? { status } : undefined)
}

export function getOrderStats() {
  return http.get<Record<string, number>>('/api/v1/app/orders/stats', undefined, { showLoading: false })
}

export function getOrder(id: number) {
  return http.get<Order>(`/api/v1/app/orders/${id}`)
}

export interface CreateOrderInput {
  designId?: number
  designName?: string
  sockModelId?: number
  sizes?: Record<string, number>
  quantity: number
  unitPrice: number
  material?: string
  craft?: string
  address?: string
  remark?: string
}

export function createOrder(data: CreateOrderInput) {
  return http.post<{ id: number; orderNo: string }>('/api/v1/app/orders', data)
}

export function payOrder(id: number, payMethod = '微信支付') {
  return http.post(`/api/v1/app/orders/${id}/pay`, { payMethod })
}
