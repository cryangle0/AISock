/**
 * 爱花型 · AI 袜版设计系统 —— 后端入口
 * Hono + MySQL + Redis
 */
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requireAuth } from './middleware/auth.js'
import { errorHandler } from './middleware/error-handler.js'
import { getPool, closePool } from './db.js'
import { getRedis, closeRedis } from './redis.js'

// App 路由
import { authRouter } from './routes/app/auth.js'
import { userRouter } from './routes/app/user.js'
import { homeRouter } from './routes/app/home.js'
import { socksRouter } from './routes/app/socks.js'
import { patternsRouter } from './routes/app/patterns.js'
import { designsRouter } from './routes/app/designs.js'
import { ordersRouter } from './routes/app/orders.js'
import { aiRouter } from './routes/app/ai.js'
import { uploadRouter } from './routes/app/upload.js'
import { payRouter } from './routes/app/pay.js'
import { feedRouter } from './routes/app/feed.js'
import { shipmentRouter } from './routes/app/shipment.js'
import { appConfigRouter } from './routes/app/config.js'
import { siteConfigRouter } from './routes/app/site-config.js'
import { qrLoginRouter } from './routes/app/qr-login.js'

// Admin 路由
import { adminAuthRouter } from './routes/admin/auth.js'
import { adminSocksRouter } from './routes/admin/socks.js'
import { adminPatternsRouter } from './routes/admin/patterns.js'
import { adminOrdersRouter } from './routes/admin/orders.js'
import { adminUsersRouter } from './routes/admin/users.js'
import { adminBannersRouter } from './routes/admin/banners.js'
import { adminDashboardRouter } from './routes/admin/dashboard.js'
import { adminArticlesRouter } from './routes/admin/articles.js'
import { adminShipmentsRouter } from './routes/admin/shipments.js'
import { adminAiTasksRouter } from './routes/admin/ai-tasks.js'
import { adminConfigRouter } from './routes/admin/config.js'
import { adminAiConfigRouter } from './routes/admin/ai-config.js'
import { adminSiteConfigRouter } from './routes/admin/site-config.js'

const app = new Hono()

app.use('*', logger())

const corsOrigins = (
  process.env.CORS_ORIGINS ??
  'http://localhost:5178,http://localhost:5199,http://127.0.0.1:5178,http://127.0.0.1:5199'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  '*',
  cors({
    origin: corsOrigins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.onError(errorHandler)

// 上传文件静态服务（鉴权之前，公开可访问）
app.use('/uploads/*', serveStatic({ root: process.env.UPLOAD_DIR ? './' : './uploads', rewriteRequestPath: (p) => p.replace(/^\/uploads/, '') }))

app.use('/api/v1/*', requireAuth)

// === App 路由 ===
app.route('/api/v1/app/auth', authRouter)
app.route('/api/v1/app/user', userRouter)
app.route('/api/v1/app/home', homeRouter)
app.route('/api/v1/app/socks', socksRouter)
app.route('/api/v1/app/patterns', patternsRouter)
app.route('/api/v1/app/designs', designsRouter)
app.route('/api/v1/app/orders', ordersRouter)
app.route('/api/v1/app/ai', aiRouter)
app.route('/api/v1/app/upload', uploadRouter)
app.route('/api/v1/app/pay', payRouter)
app.route('/api/v1/app/feed', feedRouter)
app.route('/api/v1/app/config', appConfigRouter)
app.route('/api/v1/app/site-config', siteConfigRouter)
app.route('/api/v1/app/qr-login', qrLoginRouter)
app.route('/api/v1/app/shipment', shipmentRouter)

// === Admin 路由 ===
app.route('/api/v1/admin/auth', adminAuthRouter)
app.route('/api/v1/admin/socks', adminSocksRouter)
app.route('/api/v1/admin/patterns', adminPatternsRouter)
app.route('/api/v1/admin/orders', adminOrdersRouter)
app.route('/api/v1/admin/users', adminUsersRouter)
app.route('/api/v1/admin/banners', adminBannersRouter)
app.route('/api/v1/admin/dashboard', adminDashboardRouter)
app.route('/api/v1/admin/articles', adminArticlesRouter)
app.route('/api/v1/admin/shipments', adminShipmentsRouter)
app.route('/api/v1/admin/ai-tasks', adminAiTasksRouter)
app.route('/api/v1/admin/ai-config', adminAiConfigRouter)
app.route('/api/v1/admin/site-config', adminSiteConfigRouter)
app.route('/api/v1/admin/config', adminConfigRouter)

// 健康检查
app.get('/api/health', async (c) => {
  try {
    const conn = await getPool().getConnection()
    conn.release()
    return c.json({ status: 'ok' })
  } catch {
    return c.json({ status: 'error', message: 'DB connection failed' }, 503)
  }
})

const port = Number(process.env.PORT) || 8199

async function start() {
  try {
    await getRedis().ping()
    console.log('[aisock-server] Redis connected')
  } catch {
    console.warn('[aisock-server] Redis 不可用，鉴权功能将失败')
  }
  try {
    const conn = await getPool().getConnection()
    conn.release()
    console.log('[aisock-server] MySQL connected')
  } catch (err: any) {
    console.warn(`[aisock-server] MySQL 不可用: ${err.message}`)
  }

  serve({ fetch: app.fetch, port }, () => {
    console.log(`[aisock-server] Running on http://localhost:${port}`)
  })
}

process.on('SIGINT', async () => {
  console.log('\n[aisock-server] Shutting down...')
  await closePool()
  await closeRedis()
  process.exit(0)
})

start().catch((err) => {
  console.error('[aisock-server] Failed to start:', err)
  process.exit(1)
})
