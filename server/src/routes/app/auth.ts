/**
 * App 鉴权路由：短信验证码 / 微信登录 / 注销
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { sendSmsCode, smsLogin, wechatLogin, logout, passwordLogin } from '../../services/auth.service.js'

export const authRouter = new Hono()

/** 发送短信验证码 */
authRouter.post('/sms-send', async (c) => {
  const { phone } = await c.req.json<{ phone?: string }>()
  if (!phone || !/^1\d{10}$/.test(phone)) return fail(c, '手机号格式不正确')
  await sendSmsCode(phone)
  return ok(c, { sent: true })
})

/** 手机号 + 密码登录 */
authRouter.post('/password-login', async (c) => {
  const { phone, password } = await c.req.json<{ phone?: string; password?: string }>()
  if (!phone || !/^1\d{10}$/.test(phone)) return fail(c, '手机号格式不正确')
  if (!password) return fail(c, '密码不能为空')
  const { token, user } = await passwordLogin(phone, password)
  return ok(c, { token, user: toPublicUser(user) })
})

/** 短信验证码登录 */
authRouter.post('/sms-login', async (c) => {
  const { phone, code } = await c.req.json<{ phone?: string; code?: string }>()
  if (!phone || !code) return fail(c, '手机号和验证码不能为空')
  // 携带登录态时传入当前 userId，用于合并「微信 openid 临时账号」到手机号账号
  const currentUserId = getUserId(c) || undefined
  const { token, user } = await smsLogin(phone, code, currentUserId)
  return ok(c, { token, user: toPublicUser(user) })
})

/** 微信登录：前端传 jscode（uni.login 获取）+ 可选 phoneCode（getPhoneNumber 授权）
 *  后端 code2session 拿 openid，并用 phoneCode 换取真实手机号一并绑定 */
authRouter.post('/wechat-login', async (c) => {
  const { code, openid: openidDirect, phoneCode, inviterId } = await c.req.json<{
    code?: string; openid?: string; phoneCode?: string; inviterId?: number
  }>()

  let openid = openidDirect
  let unionid: string | undefined
  // 安全：生产环境禁止直接用 openid 登录（防伪造），必须用 uni.login 的 code 换取
  if (process.env.NODE_ENV === 'production' && openidDirect && !code) {
    return fail(c, '请使用微信授权登录')
  }
  if (!openid && code) {
    const { code2session } = await import('../../services/wechat.service.js')
    const sess = await code2session(code)
    openid = sess.openid
    unionid = sess.unionid
  }
  if (!openid) return fail(c, 'code 或 openid 不能为空')

  // 用手机号授权 code 换取真实手机号（失败不阻断登录，仅记录）
  let phone: string | undefined
  if (phoneCode) {
    try {
      const { getPhoneNumber } = await import('../../services/wechat.service.js')
      const r = await getPhoneNumber(phoneCode)
      phone = r.phone || undefined
    } catch (err) {
      console.error('[wechat-login] 获取手机号失败:', (err as Error).message)
    }
  }

  const { token, user } = await wechatLogin(openid, { phone, unionid })
  // 邀请关系：新用户首次登录时，建立邀请关系并给双方加额度
  if (inviterId && inviterId !== user.id) {
    const { ensureInvitation } = await import('../../services/invitation.service.js')
    await ensureInvitation(inviterId, user.id)
  }
  return ok(c, { token, user: toPublicUser(user) })
})

/** 注销 */
authRouter.post('/logout', async (c) => {
  const auth = c.req.header('Authorization')
  if (auth?.startsWith('Bearer ')) await logout(auth.slice(7))
  return ok(c, { loggedOut: true })
})

function toPublicUser(u: { id: number; phone: string | null; nickname: string | null; avatar: string | null; ai_quota_daily: number }) {
  return {
    id: u.id,
    phone: u.phone,
    nickname: u.nickname,
    avatar: u.avatar,
    aiQuotaDaily: u.ai_quota_daily,
  }
}
