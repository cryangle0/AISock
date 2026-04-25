import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import './Modal.css'
import { PATTERN_LIST } from './patternConstants'
import { PatternDefs } from './patterns'

// 模拟 AI 同款生成 — 基于当前 base regions，把 body 替换成不同花型
function buildVariants(base, count) {
  const candidates = PATTERN_LIST.filter(p => p.id !== base.body).slice(0, count)
  return candidates.map((p, i) => ({
    id: i + 1,
    label: `同款 ${i + 1}`,
    regions: { ...base, body: p.id, cuff: p.id },
  }))
}

export default function ExtensionModal({ baseRegions, variantCount, onClose, onApply }) {
  const variants = buildVariants(baseRegions, variantCount)
  const [picked, setPicked] = useState(variants[0]?.id ?? null)

  const cards = [
    { id: 0, label: '原图', regions: baseRegions },
    ...variants,
  ]

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-card large" onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <div className="modal-title">
              <Sparkles size={15} strokeWidth={1.6}/>
              AI 同款生成
            </div>
            <div className="modal-sub">基于当前设计生成 {variantCount} 个风格延展</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.6}/></button>
        </header>

        <div className="ext-grid" style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 5)}, 1fr)` }}>
          {cards.map(card => (
            <button
              key={card.id}
              className={`ext-card ${picked === card.id ? 'active' : ''}`}
              onClick={() => card.id !== 0 && setPicked(card.id)}
              disabled={card.id === 0}
            >
              <SockMini regions={card.regions} uid={`ext-${card.id}`}/>
              <div className="ext-card-label">{card.label}</div>
            </button>
          ))}
        </div>

        <footer className="modal-foot">
          <button className="modal-btn ghost" onClick={onClose}>取消</button>
          <button
            className="modal-btn primary"
            disabled={picked == null}
            onClick={() => {
              const v = variants.find(v => v.id === picked)
              if (v) onApply(v.regions)
            }}
          >
            应用到画布
          </button>
        </footer>
      </div>
    </div>
  )
}

function SockMini({ regions, uid }) {
  return (
    <svg viewBox="0 0 480 640" width="100%" height="100%">
      <PatternDefs uid={uid}/>
      <defs>
        <clipPath id={`clip-body-${uid}`}>
          <path d="M100 60 L380 60 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z"/>
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-body-${uid})`}>
        <rect x="100" y="60" width="280" height="44" fill={`url(#${regions.welt}-${uid})`}/>
        <rect x="100" y="104" width="280" height="56" fill={`url(#${regions.cuff}-${uid})`}/>
        <rect x="100" y="160" width="280" height="320" fill={`url(#${regions.body}-${uid})`}/>
        <rect x="100" y="478" width="280" height="120" fill={`url(#${regions.toe}-${uid})`}/>
      </g>
      <path
        d="M100 60 L380 60 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z"
        fill="none" stroke="rgba(16,18,24,0.12)" strokeWidth="1.5"
      />
    </svg>
  )
}
