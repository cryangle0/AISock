/**
 * 内置花型 → 可绘制图片 dataURL（SVG 字符串拼接，浏览器直接 decode，无需二进制资源）。
 * 与设计器画布渲染共用：花型既能拖拽，也能喂进 canvas 合成。
 */

const PATTERN_DEFS: Record<string, string> = {
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

const TILE_SIZE: Record<string, number> = {
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

/** 把 patternId 渲染成 size×size 的 SVG dataURL（可直接喂 <img>/canvas） */
export function patternToImageURL(patternId: string, size = 240): string {
  const tile = TILE_SIZE[patternId]
  const def = PATTERN_DEFS[patternId]
  if (!tile || !def) return ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs><pattern id="${patternId}" x="0" y="0" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse">${def}</pattern></defs>
<rect width="${size}" height="${size}" fill="url(#${patternId})"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function hasPatternDef(patternId: string | null | undefined): boolean {
  return !!patternId && !!PATTERN_DEFS[patternId]
}
