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
  /** 单价仅用于展示参考，最终金额由服务端按材质/工艺权威计算 */
  unitPrice?: number
  material?: string
  craft?: string
  address?: string
  remark?: string
}

export function createOrder(data: CreateOrderInput) {
  return http.post<{ id: number; orderNo: string }>('/api/v1/app/orders', data)
}

export function updateOrder(id: number, patch: { remark?: string; address?: string }) {
  return http.put(`/api/v1/app/orders/${id}`, patch)
}

// ── 订单附件（设计稿 / 图片 / 文件，下单后可补传）──
export interface OrderAttachment {
  id: number
  order_id: number
  name: string
  url: string
  mime: string | null
  size: number
  created_at: string
}

export function listOrderAttachments(orderId: number) {
  return http.get<OrderAttachment[]>(`/api/v1/app/orders/${orderId}/attachments`, undefined, { showLoading: false })
}

export function addOrderAttachment(orderId: number, file: { name: string; url: string; mime?: string; size?: number }) {
  return http.post<{ id: number }>(`/api/v1/app/orders/${orderId}/attachments`, file)
}

export function removeOrderAttachment(orderId: number, attachmentId: number) {
  return http.delete(`/api/v1/app/orders/${orderId}/attachments/${attachmentId}`)
}

// ── 价格（服务端权威，前端仅展示）──
export interface PriceBreakdown {
  material: string
  craft: string
  basePrice: number
  craftFee: number
  unitPrice: number
  quantity: number
  total: number
}

/** 价目表：材质单价 + 工艺加价 */
export function getPricing() {
  return http.get<{ materials: Record<string, number>; crafts: Record<string, number> }>(
    '/api/v1/app/orders/pricing', undefined, { showLoading: false },
  )
}

/** 价格试算（服务端计算，下单最终以此为准） */
export function quotePrice(input: { material?: string; craft?: string; quantity: number }) {
  return http.post<PriceBreakdown>('/api/v1/app/orders/quote', input, { showLoading: false })
}

// ── 微信支付 ──
export interface PrepayResult {
  prepayId: string
  outTradeNo: string
  real: boolean
  jsApi?: { timeStamp: string; nonceStr: string; package: string; signType: 'RSA'; paySign: string }
}

export function prepay(orderId: number) {
  return http.post<PrepayResult>('/api/v1/app/pay/prepay', { orderId })
}

export function mockPaid(outTradeNo: string) {
  return http.post('/api/v1/app/pay/mock-paid', { outTradeNo })
}

// ── 物流 ──
export interface Shipment {
  order_id: number
  carrier: string | null
  tracking_no: string | null
  status: string
  traces: Array<{ time: string; desc: string }> | null
}

export function getShipment(orderId: number) {
  return http.get<Shipment | null>(`/api/v1/app/shipment/${orderId}`, undefined, { showLoading: false })
}
