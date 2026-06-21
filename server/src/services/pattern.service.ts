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
  display_config: PatternDisplayConfig | null
  tileable: number
  source: string
  status: number
}

export interface PatternDisplayConfig {
  feedTitle?: string
  feedCover?: string
  detailTitle?: string
  detailDescription?: string
  detailSlides?: string[]
  detailGallery?: string[]
}

export interface PatternCategory {
  id: number
  name: string
  description: string | null
  sort: number
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeStringList(value: unknown, max?: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const list = value.map(normalizeString).filter((s): s is string => !!s)
  const limited = max ? list.slice(0, max) : list
  return limited.length ? limited : undefined
}

export function normalizeDisplayConfig(value: unknown): PatternDisplayConfig | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const cfg: PatternDisplayConfig = {}
  const feedTitle = normalizeString(raw.feedTitle)
  const feedCover = normalizeString(raw.feedCover)
  const detailTitle = normalizeString(raw.detailTitle)
  const detailDescription = normalizeString(raw.detailDescription)
  const detailSlides = normalizeStringList(raw.detailSlides)
  const detailGallery = normalizeStringList(raw.detailGallery, 3)

  if (feedTitle) cfg.feedTitle = feedTitle
  if (feedCover) cfg.feedCover = feedCover
  if (detailTitle) cfg.detailTitle = detailTitle
  if (detailDescription) cfg.detailDescription = detailDescription
  if (detailSlides) cfg.detailSlides = detailSlides
  if (detailGallery) cfg.detailGallery = detailGallery

  return Object.keys(cfg).length ? cfg : null
}

type RawPattern = Omit<Pattern, 'display_config'> & { display_config: PatternDisplayConfig | string | null }

function parseDisplayConfig(row: RawPattern): Pattern {
  if (typeof row.display_config === 'string') {
    try {
      row.display_config = normalizeDisplayConfig(JSON.parse(row.display_config))
    } catch {
      row.display_config = null
    }
  } else {
    row.display_config = normalizeDisplayConfig(row.display_config)
  }
  return row as Pattern
}

export async function listCategories(): Promise<PatternCategory[]> {
  return query<PatternCategory>('SELECT * FROM pattern_category ORDER BY sort ASC, id ASC')
}

/** 单个公共花型详情（仅上线状态，访客可读） */
export async function getPublicPatternById(id: number): Promise<Pattern | null> {
  const row = await queryOne<RawPattern>(
    'SELECT * FROM pattern WHERE id = ? AND status = 1 AND owner_id IS NULL',
    [id],
  )
  return row ? parseDisplayConfig(row) : null
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
  /** 标签筛选：每个内层数组是一个维度（场景/风格），维度内 OR，维度间 AND。如 [[场景tagIds],[风格tagIds]] */
  tagIdGroups?: number[][]
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
  // 标签筛选：每个维度一条 IN 子查询（维度内 OR），多维度叠加（维度间 AND）
  if (p.tagIdGroups?.length) {
    for (const group of p.tagIdGroups) {
      const ids = (group || []).filter((n) => Number.isInteger(n) && n > 0)
      if (!ids.length) continue
      const ph = ids.map(() => '?').join(',')
      conds.push(`id IN (SELECT pattern_id FROM pattern_tag WHERE tag_id IN (${ph}))`)
      args.push(...ids)
    }
  }
  const where = `WHERE ${conds.join(' AND ')}`
  const totalRow = await queryOne<{ n: number }>(`SELECT COUNT(*) n FROM pattern ${where}`, args)
  const list = await query<RawPattern>(
    `SELECT * FROM pattern ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...args, p.pageSize, p.offset],
  )
  return { list: list.map(parseDisplayConfig), total: totalRow?.n ?? 0 }
}

export async function createPattern(data: Partial<Pattern>): Promise<number> {
  const displayConfig = normalizeDisplayConfig(data.display_config)
  const r = await execute(
    `INSERT INTO pattern (category_id, owner_id, name, image_url, thumb_url, display_config, tileable, source, status)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      data.category_id ?? null, data.owner_id ?? null, data.name, data.image_url,
      data.thumb_url ?? null, displayConfig ? JSON.stringify(displayConfig) : null,
      data.tileable ?? 1, data.source ?? 'public', data.status ?? 1,
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
  data: {
    name?: string
    categoryId?: number | null
    imageUrl?: string
    thumbUrl?: string | null
    displayConfig?: PatternDisplayConfig | null
  },
): Promise<void> {
  const fields: string[] = []
  const args: any[] = []
  if (data.name !== undefined) { fields.push('name = ?'); args.push(data.name) }
  if (data.categoryId !== undefined) { fields.push('category_id = ?'); args.push(data.categoryId) }
  if (data.imageUrl !== undefined) { fields.push('image_url = ?'); args.push(data.imageUrl) }
  if (data.thumbUrl !== undefined) { fields.push('thumb_url = ?'); args.push(data.thumbUrl) }
  if (data.displayConfig !== undefined) {
    const displayConfig = normalizeDisplayConfig(data.displayConfig)
    fields.push('display_config = ?')
    args.push(displayConfig ? JSON.stringify(displayConfig) : null)
  }
  if (!fields.length) return
  args.push(id)
  await execute(`UPDATE pattern SET ${fields.join(', ')} WHERE id = ?`, args)
}
