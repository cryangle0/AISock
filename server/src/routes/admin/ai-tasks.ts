/**
 * Admin AI 任务监控 + 设计稿管理
 */
import { Hono } from 'hono'
import { ok, paginated } from '../../utils/response.js'
import { getPageQuery } from '../../utils/context.js'
import { query, queryOne } from '../../db.js'

export const adminAiTasksRouter = new Hono()

/** AI 任务分页（监控生成成功率） */
adminAiTasksRouter.get('/', async (c) => {
  const { pageNum, pageSize, offset } = getPageQuery(c, 20)
  const status = c.req.query('status')
  const conds: string[] = ['1=1']
  const args: any[] = []
  if (status) { conds.push('t.status = ?'); args.push(status) }
  const where = `WHERE ${conds.join(' AND ')}`
  const totalRow = await queryOne<{ n: number }>(`SELECT COUNT(*) n FROM ai_task t ${where}`, args)
  const list = await query(
    `SELECT t.*, u.phone AS user_phone FROM ai_task t
     LEFT JOIN \`user\` u ON u.id = t.user_id
     ${where} ORDER BY t.id DESC LIMIT ? OFFSET ?`,
    [...args, pageSize, offset],
  )
  return paginated(c, list, totalRow?.n ?? 0, pageNum, pageSize)
})

/** AI 任务汇总（成功/失败/进行中） */
adminAiTasksRouter.get('/stats', async (c) => {
  const rows = await query<{ status: string; n: number }>(
    'SELECT status, COUNT(*) n FROM ai_task GROUP BY status',
  )
  const stats: Record<string, number> = { total: 0, success: 0, failed: 0, running: 0, pending: 0 }
  for (const r of rows) {
    stats[r.status] = r.n
    stats.total += r.n
  }
  return ok(c, stats)
})

/** 设计稿管理（全量） */
adminAiTasksRouter.get('/designs', async (c) => {
  const { pageNum, pageSize, offset } = getPageQuery(c, 20)
  const totalRow = await queryOne<{ n: number }>('SELECT COUNT(*) n FROM design')
  const list = await query(
    `SELECT d.*, u.phone AS user_phone FROM design d
     LEFT JOIN \`user\` u ON u.id = d.user_id
     ORDER BY d.id DESC LIMIT ? OFFSET ?`,
    [pageSize, offset],
  )
  return paginated(c, list, totalRow?.n ?? 0, pageNum, pageSize)
})
