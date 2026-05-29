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

export async function listArticles(kind?: string, limit = 30): Promise<Article[]> {
  const where = kind ? 'WHERE status = 1 AND kind = ?' : 'WHERE status = 1'
  const args = kind ? [kind, limit] : [limit]
  return query<Article>(
    `SELECT * FROM article ${where} ORDER BY sort ASC, id DESC LIMIT ?`,
    args,
  )
}

export async function getArticle(id: number): Promise<Article | null> {
  return queryOne<Article>('SELECT * FROM article WHERE id = ? AND status = 1', [id])
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
