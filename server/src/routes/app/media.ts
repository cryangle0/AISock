/**
 * 媒体代理：Canvas 加载 OSS 图时的同源回源（GET，公开只读 + 域名白名单）。
 */
import { Hono } from 'hono'
import { fail } from '../../utils/response.js'
import { fetchProxiedImage, isAllowedImageProxyUrl } from '../../services/imageProxy.service.js'

export const mediaRouter = new Hono()

mediaRouter.get('/image-proxy', async (c) => {
  const url = c.req.query('url')?.trim()
  if (!url) return fail(c, '缺少 url 参数')
  if (!isAllowedImageProxyUrl(url)) return fail(c, '不允许的图片地址', 403)
  try {
    const { body, mime } = await fetchProxiedImage(url)
    c.header('Content-Type', mime)
    c.header('Cache-Control', 'public, max-age=86400')
    return c.body(body)
  } catch (e) {
    return fail(c, (e as Error).message || '图片加载失败', 502)
  }
})
