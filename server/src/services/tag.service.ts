/**
 * 标签领域服务（礼赠场景 / 风格 等维度）+ 花型打标
 * 花型与标签多对多：tag(kind,code,name...) ── pattern_tag ── pattern
 */
import { query, execute, transaction } from '../db.js'

export interface Tag {
  id: number
  kind: string
  code: string
  name: string
  description: string | null
  icon_url: string | null
  sort: number
  status: number
}

/** 按维度列出启用标签（访客可读）。不传 kind 则返回全部启用标签 */
export async function listTags(kind?: string): Promise<Tag[]> {
  if (kind) {
    return query<Tag>(
      'SELECT * FROM tag WHERE kind = ? AND status = 1 ORDER BY sort ASC, id ASC',
      [kind],
    )
  }
  return query<Tag>('SELECT * FROM tag WHERE status = 1 ORDER BY kind ASC, sort ASC, id ASC')
}

/** 管理端：列出全部标签（含隐藏） */
export async function listAllTags(kind?: string): Promise<Tag[]> {
  if (kind) {
    return query<Tag>('SELECT * FROM tag WHERE kind = ? ORDER BY sort ASC, id ASC', [kind])
  }
  return query<Tag>('SELECT * FROM tag ORDER BY kind ASC, sort ASC, id ASC')
}

export async function createTag(d: {
  kind: string
  code: string
  name: string
  description?: string | null
  iconUrl?: string | null
  sort?: number
  status?: number
}): Promise<number> {
  const r = await execute(
    'INSERT INTO tag (kind, code, name, description, icon_url, sort, status) VALUES (?,?,?,?,?,?,?)',
    [d.kind, d.code, d.name, d.description ?? null, d.iconUrl ?? null, d.sort ?? 0, d.status ?? 1],
  )
  return r.insertId
}

export async function updateTag(
  id: number,
  d: {
    code?: string
    name?: string
    description?: string | null
    iconUrl?: string | null
    sort?: number
    status?: number
  },
): Promise<void> {
  const fields: string[] = []
  const args: any[] = []
  if (d.code !== undefined) { fields.push('code = ?'); args.push(d.code) }
  if (d.name !== undefined) { fields.push('name = ?'); args.push(d.name) }
  if (d.description !== undefined) { fields.push('description = ?'); args.push(d.description) }
  if (d.iconUrl !== undefined) { fields.push('icon_url = ?'); args.push(d.iconUrl) }
  if (d.sort !== undefined) { fields.push('sort = ?'); args.push(d.sort) }
  if (d.status !== undefined) { fields.push('status = ?'); args.push(d.status) }
  if (!fields.length) return
  args.push(id)
  await execute(`UPDATE tag SET ${fields.join(', ')} WHERE id = ?`, args)
}

/** 删除标签：先解除花型关联，再删标签（避免悬挂引用） */
export async function deleteTag(id: number): Promise<void> {
  await execute('DELETE FROM pattern_tag WHERE tag_id = ?', [id])
  await execute('DELETE FROM tag WHERE id = ?', [id])
}

/** 取某花型已绑定的标签 id 列表（编辑表单回显用） */
export async function getPatternTagIds(patternId: number): Promise<number[]> {
  const rows = await query<{ tag_id: number }>(
    'SELECT tag_id FROM pattern_tag WHERE pattern_id = ?',
    [patternId],
  )
  return rows.map((r) => r.tag_id)
}

/** 批量取多个花型的标签（列表展示用），返回 patternId → Tag[] */
export async function getTagsForPatterns(patternIds: number[]): Promise<Map<number, Tag[]>> {
  const map = new Map<number, Tag[]>()
  if (!patternIds.length) return map
  const placeholders = patternIds.map(() => '?').join(',')
  const rows = await query<Tag & { pattern_id: number }>(
    `SELECT pt.pattern_id, t.*
     FROM pattern_tag pt JOIN tag t ON t.id = pt.tag_id
     WHERE pt.pattern_id IN (${placeholders})
     ORDER BY t.kind ASC, t.sort ASC`,
    patternIds,
  )
  for (const row of rows) {
    const { pattern_id, ...tag } = row as Tag & { pattern_id: number }
    if (!map.has(pattern_id)) map.set(pattern_id, [])
    map.get(pattern_id)!.push(tag as Tag)
  }
  return map
}

/** 覆盖式设置某花型的标签（先清后插，事务保证一致） */
export async function setPatternTags(patternId: number, tagIds: number[]): Promise<void> {
  const ids = Array.from(new Set(tagIds.filter((n) => Number.isInteger(n) && n > 0)))
  await transaction(async (conn) => {
    await conn.query('DELETE FROM pattern_tag WHERE pattern_id = ?', [patternId])
    if (ids.length) {
      const values = ids.map(() => '(?, ?)').join(',')
      const args: any[] = []
      for (const t of ids) args.push(patternId, t)
      await conn.query(`INSERT IGNORE INTO pattern_tag (pattern_id, tag_id) VALUES ${values}`, args)
    }
  })
}
