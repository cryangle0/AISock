/**
 * App 鉴权路由：短信验证码 / 微信登录 / 注销
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { sendSmsCode, smsLogin, wechatLogin, logout } from '../../services/auth.service.js'

export const authRouter = new Hono()

/** 发送短信验证码 */
authRouter.post('/sms-send', async (c) => {
  const { phone } = await c.req.json<{ phone?: string }>()
  if (!phone || !/^1\d{10}$/.test(phone)) return fail(c, '手机号格式不正确')
  await sendSmsCode(phone)
  return ok(c, { sent: true })
})

/** 短信验证码登录 */
authRouter.post('/sms-login', async (c) => {
  const { phone, code } = await c.req.json<{ phone?: string; code?: string }>()
  if (!phone || !code) return fail(c, '手机号和验证码不能为空')
  const { token, user } = await smsLogin(phone, code)
  return ok(c, { token, user: toPublicUser(user) })
})

/** 微信登录：前端传 jscode（uni.login 获取），后端 code2session 拿 openid */
authRouter.post('/wechat-login', async (c) => {
  const { code, openid: openidDirect, inviterId } = await c.req.json<{ code?: string; openid?: string; inviterId?: number }>()
  let openid = openidDirect
  if (!openid && code) {
    const { code2session } = await import('../../services/wechat.service.js')
    openid = (await code2session(code)).openid
  }
  if (!openid) return fail(c, 'code 或 openid 不能为空')
  const { token, user } = await wechatLogin(openid)
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
