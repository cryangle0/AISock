import './AssetLibrary.css'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { PATTERN_LIST } from './patternConstants'
import { PatternDefs } from './patterns'

const TYPE_TABS = ['全部', '碎花', '条纹', '几何', '动物', '抽象']

export default function AssetLibrary() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('全部')

  const visible = PATTERN_LIST.filter(p => !query || p.name.includes(query))

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">素材库</h1>
          <p className="page-sub">{PATTERN_LIST.length} 套官方花型 · 1k+ AI 生成花型</p>
        </div>
        <div className="page-search">
          <Search size={13} strokeWidth={1.6}/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索花型 / 标签"/>
        </div>
      </header>

      <div className="lib-tabs">
        {TYPE_TABS.map(t => (
          <button key={t} className={`lib-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="lib-grid">
        {visible.map(p => (
          <div key={p.id} className="lib-card">
            <svg viewBox="0 0 80 80" className="lib-thumb">
              <PatternDefs uid={`lib-${p.id}`}/>
              <rect width="80" height="80" rx="14" fill={`url(#${p.id}-lib-${p.id})`}/>
            </svg>
            <div className="lib-name">{p.name}</div>
            <div className="lib-tags">
              <span className="lib-tag">官方</span>
              <span className="lib-tag">免费</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
