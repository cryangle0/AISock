import http from './http'

export interface UserInfo {
  id: number
  phone: string | null
  nickname: string | null
  avatar: string | null
  aiQuotaDaily: number
  /** 是否已设置登录密码（profile 返回） */
  hasPassword?: boolean
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
  material?: string | null
  craft?: string | null
  address?: string | null
  remark?: string | null
  sizes?: Record<string, number> | null
  pay_method?: string | null
  paid_at?: string | null
}

export interface Shipment {
  order_id: number
  carrier: string | null
  tracking_no: string | null
  status: string
  traces: Array<{ time: string; desc: string }> | null
}

export interface OrderAttachment {
  id: number
  order_id: number
  name: string
  url: string
  mime: string | null
  size: number
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
  passwordLogin: (phone: string, password: string) =>
    http.post<unknown, { data: { token: string; user: UserInfo } }>('/api/v1/app/auth/password-login', { phone, password }),
  logout: () => http.post('/api/v1/app/auth/logout'),
  // PC 扫码登录
  qrCreate: () =>
    http.post<unknown, { data: { sceneId: string; qrImage: string } }>('/api/v1/app/qr-login/create'),
  qrPoll: (sceneId: string) =>
    http.get<unknown, { data: { status: 'pending' | 'scanned' | 'confirmed' | 'expired'; token?: string } }>(
      '/api/v1/app/qr-login/poll', { params: { sceneId } },
    ),
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
  /** 设置 / 修改登录密码 */
  setPassword: (newPassword: string, oldPassword?: string) =>
    http.put('/api/v1/app/user/password', { newPassword, oldPassword }),
}

// ── 设计 ──
export const designApi = {
  list: () => http.get<unknown, { data: Design[] }>('/api/v1/app/designs'),
  get: (id: number) => http.get<unknown, { data: Design & { regions: Record<string, unknown> | null; sock_model_id: number | null } }>(`/api/v1/app/designs/${id}`),
  create: (data: { name: string; sockModelId?: number; coverUrl?: string; regions?: Record<string, unknown> }) =>
    http.post<unknown, { data: { id: number } }>('/api/v1/app/designs', data),
  update: (id: number, data: { name: string; sockModelId?: number; coverUrl?: string; regions?: Record<string, unknown> }) =>
    http.put(`/api/v1/app/designs/${id}`, data),
  remove: (id: number) => http.delete(`/api/v1/app/designs/${id}`),
}

// ── 订单 ──
export interface PriceBreakdown {
  material: string
  craft: string
  basePrice: number
  craftFee: number
  unitPrice: number
  quantity: number
  total: number
}
export const orderApi = {
  list: (status?: string) => http.get<unknown, { data: Order[] }>('/api/v1/app/orders', { params: status ? { status } : {} }),
  stats: () => http.get<unknown, { data: Record<string, number> }>('/api/v1/app/orders/stats'),
  get: (id: number) => http.get<unknown, { data: Order }>(`/api/v1/app/orders/${id}`),
  pricing: () => http.get<unknown, { data: { materials: Record<string, number>; crafts: Record<string, number> } }>('/api/v1/app/orders/pricing'),
  quote: (input: { material?: string; craft?: string; quantity: number }) =>
    http.post<unknown, { data: PriceBreakdown }>('/api/v1/app/orders/quote', input),
  create: (data: { designId?: number; designName?: string; sizes?: Record<string, number>; quantity: number; material?: string; craft?: string; address?: string; remark?: string }) =>
    http.post<unknown, { data: { id: number; orderNo: string } }>('/api/v1/app/orders', data),
  /** 编辑订单备注/地址（仅待付款/已付款可改） */
  update: (id: number, patch: { remark?: string; address?: string }) =>
    http.put(`/api/v1/app/orders/${id}`, patch),
  // ── 订单附件 ──
  attachments: (id: number) => http.get<unknown, { data: OrderAttachment[] }>(`/api/v1/app/orders/${id}/attachments`),
  addAttachment: (id: number, file: { name: string; url: string; mime?: string; size?: number }) =>
    http.post<unknown, { data: { id: number } }>(`/api/v1/app/orders/${id}/attachments`, file),
  removeAttachment: (id: number, attId: number) =>
    http.delete(`/api/v1/app/orders/${id}/attachments/${attId}`),
  prepay: (orderId: number) =>
    http.post<unknown, { data: { prepayId: string; outTradeNo: string; real?: boolean; jsApi?: unknown } }>('/api/v1/app/pay/prepay', { orderId }),
  mockPaid: (outTradeNo: string) => http.post('/api/v1/app/pay/mock-paid', { outTradeNo }),
  shipment: (orderId: number) =>
    http.get<unknown, { data: Shipment | null }>(`/api/v1/app/shipment/${orderId}`),
}

// ── 推荐流 ──
export interface Article {
  id: number
  title: string
  tag: string | null
  summary: string | null
  cover_url: string | null
}
export const feedApi = {
  list: () => http.get<unknown, { data: Article[] }>('/api/v1/app/feed'),
  news: () => http.get<unknown, { data: Article[] }>('/api/v1/app/feed/news'),
}

// ── AI ──
export interface AiTaskResult {
  id: number
  result_urls: string[] | null
  status: string
}
export const aiApi = {
  quota: () => http.get<unknown, { data: { limit: number; remaining: number } }>('/api/v1/app/ai/quota'),
  generate: (data: { type?: string; prompt?: string; refImage?: string; platform?: string }) =>
    http.post<unknown, { data: AiTaskResult }>(
      '/api/v1/app/ai/generate',
      { platform: 'web', ...data },
    ),
  /** 意图分析：把模糊指令优化成高质量提示词（失败回退原文） */
  optimizePrompt: (prompt: string) =>
    http.post<unknown, { data: { original: string; optimized: string } }>(
      '/api/v1/app/ai/optimize-prompt',
      { prompt },
    ),
  /** 图生图 / 指令改色：基于参考图 + 指令生成（如改背景、换配色风格） */
  remix: (refImage: string, prompt: string) =>
    http.post<unknown, { data: AiTaskResult }>(
      '/api/v1/app/ai/generate',
      { platform: 'web', type: 'img2img', refImage, prompt },
    ),
  // 注：款式衍生/亲子袜在 web 端走本地引擎 @/engine/styleVariants（含离屏渲染），不调后端
}

// ── 文件上传 ──
export interface UploadResult {
  id: number
  name: string
  url: string
  path: string
  size: number
  mime: string
}
export const uploadApi = {
  /** 上传单个文件（multipart/form-data），返回可访问 URL。
   *  不手动设置 Content-Type，交给浏览器/axios 自动带 boundary。 */
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post<unknown, { data: UploadResult }>('/api/v1/app/upload', form)
  },
}

// ── 站点品牌配置 ──
export interface SiteConfig {
  siteTitle: string
  brandName: string
  brandEn: string
  logoUrl: string
  faviconUrl: string
  loginTitle: string
  loginSubtitle: string
  copyright: string
}
export const siteConfigApi = {
  get: () => http.get<unknown, { data: SiteConfig }>('/api/v1/app/site-config'),
}
