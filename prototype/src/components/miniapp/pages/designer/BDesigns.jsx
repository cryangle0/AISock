/**
 * BDesigns — 我的设计（对齐 web MyDesigns）
 * 直接读 App 透传的 designs 列表，用真实 cover 显示，支持搜索 + 删除
 */
import { useState } from 'react'
import { Search, Trash2, Sparkles } from 'lucide-react'
import SockMiniSvg from '../../../SockMiniSvg'

export default function BDesigns({ designs = [], onDeleteDesign, onNavigate }) {
  const [query, setQuery] = useState('')
  const filtered = designs.filter((d) => !query || (d.name || '').includes(query))

  if (designs.length === 0) {
    return (
      <div className="mp-page mp-page-designs">
        <EmptyState onNavigate={onNavigate} />
      </div>
    )
  }

  return (
    <div className="mp-page mp-page-designs">
      <div className="mp-search-bar">
        <Search size={12} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索设计名称"
        />
      </div>

      <div className="mp-designs-summary">
        已保存 {designs.length} 个袜版
      </div>

      <div className="mp-designs-grid">
        {filtered.map((d) => (
          <DesignCard
            key={d.id}
            design={d}
            onDelete={() => onDeleteDesign?.(d.id)}
            onClick={() => onNavigate?.('b-editor')}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mp-empty-state">
          <p>没有匹配的设计</p>
        </div>
      )}
    </div>
  )
}

function DesignCard({ design, onDelete, onClick }) {
  return (
    <div className="mp-design-card-v2">
      <button className="mp-design-cover-v2" onClick={onClick}>
        {design.coverImage ? (
          <img src={design.coverImage} alt={design.name} />
        ) : design.regions ? (
          <SockMiniSvg regions={design.regions} uid={`bd${design.id}`} />
        ) : (
          <div className="mp-design-cover-empty">暂无预览</div>
        )}
        {design.familyTag && (
          <span className="mp-design-tag">{design.familyTag}</span>
        )}
      </button>
      <div className="mp-design-meta-v2">
        <div className="mp-design-name-v2">{design.name}</div>
        <div className="mp-design-time-v2">{design.savedAt}</div>
      </div>
      <div className="mp-design-actions-v2">
        <button className="mp-icon-btn-v2" onClick={onClick} title="再创作">
          <Sparkles size={11} />
        </button>
        <button
          className="mp-icon-btn-v2 danger"
          onClick={(e) => { e.stopPropagation(); onDelete?.() }}
          title="删除"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

function EmptyState({ onNavigate }) {
  return (
    <div className="mp-empty-state">
      <div style={{ fontSize: 32 }}>🧦</div>
      <p>暂无设计稿</p>
      <button
        className="mp-cta-primary"
        onClick={() => onNavigate?.('b-editor')}
      >
        去创建第一个袜版
      </button>
    </div>
  )
}
