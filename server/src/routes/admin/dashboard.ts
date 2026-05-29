/**
 * Admin 仪表盘：核心指标统计
 */
import { Hono } from 'hono'
import { ok } from '../../utils/response.js'
import { queryOne, query } from '../../db.js'

export const adminDashboardRouter = new Hono()

adminDashboardRouter.get('/overview', async (c) => {
  const [users, orders, designs, aiTasks, revenue] = await Promise.all([
    queryOne<{ n: number }>('SELECT COUNT(*) n FROM `user`'),
    queryOne<{ n: number }>('SELECT COUNT(*) n FROM `order`'),
    queryOne<{ n: number }>('SELECT COUNT(*) n FROM design'),
    queryOne<{ n: number }>('SELECT COUNT(*) n FROM ai_task'),
    queryOne<{ amount: number }>("SELECT COALESCE(SUM(total_amount),0) amount FROM `order` WHERE status != 'cancelled' AND paid_at IS NOT NULL"),
  ])
  return ok(c, {
    userCount: users?.n ?? 0,
    orderCount: orders?.n ?? 0,
    designCount: designs?.n ?? 0,
    aiTaskCount: aiTasks?.n ?? 0,
    revenue: revenue?.amount ?? 0,
  })
})

/** 近 7 日订单趋势 */
adminDashboardRouter.get('/order-trend', async (c) => {
  const rows = await query<{ day: string; n: number }>(
    `SELECT DATE(created_at) day, COUNT(*) n FROM \`order\`
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at) ORDER BY day ASC`,
  )
  return ok(c, rows)
})
