/**
 * 花型领域服务（公共库 + 个人库）
 */
import { query, queryOne, execute } from '../db.js'

export interface Pattern {
  id: number
  category_id: number | null
  owner_id: number | null
  name: string
  image_url: string
  thumb_url: string | null
  tileable: number
  source: string
  status: number
}

export interface PatternCategory {
  id: number
  name: string
  description: string | null
  sort: number
}

export async function listCategories(): Promise<PatternCategory[]> {
  return query<PatternCategory>('SELECT * FROM pattern_category ORDER BY sort ASC, id ASC')
}

/** 单个公共花型详情（仅上线状态，访客可读） */
export async function getPublicPatternById(id: number): Promise<Pattern | null> {
  return queryOne<Pattern>(
    'SELECT * FROM pattern WHERE id = ? AND status = 1 AND owner_id IS NULL',
    [id],
  )
}

/** 更新分类（名称/描述/排序） */
export async function updateCategory(id: number, data: { name?: string; description?: string | null; sort?: number }): Promise<void> {
  const fields: string[] = []
  const args: any[] = []
  if (data.name !== undefined) { fields.push('name = ?'); args.push(data.name) }
  if (data.description !== undefined) { fields.push('description = ?'); args.push(data.description) }
  if (data.sort !== undefined) { fields.push('sort = ?'); args.push(data.sort) }
  if (!fields.length) return
  args.push(id)
  await execute(`UPDATE pattern_category SET ${fields.join(', ')} WHERE id = ?`, args)
}

/** 删除分类：先把该分类下花型的 category_id 置空（避免悬挂引用），再删分类 */
export async function deleteCategory(id: number): Promise<void> {
  await execute('UPDATE pattern SET category_id = NULL WHERE category_id = ?', [id])
  await execute('DELETE FROM pattern_category WHERE id = ?', [id])
}

export interface ListPatternParams {
  categoryId?: number
  keyword?: string
  ownerId?: number // 传入 = 查个人库；不传 = 公共库
  offset: number
  pageSize: number
}

export async function listPatterns(p: ListPatternParams): Promise<{ list: Pattern[]; total: number }> {
  const conds: string[] = ['status = 1']
  const args: any[] = []
  if (p.ownerId != null) {
    conds.push('owner_id = ?')
    args.push(p.ownerId)
  } else {
    conds.push('owner_id IS NULL')
  }
  if (p.categoryId) {
    conds.push('category_id = ?')
    args.push(p.categoryId)
  }
  if (p.keyword) {
    conds.push('name LIKE ?')
    args.push(`%${p.keyword}%`)
  }
  const where = `WHERE ${conds.join(' AND ')}`
  const totalRow = await queryOne<{ n: number }>(`SELECT COUNT(*) n FROM pattern ${where}`, args)
  const list = await query<Pattern>(
    `SELECT * FROM pattern ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...args, p.pageSize, p.offset],
  )
  return { list, total: totalRow?.n ?? 0 }
}

export async function createPattern(data: Partial<Pattern>): Promise<number> {
  const r = await execute(
    `INSERT INTO pattern (category_id, owner_id, name, image_url, thumb_url, tileable, source, status)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      data.category_id ?? null, data.owner_id ?? null, data.name, data.image_url,
      data.thumb_url ?? null, data.tileable ?? 1, data.source ?? 'public', data.status ?? 1,
    ],
  )
  return r.insertId
}

export async function deletePattern(id: number, ownerId?: number): Promise<void> {
  if (ownerId != null) {
    await execute('DELETE FROM pattern WHERE id = ? AND owner_id = ?', [id, ownerId])
  } else {
    await execute('DELETE FROM pattern WHERE id = ?', [id])
  }
}

/** 更新公共花型（名称/分类/图片/缩略图） */
export async function updatePattern(
  id: number,
  data: { name?: string; categoryId?: number | null; imageUrl?: string; thumbUrl?: string | null },
): Promise<void> {
  const fields: string[] = []
  const args: any[] = []
  if (data.name !== undefined) { fields.push('name = ?'); args.push(data.name) }
  if (data.categoryId !== undefined) { fields.push('category_id = ?'); args.push(data.categoryId) }
  if (data.imageUrl !== undefined) { fields.push('image_url = ?'); args.push(data.imageUrl) }
  if (data.thumbUrl !== undefined) { fields.push('thumb_url = ?'); args.push(data.thumbUrl) }
  if (!fields.length) return
  args.push(id)
  await execute(`UPDATE pattern SET ${fields.join(', ')} WHERE id = ?`, args)
}
