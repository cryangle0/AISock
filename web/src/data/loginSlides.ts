// 登录弹框轮播图：本地 WebP，应用启动后预加载，弹框打开即时显示。
const base = import.meta.env.BASE_URL

export const LOGIN_SLIDES = [
  `${base}login/slide-1.webp`,
  `${base}login/slide-2.webp`,
  `${base}login/slide-3.webp`,
  `${base}login/slide-4.webp`,
]

/** 预加载登录轮播图（warm 浏览器缓存，提升弹框首屏响应速度） */
export function preloadLoginSlides() {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return
  const run = () => LOGIN_SLIDES.forEach((src) => { const img = new Image(); img.decoding = 'async'; img.src = src })
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback
  if (ric) ric(run)
  else setTimeout(run, 1200)
}
