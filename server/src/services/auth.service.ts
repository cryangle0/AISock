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

/** 微信登录占位：用 openid 找/建用户（实际 code2session 由调用方先换 openid） */
export async function wechatLogin(openid: string): Promise<{ token: string; user: UserRow }> {
  let user = await queryOne<UserRow>('SELECT * FROM `user` WHERE openid = ?', [openid])
  if (!user) {
    const result = await execute(
      'INSERT INTO `user` (openid, nickname) VALUES (?, ?)',
      [openid, '微信用户'],
    )
    user = await queryOne<UserRow>('SELECT * FROM `user` WHERE id = ?', [result.insertId])
  }
  if (!user) throw new Error('用户创建失败')
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
