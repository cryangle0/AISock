/**
 * 鉴权中间件
 * - 白名单路径放行（可选附带 userId）
 * - 其余路径要求 Bearer token，校验 JWT + Redis 会话存在
 * - admin 区域要求 token.type === 'admin'
 * - token 校验加进程内 30s 缓存，降低 Redis QPS
 */
import type { Context, Next } from 'hono'
import { getRedis, CacheKey } from '../redis.js'
import { parseToken } from '../utils/jwt.js'
import { queryOne } from '../db.js'
import { fail } from '../utils/response.js'

const TOKEN_RENEW_SECONDS = 7 * 24 * 3600

const TOKEN_CACHE_TTL_MS = 30 * 1000
const TOKEN_CACHE_MAX = 5000
const tokenCache = new Map<string, number>()

function cacheGet(token: string): boolean {
  const exp = tokenCache.get(token)
  if (exp == null) return false
  if (exp < Date.now()) {
    tokenCache.delete(token)
    return false
  }
  return true
}

function cacheSet(token: string): void {
  if (tokenCache.size >= TOKEN_CACHE_MAX) {
    const first = tokenCache.keys().next().value
    if (first) tokenCache.delete(first)
  }
  tokenCache.set(token, Date.now() + TOKEN_CACHE_TTL_MS)
}

export function invalidateTokenCache(token: string): void {
  tokenCache.delete(token)
}

/**
 * 角色分权中间件：要求当前后台账号具备指定角色之一，否则 403。
 * 用于敏感操作（如用户管理）。需在 requireAuth 之后使用（依赖 c.get('userId')）。
 */
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const adminId = (c.get('userId') as number | undefined) ?? 0
    const row = await queryOne<{ role: string }>('SELECT role FROM admin_account WHERE id = ?', [adminId])
    if (!row || !roles.includes(row.role)) {
      return fail(c, '权限不足：该操作需要管理员角色', 403)
    }
    return next()
  }
}

/** 校验账号是否被禁用（status!=1）。仅在 cache-miss 时调用，性能开销可忽略。
 *  被禁用则删除其会话并清缓存，旧 token 立即失效（user 与 admin 均生效）。 */
async function ensureUserActive(token: string, userId: number, type: string): Promise<boolean> {
  const table = type === 'admin' ? 'admin_account' : 'user'
  const u = await queryOne<{ status: number }>(`SELECT status FROM \`${table}\` WHERE id = ?`, [userId])
  if (!u || u.status !== 1) {
    await getRedis().del(CacheKey.TOKEN + token)
    invalidateTokenCache(token)
    return false
  }
  return true
}

/** 公开端点：未登录也可访问（须与前端 http 层白名单保持一致） */
const AUTH_WHITELIST = new Set<string>([
  '/api/v1/app/auth/wechat-login',
  '/api/v1/app/auth/sms-login',
  '/api/v1/app/auth/sms-send',
  '/api/v1/app/auth/password-login',
  '/api/v1/app/auth/refresh',
  '/api/v1/app/home',
  '/api/v1/app/socks', // 袜型列表（访客可浏览）
  '/api/v1/app/patterns', // 花型列表
  '/api/v1/app/patterns/categories',
  '/api/v1/app/feed',
  '/api/v1/app/feed/news',
  '/api/v1/app/feed/faq',
  '/api/v1/app/config/home', // 小程序首页运营配置（访客可读）
  '/api/v1/app/site-config', // 站点品牌配置（访客可读）
  '/api/v1/app/orders/pricing', // 价目表（访客可看价）
  '/api/v1/app/orders/quote', // 价格试算（纯计算无副作用，访客可看价）
  '/api/v1/app/qr-login/create', // PC 扫码登录：创建会话（公开）
  '/api/v1/app/qr-login/poll', // PC 扫码登录：轮询（公开）
  '/api/v1/app/pay/notify', // 微信支付回调（验签替代鉴权）
  '/api/v1/admin/auth/login',
])

const AUTH_WHITELIST_PREFIX = ['/api/v1/app/socks/', '/api/v1/app/patterns/', '/api/v1/app/feed/', '/api/v1/app/config/']

function isWhitelisted(c: Context, path: string): boolean {
  if (AUTH_WHITELIST.has(path)) return true
  // 前缀白名单仅对只读 GET 放行；写操作（POST/PUT/DELETE）一律要求登录，
  // 避免 /patterns/mine、/config/* 等写接口被未登录访问（getUserId=0 越权落库/删除）
  if (c.req.method === 'GET') {
    return AUTH_WHITELIST_PREFIX.some((p) => path.startsWith(p))
  }
  return false
}

async function attachUserIfPresent(c: Context): Promise<void> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return
  const token = authHeader.slice(7)
  try {
    const { userId } = parseToken(token)
    if (cacheGet(token)) {
      c.set('userId', userId)
      return
    }
    const redis = getRedis()
    const key = CacheKey.TOKEN + token
    if (!(await redis.exists(key))) return
    await redis.expire(key, TOKEN_RENEW_SECONDS)
    cacheSet(token)
    c.set('userId', userId)
  } catch {
    /* optional auth: 忽略无效 token */
  }
}

export async function requireAuth(c: Context, next: Next) {
  const path = new URL(c.req.url).pathname

  if (isWhitelisted(c, path)) {
    await attachUserIfPresent(c)
    return next()
  }
  if (c.req.method === 'OPTIONS') return next()

  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return fail(c, '未提供有效的认证令牌', 401)
  }
  const token = authHeader.slice(7)

  let userId: number
  let tokenType: string
  try {
    const parsed = parseToken(token)
    userId = parsed.userId
    tokenType = parsed.type
  } catch {
    return fail(c, '令牌无效或已过期', 401)
  }

  const isAdminArea = path.startsWith('/api/v1/admin/')
  if (isAdminArea && tokenType !== 'admin') {
    return fail(c, '无权访问管理后台', 403)
  }
  // 反向隔离：admin token 不能冒用 app 区接口（adminId 与 user.id 是两个独立 id 空间，
  // 否则 admin id=N 会被当成 user id=N 操作其设计/订单）
  if (!isAdminArea && path.startsWith('/api/v1/app/') && tokenType !== 'user') {
    return fail(c, '请使用用户账号访问', 403)
  }

  if (cacheGet(token)) {
    c.set('userId', userId)
    return next()
  }

  const redis = getRedis()
  const key = CacheKey.TOKEN + token
  if (!(await redis.exists(key))) {
    invalidateTokenCache(token)
    return fail(c, '登录已过期，请重新登录', 401)
  }
  // cache-miss 路径校验账号是否被禁用（被禁用立即踢下线）
  if (!(await ensureUserActive(token, userId, tokenType))) {
    return fail(c, '账号已被禁用', 403)
  }
  await redis.expire(key, TOKEN_RENEW_SECONDS)
  cacheSet(token)
  c.set('userId', userId)
  return next()
}
