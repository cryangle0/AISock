/**
 * 鉴权领域服务
 * 短信验证码登录 / 微信登录 / token 会话管理
 */
import { queryOne, execute, transaction } from '../db.js'
import { getRedis, CacheKey } from '../redis.js'
import { signToken } from '../utils/jwt.js'
import { sendSms } from './sms.service.js'
import bcrypt from 'bcryptjs'

const SMS_CODE_TTL = 300 // 验证码 5 分钟
const TOKEN_TTL = 7 * 24 * 3600
const PASSWORD_SALT_ROUNDS = 10

export interface UserRow {
  id: number
  phone: string | null
  openid: string | null
  unionid: string | null
  password: string | null
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

/**
 * 指定手机号的「固定登录验证码」（演示 / 审核 / 收不到短信的账号用）。
 * 配置：SMS_FIXED_CODES="手机号:验证码,手机号:验证码"，例如 "15158119427:888888"。
 * 仅命中配置里的手机号生效，其它号码完全不受影响（仍走真实短信）。
 */
function fixedCodeFor(phone: string): string | null {
  const raw = process.env.SMS_FIXED_CODES
  if (!raw) return null
  for (const pair of raw.split(',')) {
    const idx = pair.indexOf(':')
    if (idx < 0) continue
    const p = pair.slice(0, idx).trim()
    const c = pair.slice(idx + 1).trim()
    if (p === phone && c) return c
  }
  return null
}

/** 短信验证码登录：校验 code → 找/建用户 → 签发 token
 *  @param currentUserId 当前请求已携带的登录态用户（用于把「微信 openid 临时账号」合并进手机号账号）
 */
export async function smsLogin(phone: string, code: string, currentUserId?: number): Promise<{ token: string; user: UserRow }> {
  const redis = getRedis()
  const masterCode = process.env.SMS_MASTER_CODE
  const fixedCode = fixedCodeFor(phone)
  const saved = await redis.get(CacheKey.SMS_CODE + phone)
  const matched =
    (saved && saved === code) ||
    (fixedCode && code === fixedCode) ||
    (masterCode && code === masterCode)
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
    await conn.query('UPDATE `upload` SET user_id = ? WHERE user_id = ?', [toUserId, fromUserId])
    // 邀请关系：邀请人侧直接迁移；被邀请人侧受 uk_invitee 唯一约束，仅在目标无记录时迁移，否则删除来源
    await conn.query('UPDATE `invitation` SET inviter_id = ? WHERE inviter_id = ?', [toUserId, fromUserId])
    const [toInvitee] = (await conn.query('SELECT id FROM `invitation` WHERE invitee_id = ? LIMIT 1', [toUserId])) as any[]
    if (Array.isArray(toInvitee) && toInvitee.length > 0) {
      await conn.query('DELETE FROM `invitation` WHERE invitee_id = ?', [fromUserId])
    } else {
      await conn.query('UPDATE `invitation` SET invitee_id = ? WHERE invitee_id = ?', [toUserId, fromUserId])
    }
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

/**
 * 把微信 openid 绑定到当前登录账号（手机号/密码登录用户支付前补授权用）。
 * openid 已属于「无手机号的临时账号」时自动合并其数据进当前账号；属于正常账号时拒绝。
 */
export async function bindWechat(userId: number, openid: string, unionid?: string): Promise<void> {
  const me = await queryOne<UserRow>('SELECT * FROM `user` WHERE id = ?', [userId])
  if (!me) throw Object.assign(new Error('用户不存在'), { status: 404 })
  if (me.openid) {
    if (me.openid === openid) return
    throw Object.assign(new Error('当前账号已绑定其他微信'), { status: 400 })
  }
  const owner = await queryOne<UserRow>('SELECT * FROM `user` WHERE openid = ?', [openid])
  if (owner && owner.id !== userId) {
    if (owner.phone) throw Object.assign(new Error('该微信已绑定其他账号'), { status: 400 })
    await maybeMergeOpenidAccount(owner.id, userId)
    return
  }
  await execute(
    'UPDATE `user` SET openid = ?, unionid = COALESCE(unionid, ?) WHERE id = ?',
    [openid, unionid ?? null, userId],
  )
}

/** 密码强度校验：6-32 位，至少含字母和数字 */
function assertPasswordStrength(pwd: string): void {
  if (!pwd || pwd.length < 6 || pwd.length > 32) {
    throw Object.assign(new Error('密码需为 6-32 位'), { status: 400 })
  }
  if (!/[a-zA-Z]/.test(pwd) || !/\d/.test(pwd)) {
    throw Object.assign(new Error('密码需同时包含字母和数字'), { status: 400 })
  }
}

/**
 * 设置 / 修改登录密码。
 * - 已设过密码：必须校验 oldPassword（防越权改密）。
 * - 首次设置：oldPassword 可省略。
 * 仅限已绑定手机号的账号设置密码（密码登录以手机号为账号名）。
 */
export async function setPassword(userId: number, newPassword: string, oldPassword?: string): Promise<void> {
  assertPasswordStrength(newPassword)
  const user = await queryOne<UserRow>('SELECT * FROM `user` WHERE id = ?', [userId])
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 })
  if (!user.phone) throw Object.assign(new Error('请先绑定手机号再设置密码'), { status: 400 })
  if (user.password) {
    if (!oldPassword) throw Object.assign(new Error('请输入原密码'), { status: 400 })
    const matched = await bcrypt.compare(oldPassword, user.password)
    if (!matched) throw Object.assign(new Error('原密码不正确'), { status: 400 })
  }
  const hash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS)
  await execute('UPDATE `user` SET password = ? WHERE id = ?', [hash, userId])
}

/** 当前用户是否已设置密码（前端「我的」页展示「设置/修改密码」用） */
export async function hasPassword(userId: number): Promise<boolean> {
  const user = await queryOne<{ password: string | null }>('SELECT password FROM `user` WHERE id = ?', [userId])
  return !!user?.password
}

/** 手机号 + 密码登录 */
export async function passwordLogin(phone: string, password: string): Promise<{ token: string; user: UserRow }> {
  const user = await queryOne<UserRow>('SELECT * FROM `user` WHERE phone = ?', [phone])
  // 统一错误信息，避免暴露「手机号是否注册」
  if (!user || !user.password) {
    throw Object.assign(new Error('手机号或密码错误'), { status: 401 })
  }
  if (user.status !== 1) {
    throw Object.assign(new Error('账号已被禁用'), { status: 403 })
  }
  const matched = await bcrypt.compare(password, user.password)
  if (!matched) {
    throw Object.assign(new Error('手机号或密码错误'), { status: 401 })
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
