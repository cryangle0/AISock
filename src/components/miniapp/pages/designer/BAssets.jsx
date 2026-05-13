/**
 * BAssets — 素材库（对齐 web AssetLibrary）
 * 真实花型 SVG 渲染 + tab 分类 + 搜索
 */
import { useState } from 'react'
import { Search } from 'lucide-react'
import { PATTERN_LIST } from '../../../patternConstants'
import { PatternDefs } from '../../../patterns'

const TYPE_TABS = ['全部', '碎花', '条纹', '几何', '动物', '抽象']

export default function BAssets() {
  const [tab, setTab] = useState('全部')
  const [query, setQuery] = useState('')

  const visible = PATTERN_LIST.filter((p) => !query || p.name.includes(query))

  return (
    <div className="mp-page mp-page-assets">
      <div className="mp-search-bar">
        <Search size={12} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索花型 / 标签"
        />
      </div>

      <div className="mp-asset-summary">
        {PATTERN_LIST.length} 套官方花型 · 1k+ AI 生成花型
      </div>

      <div className="mp-filter-tabs">
        {TYPE_TABS.map((t) => (
          <button
            key={t}
            className={`mp-filter-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mp-assets-grid">
        {visible.map((p) => (
          <div key={p.id} className="mp-asset-card">
            <svg viewBox="0 0 80 80" className="mp-asset-thumb">
              <PatternDefs uid={`assets-${p.id}`} />
              <rect width="80" height="80" rx="10" fill={`url(#${p.id}-assets-${p.id})`} />
            </svg>
            <div className="mp-asset-name">{p.name}</div>
            <div className="mp-asset-tags">
              <span className="mp-asset-tag">官方</span>
              <span className="mp-asset-tag">免费</span>
            </div>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="mp-empty-state">
          <p>没有匹配的花型</p>
        </div>
      )}
    </div>
  )
}
