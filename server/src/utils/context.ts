/**
 * 上下文助手：从 Hono Context 取登录态 / 分页参数
 */
import type { Context } from 'hono'

/** 取当前登录用户 id（requireAuth 注入），未登录返回 0 */
export function getUserId(c: Context): number {
  return (c.get('userId') as number | undefined) ?? 0
}

export interface PageQuery {
  pageNum: number
  pageSize: number
  offset: number
}

/** 解析分页参数，pageNum 从 1 开始，pageSize 上限 100 */
export function getPageQuery(c: Context, defaultSize = 10): PageQuery {
  const pageNum = Math.max(1, Number(c.req.query('pageNum')) || 1)
  const rawSize = Number(c.req.query('pageSize')) || defaultSize
  const pageSize = Math.min(100, Math.max(1, rawSize))
  return { pageNum, pageSize, offset: (pageNum - 1) * pageSize }
}
