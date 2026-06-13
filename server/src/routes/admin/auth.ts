/**
 * Admin 鉴权路由：账号密码登录 / 注销 / 当前账号
 */
import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { ok, fail } from '../../utils/response.js'
import { getUserId } from '../../utils/context.js'
import { assertRateLimit } from '../../utils/rate-limit.js'
import { queryOne, execute } from '../../db.js'
import { issueToken, logout } from '../../services/auth.service.js'

export const adminAuthRouter = new Hono()

interface AdminRow {
  id: number
  username: string
  password: string
  nickname: string | null
  role: string
  status: number
}

adminAuthRouter.post('/login', async (c) => {
  const { username, password } = await c.req.json<{ username?: string; password?: string }>()
  if (!username || !password) return fail(c, '用户名和密码不能为空')

  // 防暴力破解：登录接口公网可达且无验证码，按 IP+用户名 限频（10 次 / 10 分钟）
  const ip = c.req.header('x-real-ip') || c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  await assertRateLimit('admin-login', `${ip}:${username}`, 10, 600, '尝试次数过多，请 10 分钟后再试')

  const admin = await queryOne<AdminRow>('SELECT * FROM admin_account WHERE username = ?', [username])
  if (!admin) return fail(c, '用户名或密码错误', 401)
  if (admin.status !== 1) return fail(c, '账号已被禁用', 403)

  const matched = await bcrypt.compare(password, admin.password)
  if (!matched) return fail(c, '用户名或密码错误', 401)

  await execute('UPDATE admin_account SET last_login_at = NOW() WHERE id = ?', [admin.id])
  const token = await issueToken(admin.id, 'admin')
  return ok(c, {
    token,
    account: { id: admin.id, username: admin.username, nickname: admin.nickname, role: admin.role },
  })
})

adminAuthRouter.get('/me', async (c) => {
  const admin = await queryOne<AdminRow>(
    'SELECT id, username, nickname, role FROM admin_account WHERE id = ?',
    [getUserId(c)],
  )
  if (!admin) return fail(c, '账号不存在', 404)
  return ok(c, admin)
})

adminAuthRouter.post('/logout', async (c) => {
  const auth = c.req.header('Authorization')
  if (auth?.startsWith('Bearer ')) await logout(auth.slice(7))
  return ok(c, { loggedOut: true })
})
