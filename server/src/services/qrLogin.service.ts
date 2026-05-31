/**
 * PC 扫码登录 —— 小程序码 + 轮询方案。
 *
 * 流程：
 *  1. Web 端创建扫码会话 → 拿到 sceneId + 小程序码图片；展示二维码并轮询状态。
 *  2. 用户用微信扫码 → 打开小程序「确认登录」页（带 scene 参数）。
 *  3. 已登录的小程序调 confirm 接口确认 → 会话标记为 confirmed 并绑定该用户。
 *  4. Web 轮询到 confirmed → 用会话里的 ticket 换取正式 token 完成登录。
 *
 * 状态存于 Redis，5 分钟过期。会话 id 用随机串，避免枚举。
 */
import { randomBytes } from 'node:crypto'
import { getRedis } from '../redis.js'
import { issueToken } from './auth.service.js'
import { queryOne } from '../db.js'

const PREFIX = 'qrlogin:'
const TTL = 300 // 会话有效期 5 分钟
const SCAN_PAGE = 'pages/login/index' // 小程序确认登录页

export type QrStatus = 'pending' | 'scanned' | 'confirmed' | 'expired'

interface QrSession {
  status: QrStatus
  userId?: number
  /** confirmed 后用于换 token 的一次性票据 */
  ticket?: string
}

function key(sceneId: string): string {
  return `${PREFIX}${sceneId}`
}

async function read(sceneId: string): Promise<QrSession | null> {
  const raw = await getRedis().get(key(sceneId))
  return raw ? (JSON.parse(raw) as QrSession) : null
}

async function write(sceneId: string, session: QrSession): Promise<void> {
  await getRedis().set(key(sceneId), JSON.stringify(session), 'EX', TTL)
}

/** 创建扫码会话，返回 sceneId 与小程序确认页路径 */
export async function createSession(): Promise<{ sceneId: string; page: string }> {
  const sceneId = randomBytes(12).toString('hex')
  await write(sceneId, { status: 'pending' })
  return { sceneId, page: SCAN_PAGE }
}

/** Web 轮询会话状态；confirmed 时返回 token 并使会话失效（一次性） */
export async function pollSession(sceneId: string): Promise<{ status: QrStatus; token?: string }> {
  const session = await read(sceneId)
  if (!session) return { status: 'expired' }
  if (session.status === 'confirmed' && session.userId) {
    // 一次性换 token 后立即失效，避免重放
    await getRedis().del(key(sceneId))
    const token = await issueToken(session.userId, 'user')
    return { status: 'confirmed', token }
  }
  return { status: session.status }
}

/** 小程序：扫码打开时标记 scanned（可选，用于 Web 展示「已扫码，请在手机确认」） */
export async function markScanned(sceneId: string): Promise<boolean> {
  const session = await read(sceneId)
  if (!session || session.status === 'confirmed') return false
  if (session.status === 'pending') {
    await write(sceneId, { ...session, status: 'scanned' })
  }
  return true
}

/** 小程序：已登录用户确认登录，绑定其 userId */
export async function confirmSession(sceneId: string, userId: number): Promise<boolean> {
  const session = await read(sceneId)
  if (!session) return false
  if (session.status === 'confirmed') return false
  // 校验用户有效
  const user = await queryOne<{ id: number; status: number }>('SELECT id, status FROM `user` WHERE id = ?', [userId])
  if (!user || user.status !== 1) return false
  await write(sceneId, { status: 'confirmed', userId })
  return true
}
