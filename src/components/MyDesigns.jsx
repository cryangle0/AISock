import { useState } from 'react'
import { Trash2, Sparkles, Search } from 'lucide-react'
import './MyDesigns.css'
import { PatternDefs } from './patterns'

export default function MyDesigns({ designs, onDelete }) {
  const [query, setQuery] = useState('')
  const filtered = designs.filter(d => !query || (d.name || '').includes(query))

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">我的设计</h1>
          <p className="page-sub">已保存 {designs.length} 个袜版</p>
        </div>
        <div className="page-search">
          <Search size={13} strokeWidth={1.6}/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索设计名称"/>
        </div>
      </header>

      <div className="design-grid">
        {filtered.map(d => (
          <div key={d.id} className="design-card">
            <div className="design-cover">
              {d.coverImage ? (
                <img src={d.coverImage} alt={d.name} className="design-cover-img"/>
              ) : d.regions ? (
                <SockMini regions={d.regions} uid={`d${d.id}`}/>
              ) : (
                <div className="design-cover-empty">暂无预览</div>
              )}
            </div>
            <div className="design-meta">
              <div className="design-name">{d.name}</div>
              <div className="design-time">{d.savedAt}</div>
            </div>
            <div className="design-actions">
              <button className="icon-btn" title="再创作">
                <Sparkles size={13} strokeWidth={1.6}/>
              </button>
              <button className="icon-btn danger" onClick={() => onDelete(d.id)} title="删除">
                <Trash2 size={13} strokeWidth={1.6}/>
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-emoji">🧦</div>
            <div className="empty-title">暂无设计</div>
            <div className="empty-sub">去"设计"页面创建你的第一个袜版吧</div>
          </div>
        )}
      </div>
    </div>
  )
}

function SockMini({ regions, uid }) {
  return (
    <svg viewBox="0 0 480 640" width="100%" height="100%">
      <PatternDefs uid={uid}/>
      <defs>
        <clipPath id={`mc-body-${uid}`}>
          <path d="M100 60 L380 60 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z"/>
        </clipPath>
      </defs>
      <g clipPath={`url(#mc-body-${uid})`}>
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
