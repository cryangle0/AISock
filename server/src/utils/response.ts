/**
 * 统一响应封装
 * 业务成功 code=0；分页统一结构；失败 fail(c, msg, status)
 */
import type { Context } from 'hono'

export function ok<T>(c: Context, data?: T) {
  return c.json({ code: 0, data: data ?? null, message: 'success' })
}

export function fail(c: Context, message: string, statusCode = 400) {
  c.status(statusCode as any)
  return c.json({
    code: statusCode === 401 ? 10001 : 10006,
    data: null,
    message,
  })
}

export function paginated<T>(
  c: Context,
  list: T[],
  total: number,
  pageNum: number,
  pageSize: number,
) {
  return c.json({
    code: 0,
    data: {
      list,
      total,
      pageNum,
      pageSize,
      pages: Math.ceil(total / pageSize),
    },
    message: 'success',
  })
}
