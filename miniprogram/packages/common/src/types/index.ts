/** 统一响应 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
  pages: number
}

export interface UserInfo {
  id: number
  phone: string | null
  nickname: string | null
  avatar: string | null
  aiQuotaDaily: number
  /** 是否已设置登录密码（profile 接口返回，登录响应可能无此字段） */
  hasPassword?: boolean
}

export interface SockModel {
  id: number
  code: string
  name: string
  svg_url: string | null
  craft: string | null
  min_order: number
  unit_price: number
}

export interface Pattern {
  id: number
  name: string
  image_url: string
  thumb_url: string | null
  category_id: number | null
}

export interface PatternCategory {
  id: number
  name: string
  description?: string | null
}

export interface Design {
  id: number
  name: string
  regions: Record<string, unknown> | null
  cover_url: string | null
  sock_model_id: number | null
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
  /** 关联设计封面（服务端 LEFT JOIN design 带回） */
  cover_url?: string | null
}

export interface AiTask {
  id: number
  type: string
  prompt: string | null
  result_urls: string[] | null
  status: string
  /** status === 'failed' 时的失败原因（服务端落库，HTTP 仍为 200） */
  error?: string | null
  created_at: string
}
