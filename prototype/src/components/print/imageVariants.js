// 基于 canvas filter 的图像变体生成 — AI 延伸 / 亲子袜两处共用。
// filter 仅是浏览器内的可视效果，足以在 demo 阶段演示 AI 图生图的"变化方向"。

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = (e) => reject(e)
  img.src = src
})

/**
 * @param {string} imageURL
 * @param {Object} opts  { hueShift, saturate, brightness, contrast, blur }
 * @returns {Promise<string>}  变体后的 dataURL
 */
export async function deriveVariant(imageURL, opts = {}) {
  if (!imageURL) return ''
  const {
    hueShift = 0,
    saturate = 1,
    brightness = 1,
    contrast = 1,
    blur = 0,
  } = opts
  try {
    const img = await loadImage(imageURL)
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const ctx = c.getContext('2d')
    ctx.filter =
      `hue-rotate(${hueShift}deg) ` +
      `saturate(${saturate}) ` +
      `brightness(${brightness}) ` +
      `contrast(${contrast})` +
      (blur > 0 ? ` blur(${blur}px)` : '')
    ctx.drawImage(img, 0, 0)
    ctx.filter = 'none'
    return c.toDataURL('image/png')
  } catch {
    return imageURL
  }
}

// AI 同款延伸 — 4 个方向的色调变化
export const AI_EXTEND_PRESETS = [
  { id: 'warm',   label: '暖调延伸', desc: '色相 +35°，更暖',  opts: { hueShift: 35, saturate: 1.05 } },
  { id: 'cool',   label: '冷调延伸', desc: '色相 -45°，偏冷',  opts: { hueShift: -45, saturate: 1.0 } },
  { id: 'soft',   label: '柔和延伸', desc: '降饱和 + 提亮度',   opts: { hueShift: 10, saturate: 0.7, brightness: 1.1 } },
  { id: 'bright', label: '高饱延伸', desc: '更高饱和 + 对比',   opts: { hueShift: -15, saturate: 1.4, contrast: 1.08 } },
]

// 亲子款 — 成人原图 + 儿童柔化版（浅色 + 高亮 + 软对比）
export const FAMILY_PAIR_PRESETS = [
  { id: 'adult',  label: '成人款', desc: '保留原始花型',      opts: {} },
  { id: 'kid',    label: '儿童款', desc: '提亮 + 柔化色调',   opts: { saturate: 0.78, brightness: 1.16, contrast: 0.94, hueShift: 6 } },
]

// 同时生成多个变体
export async function deriveVariants(imageURL, presets) {
  return Promise.all(
    presets.map(async (p) => ({
      ...p,
      url: await deriveVariant(imageURL, p.opts),
    })),
  )
}
