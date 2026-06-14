/**
 * 静态大图托管在 OSS CDN（cdn.onnsa.cn/aisock/...），用于减小小程序代码包体积，
 * 通过微信「代码质量 - 图片和音频资源总量 ≤ 200K」检查。
 *
 * 约定：CDN 上的目录结构与本地 src 保持一致，便于上传与维护：
 *   本地 /static/images/feed-hero.webp  →  https://cdn.onnsa.cn/aisock/static/images/feed-hero.webp
 *   本地 /pkg/static/detail/xxx.webp     →  https://cdn.onnsa.cn/aisock/pkg/static/detail/xxx.webp
 *
 * 仅「体积较大的内容图」走 CDN；图标、缩略小图等仍留本地（保证核心 UI 在 CDN 未就绪时不受影响）。
 */
export const CDN_BASE = 'https://cdn.onnsa.cn/aisock'

/** 把本地静态路径映射为 CDN 完整地址 */
export function cdnImg(localPath: string): string {
  return `${CDN_BASE}${localPath}`
}
