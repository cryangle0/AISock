/**
 * 全局错误处理
 * 生产环境隐藏 5xx 详情（仅输出 traceId），开发环境保留 message
 */
import type { Context } from 'hono'
import { randomBytes } from 'node:crypto'

const isProduction = process.env.NODE_ENV === 'production'

export function errorHandler(err: Error, c: Context) {
  // 请求体不是合法 JSON（多为扫描器/异常客户端）：返回 400 而非 500，避免污染错误日志/监控
  if (err instanceof SyntaxError && /JSON|token|escaped/i.test(err.message)) {
    return c.json({ code: 10002, data: null, message: '请求体格式错误' }, 400)
  }

  const status = (err as any).status || 500
  const isInternal = status >= 500

  if (isInternal && isProduction) {
    const traceId = randomBytes(6).toString('hex')
    const path = new URL(c.req.url).pathname
    console.error(`[Error:${traceId}] ${c.req.method} ${path} status=${status}`)
    console.error(`[Error:${traceId}:detail]`, err.message)
    return c.json(
      { code: 10006, data: null, message: `系统内部错误 (trace=${traceId})` },
      status,
    )
  }

  console.error(`[Error] ${c.req.method} ${c.req.url}:`, err.message)
  const message = isInternal ? '系统内部错误' : err.message
  return c.json({ code: status === 401 ? 10001 : 10006, data: null, message }, status)
}
