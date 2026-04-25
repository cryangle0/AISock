// 共享品牌 logo — "爱花型" 五瓣花
// size 控制 SVG 像素宽高；uid 用于在同页面多次出现时避免渐变 id 冲突。

export function BrandLogo({ size = 32, uid = 'lg' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id={`petal-${uid}`} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#ffa3c2"/>
          <stop offset="50%" stopColor="#e85a8a"/>
          <stop offset="100%" stopColor="#a82850"/>
        </radialGradient>
        <radialGradient id={`core-${uid}`}>
          <stop offset="0%" stopColor="#fff5b8"/>
          <stop offset="100%" stopColor="#f5a623"/>
        </radialGradient>
      </defs>
      <g transform="translate(32 32)">
        <g>
          {[0, 72, 144, 216, 288].map(deg => (
            <ellipse
              key={deg}
              cx="0" cy="-15" rx="8.5" ry="14"
              fill={`url(#petal-${uid})`}
              transform={`rotate(${deg})`}
            />
          ))}
        </g>
        <circle r="7" fill={`url(#core-${uid})`}/>
        <circle r="7" fill="none" stroke="#d4376b" strokeWidth="0.7" opacity="0.45"/>
        <g fill="#a8651a" opacity="0.8">
          <circle cx="-2.6" cy="-2.2" r="0.8"/>
          <circle cx="2.8" cy="-1.6" r="0.8"/>
          <circle cx="0" cy="2.6" r="0.8"/>
          <circle cx="-2.2" cy="1.8" r="0.8"/>
          <circle cx="2.4" cy="2.2" r="0.8"/>
        </g>
      </g>
    </svg>
  )
}
