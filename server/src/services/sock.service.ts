/**
 * 袜型领域服务
 */
import { query, queryOne, execute } from '../db.js'

export interface SockModel {
  id: number
  code: string
  name: string
  svg_url: string | null
  mask_url: string | null
  lineart_url: string | null
  print_area_px: number | null
  phys_width_mm: number | null
  phys_height_mm: number | null
  recommend_dpi: number | null
  craft: string | null
  min_order: number
  unit_price: number
  sort: number
  status: number
}

export async function listSocks(onlyActive = true): Promise<SockModel[]> {
  const where = onlyActive ? 'WHERE status = 1' : ''
  return query<SockModel>(`SELECT * FROM sock_model ${where} ORDER BY sort ASC, id ASC`)
}

export async function getSock(id: number): Promise<SockModel | null> {
  return queryOne<SockModel>('SELECT * FROM sock_model WHERE id = ?', [id])
}

export async function createSock(data: Partial<SockModel>): Promise<number> {
  const r = await execute(
    `INSERT INTO sock_model
      (code, name, svg_url, mask_url, lineart_url, print_area_px, phys_width_mm, phys_height_mm, recommend_dpi, craft, min_order, unit_price, sort, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      data.code, data.name, data.svg_url ?? null, data.mask_url ?? null, data.lineart_url ?? null,
      data.print_area_px ?? null, data.phys_width_mm ?? null, data.phys_height_mm ?? null,
      data.recommend_dpi ?? 150, data.craft ?? null, data.min_order ?? 1,
      data.unit_price ?? 0, data.sort ?? 0, data.status ?? 1,
    ],
  )
  return r.insertId
}

export async function updateSock(id: number, data: Partial<SockModel>): Promise<void> {
  const fields: string[] = []
  const values: any[] = []
  const allow: (keyof SockModel)[] = [
    'code', 'name', 'svg_url', 'mask_url', 'lineart_url', 'print_area_px',
    'phys_width_mm', 'phys_height_mm', 'recommend_dpi', 'craft', 'min_order',
    'unit_price', 'sort', 'status',
  ]
  for (const k of allow) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`)
      values.push(data[k])
    }
  }
  if (!fields.length) return
  values.push(id)
  await execute(`UPDATE sock_model SET ${fields.join(', ')} WHERE id = ?`, values)
}

export async function deleteSock(id: number): Promise<void> {
  await execute('DELETE FROM sock_model WHERE id = ?', [id])
}
