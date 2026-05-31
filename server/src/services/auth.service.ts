/**
 * 鉴权领域服务
 * 短信验证码登录 / 微信登录 / token 会话管理
 */
import { queryOne, execute, transaction } from '../db.js'
import { getRedis, CacheKey } from '../redis.js'
import { signToken } from '../utils/jwt.js'
import { sendSms } from './sms.service.js'

const SMS_CODE_TTL = 300 // 验证码 5 分钟
const TOKEN_TTL = 7 * 24 * 3600

export interface UserRow {
  id: number
  phone: string | null
  openid: string | null
  unionid: string | null
  nickname: string | null
  avatar: string | null
  status: number
  ai_quota_daily: number
}

/** 发送短信验证码（开发环境固定 1234） */
export async function sendSmsCode(phone: string): Promise<void> {
  const redis = getRedis()
  const limitKey = CacheKey.SMS_LIMIT + phone
  if (await redis.exists(limitKey)) {
    throw Object.assign(new Error('验证码发送过于频繁，请稍后再试'), { status: 429 })
  }
  const code = process.env.NODE_ENV === 'production' ? genCode() : '1234'
  await redis.set(CacheKey.SMS_CODE + phone, code, 'EX', SMS_CODE_TTL)
  await redis.set(limitKey, '1', 'EX', 60) // 60s 限频
  await sendSms(phone, code)
}

function genCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

/** 短信验证码登录：校验 code → 找/建用户 → 签发 token
 *  @param currentUserId 当前请求已携带的登录态用户（用于把「微信 openid 临时账号」合并进手机号账号）
 */
export async function smsLogin(phone: string, code: string, currentUserId?: number): Promise<{ token: string; user: UserRow }> {
  const redis = getRedis()
  const masterCode = process.env.SMS_MASTER_CODE
  const saved = await redis.get(CacheKey.SMS_CODE + phone)
  const matched = (saved && saved === code) || (masterCode && code === masterCode)
  if (!matched) {
    throw Object.assign(new Error('验证码错误或已过期'), { status: 400 })
  }
  await redis.del(CacheKey.SMS_CODE + phone)

  let user = await queryOne<UserRow>('SELECT * FROM `user` WHERE phone = ?', [phone])
  if (!user) {
    const result = await execute(
      'INSERT INTO `user` (phone, nickname) VALUES (?, ?)',
      [phone, '袜款设计师'],
    )
    user = await queryOne<UserRow>('SELECT * FROM `user` WHERE id = ?', [result.insertId])
  }
  if (!user) throw new Error('用户创建失败')
  if (user.status !== 1) {
    throw Object.assign(new Error('账号已被禁用'), { status: 403 })
  }

  // 账号合并：当前会话是「微信 openid 临时账号（无手机号）」且与手机号账号不是同一人时，
  // 把临时账号的数据迁移到手机号账号，并把 openid 绑定过来，消除「同人两账号」。
  if (currentUserId && currentUserId !== user.id) {
    await maybeMergeOpenidAccount(currentUserId, user.id)
    user = (await queryOne<UserRow>('SELECT * FROM `user` WHERE id = ?', [user.id])) ?? user
  }

  const token = await issueToken(user.id, 'user')
  return { token, user }
}

/**
 * 把「仅 openid、无手机号」的来源账号合并到目标手机号账号：
 * 迁移其设计/订单/花型/AI任务等数据 → 把 openid/unionid 补绑到目标 → 删除来源账号。
 * 仅当来源账号确为「无手机号的 openid 账号」时执行，避免误并正常账号。
 */
async function maybeMergeOpenidAccount(fromUserId: number, toUserId: number): Promise<void> {
  const from = await queryOne<UserRow>('SELECT * FROM `user` WHERE id = ?', [fromUserId])
  if (!from || from.phone || !from.openid) return // 来源不是「无手机号的 openid 账号」→ 不合并

  await transaction(async (conn) => {
    // 迁移业务数据到目标账号
    await conn.query('UPDATE `design` SET user_id = ? WHERE user_id = ?', [toUserId, fromUserId])
    await conn.query('UPDATE `order` SET user_id = ? WHERE user_id = ?', [toUserId, fromUserId])
    await conn.query('UPDATE `ai_task` SET user_id = ? WHERE user_id = ?', [toUserId, fromUserId])
    await conn.query('UPDATE `pattern` SET owner_id = ? WHERE owner_id = ?', [toUserId, fromUserId])
    // 目标账号若还没绑 openid，则把来源的 openid/unionid 补绑过来
    await conn.query(
      'UPDATE `user` SET openid = COALESCE(openid, ?), unionid = COALESCE(unionid, ?) WHERE id = ?',
      [from.openid, from.unionid ?? null, toUserId],
    )
    // 删除来源临时账号
    await conn.query('DELETE FROM `user` WHERE id = ?', [fromUserId])
  })
}

/** 微信登录：用 openid 找/建用户；若同时拿到真实手机号则绑定/合并账号 */
export async function wechatLogin(
  openid: string,
  opts?: { phone?: string; unionid?: string },
): Promise<{ token: string; user: UserRow }> {
  const phone = opts?.phone || null
  const unionid = opts?.unionid || null

  // 1) 先按 openid 查
  let user = await queryOne<UserRow>('SELECT * FROM `user` WHERE openid = ?', [openid])

  // 2) openid 没有，但拿到了手机号：尝试用手机号合并已有账号（短信登录过的用户）
  if (!user && phone) {
    const byPhone = await queryOne<UserRow>('SELECT * FROM `user` WHERE phone = ?', [phone])
    if (byPhone) {
      await execute('UPDATE `user` SET openid = ?, unionid = COALESCE(unionid, ?) WHERE id = ?', [openid, unionid, byPhone.id])
      user = await queryOne<UserRow>('SELECT * FROM `user` WHERE id = ?', [byPhone.id])
    }
  }

  // 3) 仍没有：新建用户（带上手机号/unionid）
  if (!user) {
    const result = await execute(
      'INSERT INTO `user` (openid, unionid, phone, nickname) VALUES (?, ?, ?, ?)',
      [openid, unionid, phone, '微信用户'],
    )
    user = await queryOne<UserRow>('SELECT * FROM `user` WHERE id = ?', [result.insertId])
  } else if (phone && !user.phone) {
    // 4) 已有 openid 用户但还没手机号：补绑真实手机号
    await execute('UPDATE `user` SET phone = ? WHERE id = ?', [phone, user.id])
    user = await queryOne<UserRow>('SELECT * FROM `user` WHERE id = ?', [user.id])
  }

  if (!user) throw new Error('用户创建失败')
  if (user.status !== 1) {
    throw Object.assign(new Error('账号已被禁用'), { status: 403 })
  }
  const token = await issueToken(user.id, 'user')
  return { token, user }
}

/** 签发 token 并写入 Redis 会话 */
export async function issueToken(userId: number, type: 'user' | 'admin'): Promise<string> {
  const token = signToken({ userId, type })
  await getRedis().set(CacheKey.TOKEN + token, String(userId), 'EX', TOKEN_TTL)
  return token
}

/** 注销：删除 Redis 会话 */
export async function logout(token: string): Promise<void> {
  await getRedis().del(CacheKey.TOKEN + token)
}
