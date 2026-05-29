/**
 * Admin Banner 管理
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { query, execute } from '../../db.js'

export const adminBannersRouter = new Hono()

adminBannersRouter.get('/', async (c) => {
  return ok(c, await query('SELECT * FROM banner ORDER BY sort ASC, id DESC'))
})

adminBannersRouter.post('/', async (c) => {
  const b = await c.req.json()
  if (!b?.title) return fail(c, '标题不能为空')
  const r = await execute(
    'INSERT INTO banner (title, subtitle, image_url, link, sort, status) VALUES (?,?,?,?,?,?)',
    [b.title, b.subtitle ?? null, b.imageUrl ?? null, b.link ?? null, b.sort ?? 0, b.status ?? 1],
  )
  return ok(c, { id: r.insertId })
})

adminBannersRouter.put('/:id', async (c) => {
  const b = await c.req.json()
  await execute(
    'UPDATE banner SET title = ?, subtitle = ?, image_url = ?, link = ?, sort = ?, status = ? WHERE id = ?',
    [b.title, b.subtitle ?? null, b.imageUrl ?? null, b.link ?? null, b.sort ?? 0, b.status ?? 1, Number(c.req.param('id'))],
  )
  return ok(c, { updated: true })
})

adminBannersRouter.delete('/:id', async (c) => {
  await execute('DELETE FROM banner WHERE id = ?', [Number(c.req.param('id'))])
  return ok(c, { deleted: true })
})
