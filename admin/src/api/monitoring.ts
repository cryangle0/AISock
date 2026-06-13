import axios from 'axios'
import type { PageResult } from './patterns'

export interface AiTask {
  id: number
  user_id: number
  user_phone: string | null
  type: string
  prompt: string | null
  status: string
  error: string | null
  created_at: string
}

export interface Shipment {
  id: number
  order_id: number
  carrier: string | null
  tracking_no: string | null
  status: string
  traces: Array<{ time: string; desc: string }> | null
}

export function listAiTasks(params: { pageNum?: number; pageSize?: number; status?: string }) {
  return axios.get<PageResult<AiTask>>('/api/v1/admin/ai-tasks', { params })
}
export function aiTaskStats() {
  return axios.get<Record<string, number>>('/api/v1/admin/ai-tasks/stats')
}

export function listShipments() {
  return axios.get<Shipment[]>('/api/v1/admin/shipments')
}
export function upsertShipment(data: { orderId: number; carrier: string; trackingNo: string }) {
  return axios.post('/api/v1/admin/shipments', data)
}
export function appendTrace(orderId: number, desc: string, status?: string) {
  return axios.post(`/api/v1/admin/shipments/${orderId}/trace`, { desc, status })
}
