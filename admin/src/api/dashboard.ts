import axios from 'axios'

export interface Overview {
  userCount: number
  orderCount: number
  designCount: number
  aiTaskCount: number
  revenue: number
}

export function getOverview() {
  return axios.get<Overview>('/api/v1/admin/dashboard/overview')
}

export function getOrderTrend() {
  return axios.get<Array<{ day: string; n: number }>>('/api/v1/admin/dashboard/order-trend')
}
