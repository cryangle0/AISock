/**
 * 支付流水（payment 表）通用读写 —— 供微信 JSAPI / 微信 Native / 支付宝 共用。
 *
 * 设计：同一订单复用最近一条 pending 流水（切换支付方式只更新 method/金额，不重复落库），
 * 已支付/已失败则新开一条，保证 out_trade_no 唯一且可追溯。
 */
import { execute, queryOne, transaction } from '../db.js'

export function genOutTradeNo(orderId: number): string {
  return `AS${Date.now()}${orderId}`
}

export interface PendingPayment {
  outTradeNo: string
  /** 是否复用了既有 pending 流水 */
  reused: boolean
}

/**
 * 确保订单存在一条 pending 支付流水，返回其 out_trade_no。
 * @param method 'wechat' | 'alipay'
 * @param prepayId 预下单凭证（JSAPI prepay_id / Native code_url），可空（下单前占位）
 */
export async function upsertPendingPayment(
  orderId: number,
  amountFen: number,
  method: string,
  prepayId: string | null,
): Promise<PendingPayment> {
  const existing = await queryOne<{ id: number; out_trade_no: string; status: string }>(
    'SELECT id, out_trade_no, status FROM payment WHERE order_id = ? ORDER BY id DESC LIMIT 1',
    [orderId],
  )
  if (existing && existing.status === 'pending') {
    await execute('UPDATE payment SET amount_fen = ?, method = ?, prepay_id = ? WHERE id = ?', [
      amountFen,
      method,
      prepayId,
      existing.id,
    ])
    return { outTradeNo: existing.out_trade_no, reused: true }
  }
  const outTradeNo = genOutTradeNo(orderId)
  await execute(
    `INSERT INTO payment (order_id, out_trade_no, method, amount_fen, status, prepay_id)
     VALUES (?,?,?,?, 'pending', ?)`,
    [orderId, outTradeNo, method, amountFen, prepayId],
  )
  return { outTradeNo, reused: false }
}

/** 回填预下单凭证（Native code_url / JSAPI prepay_id） */
export async function setPrepayId(outTradeNo: string, prepayId: string): Promise<void> {
  await execute('UPDATE payment SET prepay_id = ? WHERE out_trade_no = ?', [prepayId, outTradeNo])
}

/**
 * 标记支付成功（回调验签解密后 / dev mock 调用）：幂等更新 payment + order。
 * @param paidAmountFen 渠道回调带回的实付金额（分）；提供时与下单金额比对，不符则拒绝（防篡改/串单）。
 * @param payMethodLabel 落到 order.pay_method 的中文标签（微信支付 / 支付宝）
 */
export async function markPaid(
  outTradeNo: string,
  transactionId: string | null,
  paidAmountFen?: number,
  payMethodLabel = '微信支付',
): Promise<{ ok: boolean }> {
  const row = await queryOne<{ id: number; order_id: number; status: string; amount_fen: number }>(
    'SELECT id, order_id, status, amount_fen FROM payment WHERE out_trade_no = ?',
    [outTradeNo],
  )
  if (!row) return { ok: false }
  if (row.status === 'success') return { ok: true } // 幂等

  // 金额校验：回调带回金额时必须与下单金额一致，防止伪造小额支付完成大额订单
  if (typeof paidAmountFen === 'number' && paidAmountFen !== row.amount_fen) {
    console.warn(
      `[pay] 金额不符，拒绝落库: out_trade_no=${outTradeNo} 期望=${row.amount_fen} 实收=${paidAmountFen}`,
    )
    return { ok: false }
  }

  // payment 与 order 在同一事务内更新，保证状态一致（避免支付成功但订单卡 pending）
  await transaction(async (conn) => {
    await conn.query(
      'UPDATE payment SET status = ?, transaction_id = ?, paid_at = NOW() WHERE id = ? AND status != ?',
      ['success', transactionId, row.id, 'success'],
    )
    await conn.query(
      `UPDATE \`order\` SET status = 'paid', pay_method = ?, paid_at = NOW()
       WHERE id = ? AND status = 'pending'`,
      [payMethodLabel, row.order_id],
    )
  })
  return { ok: true }
}
