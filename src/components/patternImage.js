// 把内置花型 / AI mock 生成结果 → 真实可拖拽 + 可绘制的图片 dataURL。
// 全部用 SVG 字符串拼接，浏览器直接 decode，无需任何二进制资源。

// 所有 pattern 的 SVG 定义片段（与 patterns.jsx 中的 PatternDefs 保持一致）
const PATTERN_DEFS = {
  'p-floral': `<rect width="28" height="28" fill="#fff7fa"/>
    <g fill="#d4376b"><circle cx="6" cy="6" r="1.6"/><circle cx="22" cy="22" r="1.6"/>
    <circle cx="22" cy="6" r="1"/><circle cx="6" cy="22" r="1"/></g>
    <circle cx="14" cy="14" r="2.6" fill="#f7b8cd"/>
    <circle cx="14" cy="14" r="1.2" fill="#d4376b"/>`,
  'p-stripe': `<rect width="14" height="14" fill="#fff"/>
    <rect width="6" height="14" fill="#d4376b" opacity="0.85"/>`,
  'p-dots': `<rect width="16" height="16" fill="#fdf3f8"/>
    <circle cx="8" cy="8" r="2.4" fill="#d4376b"/>`,
  'p-checker': `<rect width="20" height="20" fill="#fff"/>
    <rect width="10" height="10" fill="#d4376b"/>
    <rect x="10" y="10" width="10" height="10" fill="#d4376b"/>`,
  'p-flower-big': `<rect width="60" height="60" fill="#fff7fa"/>
    <g transform="translate(30 30)" fill="#e85a8a">
      <ellipse cx="0" cy="-12" rx="6" ry="10"/>
      <ellipse cx="0" cy="12" rx="6" ry="10"/>
      <ellipse cx="-12" cy="0" rx="10" ry="6"/>
      <ellipse cx="12" cy="0" rx="10" ry="6"/>
    </g>
    <circle cx="30" cy="30" r="5" fill="#fff0a8"/>
    <circle cx="30" cy="30" r="2.6" fill="#d4376b"/>`,
  'p-blue': `<rect width="32" height="32" fill="#eef4fb"/>
    <g fill="#3a6fb0"><circle cx="8" cy="8" r="2.4"/><circle cx="24" cy="24" r="2.4"/></g>
    <circle cx="16" cy="16" r="3.2" fill="#7da6d6"/>`,
  'p-mono': `<rect width="22" height="22" fill="#23262d"/>
    <path d="M2 11 Q11 4 20 11 Q11 18 2 11" fill="none" stroke="#aab1bd" stroke-width="1.2"/>`,
  'p-gold': `<rect width="24" height="24" fill="#fff8e7"/>
    <polygon points="12,4 14,10 20,10 15,14 17,20 12,16 7,20 9,14 4,10 10,10" fill="#b8893a"/>`,
  'p-mint': `<rect width="20" height="20" fill="#eaf6f0"/>
    <circle cx="10" cy="10" r="2.4" fill="#5fb18a"/>
    <path d="M10 4 Q14 8 10 12 Q6 8 10 4" fill="#5fb18a" opacity="0.5"/>`,
}

// 每种 pattern 的瓦片尺寸 — 与上面定义对应，用于在画布上重复 N 次
const TILE_SIZE = {
  'p-floral': 28,
  'p-stripe': 14,
  'p-dots': 16,
  'p-checker': 20,
  'p-flower-big': 60,
  'p-blue': 32,
  'p-mono': 22,
  'p-gold': 24,
  'p-mint': 20,
}

// 把 patternId 渲染成 size×size 的 SVG dataURL — 返回值可直接喂 <img>/canvas
export function patternToImageURL(patternId, size = 240) {
  const tile = TILE_SIZE[patternId]
  const def = PATTERN_DEFS[patternId]
  if (!tile || !def) return ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs><pattern id="${patternId}" x="0" y="0" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse">${def}</pattern></defs>
<rect width="${size}" height="${size}" fill="url(#${patternId})"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// AI 生成（mock）— 用 prompt 关键字命中色调，落点到本地 patterns，再做 hue-rotate / 缩放变体
const PROMPT_HINTS = [
  { keys: ['樱花', '春', '少女', '粉'], pid: 'p-flower-big', hue: 0 },
  { keys: ['海', '蓝', '海洋', '清爽', '度假'], pid: 'p-blue', hue: 0 },
  { keys: ['金', '奢华', '复古', '皇家'], pid: 'p-gold', hue: 0 },
  { keys: ['几何', '黑白', '简约', '极简'], pid: 'p-mono', hue: 0 },
  { keys: ['薄荷', '森系', '绿', '夏'], pid: 'p-mint', hue: 0 },
  { keys: ['条纹', '线条', '商务'], pid: 'p-stripe', hue: 30 },
  { keys: ['圆点', '波点'], pid: 'p-dots', hue: 60 },
  { keys: ['方格', '格子'], pid: 'p-checker', hue: 200 },
]

export function aiGenerateImage(prompt) {
  const text = (prompt || '').trim()
  let pid = 'p-floral'
  let hue = Math.floor(Math.random() * 360)
  for (const h of PROMPT_HINTS) {
    if (h.keys.some(k => text.includes(k))) {
      pid = h.pid
      hue = h.hue + Math.floor(Math.random() * 30 - 15)
      break
    }
  }
  const baseURL = patternToImageURL(pid, 320)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 320
      const ctx = canvas.getContext('2d')
      ctx.filter = `hue-rotate(${hue}deg) saturate(1.05)`
      ctx.drawImage(img, 0, 0, 320, 320)
      ctx.filter = 'none'
      try {
        resolve({
          url: canvas.toDataURL('image/png'),
          name: text || 'AI 生成花型',
          basePid: pid,
          hue,
        })
      } catch {
        resolve({ url: baseURL, name: text || 'AI 生成花型', basePid: pid, hue })
      }
    }
    img.onerror = () => resolve({ url: baseURL, name: text || 'AI 生成花型', basePid: pid, hue })
    img.src = baseURL
  })
}
