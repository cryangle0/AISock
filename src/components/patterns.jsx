// 纯组件文件 — 仅导出 PatternDefs。常量已挪到 patternConstants.js。
// uid 用于在同一文档存在多个 SockSvg 时避免 id 冲突 — 默认空字符串复用全局。

export function PatternDefs({ uid = '' }) {
  const sfx = uid ? `-${uid}` : ''
  return (
    <defs>
      <pattern id={`p-floral${sfx}`} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
        <rect width="28" height="28" fill="#fff7fa"/>
        <g fill="#d4376b">
          <circle cx="6" cy="6" r="1.6"/>
          <circle cx="22" cy="22" r="1.6"/>
          <circle cx="22" cy="6" r="1"/>
          <circle cx="6" cy="22" r="1"/>
        </g>
        <circle cx="14" cy="14" r="2.6" fill="#f7b8cd"/>
        <circle cx="14" cy="14" r="1.2" fill="#d4376b"/>
      </pattern>
      <pattern id={`p-stripe${sfx}`} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#fff"/>
        <rect width="6" height="14" fill="#d4376b" opacity="0.85"/>
      </pattern>
      <pattern id={`p-dots${sfx}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#fdf3f8"/>
        <circle cx="8" cy="8" r="2.4" fill="#d4376b"/>
      </pattern>
      <pattern id={`p-checker${sfx}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#fff"/>
        <rect width="10" height="10" fill="#d4376b"/>
        <rect x="10" y="10" width="10" height="10" fill="#d4376b"/>
      </pattern>
      <pattern id={`p-flower-big${sfx}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="#fff7fa"/>
        <g transform="translate(30 30)" fill="#e85a8a">
          <ellipse cx="0" cy="-12" rx="6" ry="10"/>
          <ellipse cx="0" cy="12" rx="6" ry="10"/>
          <ellipse cx="-12" cy="0" rx="10" ry="6"/>
          <ellipse cx="12" cy="0" rx="10" ry="6"/>
        </g>
        <circle cx="30" cy="30" r="5" fill="#fff0a8"/>
        <circle cx="30" cy="30" r="2.6" fill="#d4376b"/>
      </pattern>
      <pattern id={`p-blue${sfx}`} x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="32" height="32" fill="#eef4fb"/>
        <g fill="#3a6fb0">
          <circle cx="8" cy="8" r="2.4"/>
          <circle cx="24" cy="24" r="2.4"/>
        </g>
        <circle cx="16" cy="16" r="3.2" fill="#7da6d6"/>
      </pattern>
      <pattern id={`p-mono${sfx}`} x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
        <rect width="22" height="22" fill="#23262d"/>
        <path d="M2 11 Q11 4 20 11 Q11 18 2 11" fill="none" stroke="#aab1bd" strokeWidth="1.2"/>
      </pattern>
      <pattern id={`p-gold${sfx}`} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#fff8e7"/>
        <polygon points="12,4 14,10 20,10 15,14 17,20 12,16 7,20 9,14 4,10 10,10" fill="#b8893a"/>
      </pattern>
      <pattern id={`p-mint${sfx}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#eaf6f0"/>
        <circle cx="10" cy="10" r="2.4" fill="#5fb18a"/>
        <path d="M10 4 Q14 8 10 12 Q6 8 10 4" fill="#5fb18a" opacity="0.5"/>
      </pattern>
    </defs>
  )
}
