/** API 基础地址：生产指向线上后端；本地联调可临时改回 http://127.0.0.1:8199 */
export const API_BASE_URL = 'https://onnsa.cn/aisock-api'

/** 分享 H5 页基址（与线上域名一致，避免写死无关域名） */
export const SHARE_BASE_URL = 'https://onnsa.cn/aisock'

/** 客服联系方式（占位，可按实际替换） */
export const SUPPORT_PHONE = '400-000-0000'

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
