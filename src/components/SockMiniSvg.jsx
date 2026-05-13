/**
 * SockMiniSvg — 把 design.regions 渲染成袜版形状的 SVG 缩略图
 * web 端 MyDesigns 和小程序 BDesigns 共用，确保缺省 demo 设计稿的预览一致
 */
import { PatternDefs } from './patterns'

export default function SockMiniSvg({ regions, uid }) {
  return (
    <svg viewBox="0 0 480 640" width="100%" height="100%">
      <PatternDefs uid={uid} />
      <defs>
        <clipPath id={`mc-body-${uid}`}>
          <path d="M100 60 L380 60 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#mc-body-${uid})`}>
        <rect x="100" y="60"  width="280" height="44"  fill={`url(#${regions.welt}-${uid})`} />
        <rect x="100" y="104" width="280" height="56"  fill={`url(#${regions.cuff}-${uid})`} />
        <rect x="100" y="160" width="280" height="320" fill={`url(#${regions.body}-${uid})`} />
        <rect x="100" y="478" width="280" height="120" fill={`url(#${regions.toe}-${uid})`} />
      </g>
      <path
        d="M100 60 L380 60 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z"
        fill="none" stroke="rgba(16,18,24,0.12)" strokeWidth="1.5"
      />
    </svg>
  )
}
