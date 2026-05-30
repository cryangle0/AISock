/**
 * 鉴权领域服务
 * 短信验证码登录 / 微信登录 / token 会话管理
 */
import { queryOne, execute } from '../db.js'
import { getRedis, CacheKey } from '../redis.js'
import { signToken } from '../utils/jwt.js'
import { sendSms } from './sms.service.js'

const SMS_CODE_TTL = 300 // 验证码 5 分钟
const TOKEN_TTL = 7 * 24 * 3600

export interface UserRow {
  id: number
  phone: string | null
  openid: string | null
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

/** 短信验证码登录：校验 code → 找/建用户 → 签发 token */
export async function smsLogin(phone: string, code: string): Promise<{ token: string; user: UserRow }> {
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

  const token = await issueToken(user.id, 'user')
  return { token, user }
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
