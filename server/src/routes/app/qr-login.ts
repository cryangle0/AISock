/**
 * PC 扫码登录路由。
 * - POST /create  创建会话 + 返回小程序码（data URL）  —— 公开
 * - GET  /poll    轮询会话状态（confirmed 时返回 token）—— 公开
 * - POST /scanned 小程序扫码打开时标记已扫        —— 需登录
 * - POST /confirm 小程序确认登录                  —— 需登录
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { createSession, pollSession, markScanned, confirmSession } from '../../services/qrLogin.service.js'
import { getUnlimitedQRCode } from '../../services/wechat.service.js'

export const qrLoginRouter = new Hono()

/** 创建扫码会话 + 生成小程序码 */
qrLoginRouter.post('/create', async (c) => {
  const { sceneId, page } = await createSession()
  let qrImage = ''
  try {
    const buf = await getUnlimitedQRCode(sceneId, page)
    qrImage = `data:image/png;base64,${buf.toString('base64')}`
  } catch (err) {
    // 小程序未发布 / 密钥未配 时拿不到码：返回空图，前端提示「请用手机号登录或稍后再试」
    console.warn('[qr-login] 生成小程序码失败:', (err as Error).message)
  }
  return ok(c, { sceneId, qrImage })
})

/** Web 轮询会话状态 */
qrLoginRouter.get('/poll', async (c) => {
  const sceneId = c.req.query('sceneId')
  if (!sceneId) return fail(c, '缺少 sceneId')
  const res = await pollSession(sceneId)
  return ok(c, res)
})

/** 小程序：标记已扫码 */
qrLoginRouter.post('/scanned', async (c) => {
  const { sceneId } = await c.req.json<{ sceneId?: string }>()
  if (!sceneId) return fail(c, '缺少 sceneId')
  const okFlag = await markScanned(sceneId)
  return ok(c, { ok: okFlag })
})

/** 小程序：确认登录 */
qrLoginRouter.post('/confirm', async (c) => {
  const { sceneId } = await c.req.json<{ sceneId?: string }>()
  if (!sceneId) return fail(c, '缺少 sceneId')
  const userId = getUserId(c)
  if (!userId) return fail(c, '请先登录小程序', 401)
  const okFlag = await confirmSession(sceneId, userId)
  if (!okFlag) return fail(c, '二维码已失效，请在电脑端刷新')
  return ok(c, { confirmed: true })
})
