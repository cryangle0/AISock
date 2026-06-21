/**
 * Admin 标签管理（礼赠场景 / 风格 等维度）
 */
import { Hono } from 'hono'
import { ok, fail } from '../../utils/response.js'
import { listAllTags, createTag, updateTag, deleteTag } from '../../services/tag.service.js'

export const adminTagsRouter = new Hono()

/** 标签列表（含隐藏），可按 kind 过滤 */
adminTagsRouter.get('/', async (c) => {
  const kind = c.req.query('kind') || undefined
  return ok(c, await listAllTags(kind))
})

adminTagsRouter.post('/', async (c) => {
  const b = await c.req.json<{
    kind?: string
    code?: string
    name?: string
    description?: string | null
    iconUrl?: string | null
    sort?: number
    status?: number
  }>()
  if (!b.kind || !b.code || !b.name) return fail(c, 'kind / code / name 不能为空')
  try {
    const id = await createTag({
      kind: b.kind,
      code: b.code,
      name: b.name,
      description: b.description ?? null,
      iconUrl: b.iconUrl ?? null,
      sort: b.sort,
      status: b.status,
    })
    return ok(c, { id })
  } catch (e: any) {
    if (e?.code === 'ER_DUP_ENTRY') return fail(c, '该维度下 code 已存在')
    throw e
  }
})

adminTagsRouter.put('/:id', async (c) => {
  const b = await c.req.json<{
    code?: string
    name?: string
    description?: string | null
    iconUrl?: string | null
    sort?: number
    status?: number
  }>()
  await updateTag(Number(c.req.param('id')), b)
  return ok(c, { updated: true })
})

adminTagsRouter.delete('/:id', async (c) => {
  await deleteTag(Number(c.req.param('id')))
  return ok(c, { deleted: true })
})
