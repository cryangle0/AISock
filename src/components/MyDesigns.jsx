import { useState } from 'react'
import { Trash2, Sparkles, Search } from 'lucide-react'
import './MyDesigns.css'
import SockMiniSvg from './SockMiniSvg'

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
                <SockMiniSvg regions={d.regions} uid={`d${d.id}`}/>
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
