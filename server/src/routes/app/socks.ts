/**
 * App 袜型路由（访客可浏览）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { listSocks, getSock } from '../../services/sock.service.js'

export const socksRouter = new Hono()

socksRouter.get('/', async (c) => {
  return ok(c, await listSocks())
})

socksRouter.get('/:id', async (c) => {
  const sock = await getSock(Number(c.req.param('id')))
  if (!sock) return fail(c, '袜型不存在', 404)
  return ok(c, sock)
})
