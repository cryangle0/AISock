import http from './http'

export interface UserInfo {
  id: number
  phone: string | null
  nickname: string | null
  avatar: string | null
  aiQuotaDaily: number
}

export interface SockModel {
  id: number
  code: string
  name: string
  craft: string | null
  min_order: number
  unit_price: number
}

export interface Pattern {
  id: number
  name: string
  image_url: string
  thumb_url: string | null
}

export interface PatternCategory {
  id: number
  name: string
}

export interface Design {
  id: number
  name: string
  cover_url: string | null
  created_at: string
}

export interface Order {
  id: number
  order_no: string
  design_name: string | null
  quantity: number
  total_amount: number
  status: string
  created_at: string
}

export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

// ── 鉴权 ──
export const authApi = {
  smsSend: (phone: string) => http.post('/api/v1/app/auth/sms-send', { phone }),
  smsLogin: (phone: string, code: string) =>
    http.post<unknown, { data: { token: string; user: UserInfo } }>('/api/v1/app/auth/sms-login', { phone, code }),
  logout: () => http.post('/api/v1/app/auth/logout'),
}

// ── 目录 ──
export const catalogApi = {
  home: () => http.get<unknown, { data: { banners: unknown[]; socks: SockModel[]; categories: PatternCategory[] } }>('/api/v1/app/home'),
  listSocks: () => http.get<unknown, { data: SockModel[] }>('/api/v1/app/socks'),
  listCategories: () => http.get<unknown, { data: PatternCategory[] }>('/api/v1/app/patterns/categories'),
  listPatterns: (params: { pageNum?: number; pageSize?: number; categoryId?: number; keyword?: string }) =>
    http.get<unknown, { data: PageResult<Pattern> }>('/api/v1/app/patterns', { params }),
}

// ── 用户 ──
export const userApi = {
  profile: () => http.get<unknown, { data: UserInfo }>('/api/v1/app/user/profile'),
  overview: () => http.get<unknown, { data: { designs: number; orders: Record<string, number> } }>('/api/v1/app/user/overview'),
}

// ── 设计 ──
export const designApi = {
  list: () => http.get<unknown, { data: Design[] }>('/api/v1/app/designs'),
  create: (data: { name: string; sockModelId?: number; coverUrl?: string }) =>
    http.post<unknown, { data: { id: number } }>('/api/v1/app/designs', data),
  remove: (id: number) => http.delete(`/api/v1/app/designs/${id}`),
}

// ── 订单 ──
export const orderApi = {
  list: (status?: string) => http.get<unknown, { data: Order[] }>('/api/v1/app/orders', { params: status ? { status } : {} }),
  stats: () => http.get<unknown, { data: Record<string, number> }>('/api/v1/app/orders/stats'),
}

// ── AI ──
export interface StyleVariant {
  id: string
  pattern: string
  scheme: string
  prompt: string
}
export const aiApi = {
  quota: () => http.get<unknown, { data: { limit: number; remaining: number } }>('/api/v1/app/ai/quota'),
  generate: (data: { type?: string; prompt?: string }) =>
    http.post<unknown, { data: { id: number; result_urls: string[] | null; status: string } }>('/api/v1/app/ai/generate', data),
  derive: (prompt: string, count: number) =>
    http.post<unknown, { data: StyleVariant[] }>('/api/v1/app/ai/derive', { prompt, count }),
  family: (prompt: string) =>
    http.post<unknown, { data: StyleVariant[] }>('/api/v1/app/ai/family', { prompt }),
  inviteBonus: (bonus = 3) =>
    http.post<unknown, { data: { remaining: number } }>('/api/v1/app/ai/invite-bonus', { bonus }),
}
