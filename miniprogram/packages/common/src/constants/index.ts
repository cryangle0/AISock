/** API 基础地址（按环境替换） */
export const API_BASE_URL = 'http://127.0.0.1:8199'

/** 本地存储 key */
export const STORAGE_KEYS = {
  TOKEN: 'aisock_token',
  USER_INFO: 'aisock_user',
  LOGIN_RETURN_TO: 'aisock_login_return_to',
} as const

/** 底部 tab key */
export const TAB_KEYS = {
  HOME: 'home',
  FEED: 'feed',
  EDITOR: 'editor',
  CART: 'cart',
  MINE: 'mine',
} as const

/** 订单状态文案 */
export const ORDER_STATUS_TEXT: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  producing: '生产中',
  shipped: '已发货',
  done: '已完成',
  cancelled: '已取消',
}
