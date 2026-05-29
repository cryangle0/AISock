/**
 * 订单领域服务
 */
import { query, queryOne, execute } from '../db.js'

export type OrderStatus = 'pending' | 'paid' | 'producing' | 'shipped' | 'done' | 'cancelled'

export interface Order {
  id: number
  order_no: string
  user_id: number
  design_id: number | null
  design_name: string | null
  sock_model_id: number | null
  sizes: Record<string, number> | null
  quantity: number
  unit_price: number
  total_amount: number
  material: string | null
  craft: string | null
  address: string | null
  remark: string | null
  status: OrderStatus
  pay_method: string | null
  paid_at: string | null
  created_at: string
}

function genOrderNo(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const rand = String(Math.floor(Math.random() * 1e6)).padStart(6, '0')
  return `AS${ts}${rand}`
}

export async function listOrders(userId: number, status?: OrderStatus): Promise<Order[]> {
  if (status) {
    return query<Order>(
      'SELECT * FROM `order` WHERE user_id = ? AND status = ? ORDER BY id DESC',
      [userId, status],
    )
  }
  return query<Order>('SELECT * FROM `order` WHERE user_id = ? ORDER BY id DESC', [userId])
}

export async function getOrder(id: number, userId: number): Promise<Order | null> {
  return queryOne<Order>('SELECT * FROM `order` WHERE id = ? AND user_id = ?', [id, userId])
}

export interface CreateOrderInput {
  designId?: number
  designName?: string
  sockModelId?: number
  sizes?: Record<string, number>
  quantity: number
  unitPrice: number
  material?: string
  craft?: string
  address?: string
  remark?: string
}

export async function createOrder(userId: number, input: CreateOrderInput): Promise<{ id: number; orderNo: string }> {
  const orderNo = genOrderNo()
  const total = +(input.quantity * input.unitPrice).toFixed(2)
  const r = await execute(
    `INSERT INTO \`order\`
      (order_no, user_id, design_id, design_name, sock_model_id, sizes, quantity, unit_price, total_amount, material, craft, address, remark, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending')`,
    [
      orderNo, userId, input.designId ?? null, input.designName ?? null, input.sockModelId ?? null,
      input.sizes ? JSON.stringify(input.sizes) : null, input.quantity, input.unitPrice, total,
      input.material ?? null, input.craft ?? null, input.address ?? null, input.remark ?? null,
    ],
  )
  return { id: r.insertId, orderNo }
}

export async function markPaid(id: number, userId: number, payMethod: string): Promise<void> {
  await execute(
    `UPDATE \`order\` SET status = 'paid', pay_method = ?, paid_at = NOW()
     WHERE id = ? AND user_id = ? AND status = 'pending'`,
    [payMethod, id, userId],
  )
}

export async function updateOrder(id: number, userId: number, patch: { remark?: string; address?: string }): Promise<void> {
  const fields: string[] = []
  const values: any[] = []
  if (patch.remark !== undefined) { fields.push('remark = ?'); values.push(patch.remark) }
  if (patch.address !== undefined) { fields.push('address = ?'); values.push(patch.address) }
  if (!fields.length) return
  values.push(id, userId)
  await execute(`UPDATE \`order\` SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values)
}

export async function orderStats(userId: number): Promise<Record<string, number>> {
  const rows = await query<{ status: OrderStatus; n: number }>(
    'SELECT status, COUNT(*) n FROM `order` WHERE user_id = ? GROUP BY status',
    [userId],
  )
  const stats: Record<string, number> = { total: 0, pending: 0, paid: 0, producing: 0, shipped: 0, done: 0, cancelled: 0 }
  for (const r of rows) {
    stats[r.status] = r.n
    stats.total += r.n
  }
  return stats
}
