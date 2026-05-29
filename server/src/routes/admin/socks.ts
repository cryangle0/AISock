/**
 * Admin 袜型管理（增删改查）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { listSocks, getSock, createSock, updateSock, deleteSock } from '../../services/sock.service.js'

export const adminSocksRouter = new Hono()

adminSocksRouter.get('/', async (c) => {
  return ok(c, await listSocks(false))
})

adminSocksRouter.get('/:id', async (c) => {
  const sock = await getSock(Number(c.req.param('id')))
  if (!sock) return fail(c, '袜型不存在', 404)
  return ok(c, sock)
})

adminSocksRouter.post('/', async (c) => {
  const body = await c.req.json()
  if (!body?.code || !body?.name) return fail(c, '编码和名称不能为空')
  const id = await createSock(body)
  return ok(c, { id })
})

adminSocksRouter.put('/:id', async (c) => {
  const body = await c.req.json()
  await updateSock(Number(c.req.param('id')), body)
  return ok(c, { updated: true })
})

adminSocksRouter.delete('/:id', async (c) => {
  await deleteSock(Number(c.req.param('id')))
  return ok(c, { deleted: true })
})
