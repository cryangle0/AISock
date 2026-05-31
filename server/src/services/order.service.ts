/**
 * 订单领域服务
 */
import { query, queryOne, execute } from '../db.js'
import { computePrice } from './pricing.service.js'

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
  /** 前端传的单价仅作参考，最终以服务端 computePrice 为准 */
  unitPrice?: number
  material?: string
  craft?: string
  address?: string
  remark?: string
}

export async function createOrder(userId: number, input: CreateOrderInput): Promise<{ id: number; orderNo: string }> {
  const orderNo = genOrderNo()
  // 服务端权威计价：单价/总价按 材质 + 工艺 + 数量 计算，不信任前端传值
  const price = computePrice({ material: input.material, craft: input.craft, quantity: input.quantity })
  const r = await execute(
    `INSERT INTO \`order\`
      (order_no, user_id, design_id, design_name, sock_model_id, sizes, quantity, unit_price, total_amount, material, craft, address, remark, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending')`,
    [
      orderNo, userId, input.designId ?? null, input.designName ?? null, input.sockModelId ?? null,
      input.sizes ? JSON.stringify(input.sizes) : null, price.quantity, price.unitPrice, price.total,
      input.material ?? null, input.craft ?? null, input.address ?? null, input.remark ?? null,
    ],
  )
  return { id: r.insertId, orderNo }
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

/** 订单是否仍可编辑（备注/地址/补传附件）：仅待付款 / 已付款（未进入生产）可改 */
const EDITABLE_STATUS = new Set<OrderStatus>(['pending', 'paid'])

export async function updateOrder(
  id: number,
  userId: number,
  patch: { remark?: string; address?: string },
): Promise<void> {
  const order = await getOrder(id, userId)
  if (!order) throw Object.assign(new Error('订单不存在'), { status: 404 })
  if (!EDITABLE_STATUS.has(order.status)) {
    throw Object.assign(new Error('订单已进入生产，无法修改'), { status: 400 })
  }
  const fields: string[] = []
  const values: any[] = []
  if (patch.remark !== undefined) { fields.push('remark = ?'); values.push(patch.remark) }
  if (patch.address !== undefined) { fields.push('address = ?'); values.push(patch.address) }
  if (!fields.length) return
  values.push(id, userId)
  await execute(`UPDATE \`order\` SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values)
}

// ── 订单附件（设计稿 / 图片 / 文件，下单后可补传）──
export interface OrderAttachment {
  id: number
  order_id: number
  user_id: number
  name: string
  url: string
  mime: string | null
  size: number
  created_at: string
}

export async function listAttachments(orderId: number, userId: number): Promise<OrderAttachment[]> {
  // 校验订单归属，避免越权查看他人订单附件
  const order = await getOrder(orderId, userId)
  if (!order) throw Object.assign(new Error('订单不存在'), { status: 404 })
  return query<OrderAttachment>(
    'SELECT * FROM `order_attachment` WHERE order_id = ? ORDER BY id DESC',
    [orderId],
  )
}

export async function addAttachment(
  orderId: number,
  userId: number,
  file: { name: string; url: string; mime?: string; size?: number },
): Promise<{ id: number }> {
  const order = await getOrder(orderId, userId)
  if (!order) throw Object.assign(new Error('订单不存在'), { status: 404 })
  if (!EDITABLE_STATUS.has(order.status)) {
    throw Object.assign(new Error('订单已进入生产，无法补传文件'), { status: 400 })
  }
  const r = await execute(
    'INSERT INTO `order_attachment` (order_id, user_id, name, url, mime, size) VALUES (?,?,?,?,?,?)',
    [orderId, userId, file.name, file.url, file.mime ?? null, file.size ?? 0],
  )
  return { id: r.insertId }
}

export async function removeAttachment(orderId: number, userId: number, attachmentId: number): Promise<void> {
  const order = await getOrder(orderId, userId)
  if (!order) throw Object.assign(new Error('订单不存在'), { status: 404 })
  if (!EDITABLE_STATUS.has(order.status)) {
    throw Object.assign(new Error('订单已进入生产，无法删除文件'), { status: 400 })
  }
  await execute('DELETE FROM `order_attachment` WHERE id = ? AND order_id = ? AND user_id = ?', [attachmentId, orderId, userId])
}
