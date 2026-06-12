/**
 * 推荐流 / 资讯 / FAQ
 */
import { query, queryOne, execute } from '../db.js'

export interface Article {
  id: number
  kind: string
  title: string
  cover_url: string | null
  summary: string | null
  content: string | null
  tag: string | null
  link: string | null
  sort: number
  status: number
  published_at: string | null
}

/**
 * 文章列表。
 * @param includeAll true=后台管理用，返回所有状态（含已下线，便于重新上线/编辑）；
 *                   false=App 端用，仅返回 status=1 已上线。
 */
export async function listArticles(kind?: string, limit = 30, includeAll = false): Promise<Article[]> {
  const conds: string[] = []
  const args: any[] = []
  if (!includeAll) conds.push('status = 1')
  if (kind) { conds.push('kind = ?'); args.push(kind) }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  args.push(limit)
  return query<Article>(
    `SELECT * FROM article ${where} ORDER BY sort ASC, id DESC LIMIT ?`,
    args,
  )
}

/** 文章详情。includeAll=true 后台用（含已下线）；false App 端仅已上线 */
export async function getArticle(id: number, includeAll = false): Promise<Article | null> {
  const sql = includeAll
    ? 'SELECT * FROM article WHERE id = ?'
    : 'SELECT * FROM article WHERE id = ? AND status = 1'
  return queryOne<Article>(sql, [id])
}

export async function createArticle(data: Partial<Article>): Promise<number> {
  const r = await execute(
    `INSERT INTO article (kind, title, cover_url, summary, content, tag, link, sort, status, published_at)
     VALUES (?,?,?,?,?,?,?,?,?, ?)`,
    [
      data.kind || 'feed', data.title, data.cover_url ?? null, data.summary ?? null,
      data.content ?? null, data.tag ?? null, data.link ?? null,
      data.sort ?? 0, data.status ?? 1, data.published_at ?? new Date(),
    ],
  )
  return r.insertId
}

export async function updateArticle(id: number, data: Partial<Article>): Promise<void> {
  const fields: string[] = []
  const values: any[] = []
  const allow: (keyof Article)[] = ['kind', 'title', 'cover_url', 'summary', 'content', 'tag', 'link', 'sort', 'status', 'published_at']
  for (const k of allow) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`)
      values.push(data[k])
    }
  }
  if (!fields.length) return
  values.push(id)
  await execute(`UPDATE article SET ${fields.join(', ')} WHERE id = ?`, values)
}

export async function deleteArticle(id: number): Promise<void> {
  await execute('DELETE FROM article WHERE id = ?', [id])
}
