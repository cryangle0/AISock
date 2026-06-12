/**
 * 订单物流（用户查询 + 后台录入运单号）
 * 真机：录入运单后可定时调菜鸟/快递鸟拉取轨迹；这里只做存储 + mock 拉取
 */
import { query, queryOne, execute } from '../db.js'

export interface Shipment {
  id: number
  order_id: number
  carrier: string | null
  tracking_no: string | null
  status: string
  traces: Array<{ time: string; desc: string }> | null
  updated_at: string
}

export async function getShipment(orderId: number): Promise<Shipment | null> {
  return queryOne<Shipment>('SELECT * FROM order_shipment WHERE order_id = ?', [orderId])
}

/** 可发货的订单状态：必须已支付（paid/producing），或已发货（再次录入更新运单号） */
const SHIPPABLE_STATUS = new Set(['paid', 'producing', 'shipped'])

export async function upsertShipment(orderId: number, carrier: string, trackingNo: string): Promise<void> {
  // 校验订单状态：禁止把未支付/已取消/已完成的订单强制改为已发货（绕过支付的越权流转）
  const order = await queryOne<{ status: string }>('SELECT status FROM `order` WHERE id = ?', [orderId])
  if (!order) throw Object.assign(new Error('订单不存在'), { status: 404 })
  if (!SHIPPABLE_STATUS.has(order.status)) {
    throw Object.assign(new Error(`订单当前状态（${order.status}）不可发货，请先完成支付/生产`), { status: 400 })
  }
  await execute(
    `INSERT INTO order_shipment (order_id, carrier, tracking_no, status, traces)
     VALUES (?,?,?, 'in-transit', ?)
     ON DUPLICATE KEY UPDATE carrier=VALUES(carrier), tracking_no=VALUES(tracking_no), status=VALUES(status)`,
    [orderId, carrier, trackingNo, JSON.stringify([{ time: new Date().toISOString(), desc: '已发货，等待揽收' }])],
  )
  // 同步把订单状态推到 shipped（已是 shipped 则幂等）
  await execute(`UPDATE \`order\` SET status = 'shipped' WHERE id = ?`, [orderId])
}

export async function appendTrace(orderId: number, desc: string, status?: string): Promise<void> {
  const cur = await getShipment(orderId)
  if (!cur) return
  const traces = (cur.traces || []).concat({ time: new Date().toISOString(), desc })
  await execute(
    'UPDATE order_shipment SET traces = ?, status = ? WHERE order_id = ?',
    [JSON.stringify(traces), status || cur.status, orderId],
  )
  if (status === 'delivered') {
    await execute(`UPDATE \`order\` SET status = 'done' WHERE id = ?`, [orderId])
  }
}

export async function listShipments(): Promise<Shipment[]> {
  return query<Shipment>('SELECT * FROM order_shipment ORDER BY updated_at DESC LIMIT 100')
}
