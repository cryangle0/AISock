/**
 * 设计稿领域服务
 */
import { query, queryOne, execute } from '../db.js'
import { persistDataUrl } from './oss.service.js'

export interface Design {
  id: number
  user_id: number
  sock_model_id: number | null
  name: string
  regions: Record<string, unknown> | null
  cover_url: string | null
  from_preset: number
  created_at: string
  updated_at: string
}

export async function listDesigns(userId: number): Promise<Design[]> {
  return query<Design>('SELECT * FROM design WHERE user_id = ? ORDER BY id DESC', [userId])
}

export async function getDesign(id: number, userId: number): Promise<Design | null> {
  return queryOne<Design>('SELECT * FROM design WHERE id = ? AND user_id = ?', [id, userId])
}

export interface SaveDesignInput {
  name: string
  sockModelId?: number
  regions?: Record<string, unknown>
  coverUrl?: string
  fromPreset?: boolean
}

/**
 * 规范化封面：dataURL（base64 快照）转存 OSS 取短 URL；
 * 仅保留 http(s) 的普通 URL —— wxfile:// 等客户端临时路径在服务端不可访问，
 * 落库后封面必然失效，直接丢弃；超长（>500）脏值同样丢弃，避免撑爆 varchar(512)。
 */
async function normalizeCover(coverUrl?: string): Promise<string | null> {
  if (!coverUrl) return null
  if (coverUrl.startsWith('data:')) {
    const url = await persistDataUrl(coverUrl, 'cover')
    return url || null
  }
  if (!/^https?:\/\//i.test(coverUrl) && !coverUrl.startsWith('/')) return null
  if (coverUrl.length > 500) return null
  return coverUrl
}

export async function createDesign(userId: number, input: SaveDesignInput): Promise<number> {
  const coverUrl = await normalizeCover(input.coverUrl)
  const r = await execute(
    `INSERT INTO design (user_id, sock_model_id, name, regions, cover_url, from_preset)
     VALUES (?,?,?,?,?,?)`,
    [
      userId, input.sockModelId ?? null, input.name,
      input.regions ? JSON.stringify(input.regions) : null,
      coverUrl, input.fromPreset ? 1 : 0,
    ],
  )
  return r.insertId
}

export async function updateDesign(id: number, userId: number, input: SaveDesignInput): Promise<void> {
  const coverUrl = await normalizeCover(input.coverUrl)
  await execute(
    `UPDATE design SET name = ?, sock_model_id = ?, regions = ?, cover_url = ?
     WHERE id = ? AND user_id = ?`,
    [
      input.name, input.sockModelId ?? null,
      input.regions ? JSON.stringify(input.regions) : null,
      coverUrl, id, userId,
    ],
  )
}

export async function deleteDesign(id: number, userId: number): Promise<void> {
  await execute('DELETE FROM design WHERE id = ? AND user_id = ?', [id, userId])
}

export async function countDesigns(userId: number): Promise<number> {
  const row = await queryOne<{ n: number }>('SELECT COUNT(*) n FROM design WHERE user_id = ?', [userId])
  return row?.n ?? 0
}
