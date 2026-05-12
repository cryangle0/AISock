import { useState } from 'react'
import { Sparkles, Upload } from 'lucide-react'

const TABS = ['内置', 'AI 生成', '我上传']

const ASSETS = {
  '内置': [
    { id: 1, color: '#fce8ef' }, { id: 2, color: '#e8f0fc' },
    { id: 3, color: '#eaf6f0' }, { id: 4, color: '#fff8e7' },
    { id: 5, color: '#fdf3f8' }, { id: 6, color: '#eef4fb' },
    { id: 7, color: '#fff7fa' }, { id: 8, color: '#f3f4f7' },
    { id: 9, color: '#fce8ef' },
  ],
  'AI 生成': [
    { id: 11, color: '#fce8ef' }, { id: 12, color: '#e8f0fc' },
    { id: 13, color: '#eaf6f0' }, { id: 14, color: '#fff8e7' },
    { id: 15, color: '#fdf3f8' }, { id: 16, color: '#eef4fb' },
  ],
  '我上传': [
    { id: 21, color: '#fce8ef' }, { id: 22, color: '#e8f0fc' },
  ],
}

export default function BAssets({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('内置')
  const [selected, setSelected] = useState(new Set())

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const currentAssets = ASSETS[activeTab] || []

  return (
    <div className="mp-page mp-page-assets">
      {/* Tabs */}
      <div className="mp-filter-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`mp-filter-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); setSelected(new Set()) }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 网格 */}
      {currentAssets.length > 0 ? (
        <div className="mp-assets-grid">
          {currentAssets.map(a => (
            <button
              key={a.id}
              className={`mp-asset-item ${selected.has(a.id) ? 'selected' : ''}`}
              onClick={() => toggle(a.id)}
            >
              <div className="mp-asset-img" style={{ background: a.color }} />
              {selected.has(a.id) && <div className="mp-asset-check">✓</div>}
            </button>
          ))}
        </div>
      ) : (
        <div className="mp-assets-empty">
          <Upload size={20} strokeWidth={1.2} />
          <p>暂无素材，点击下方上传</p>
        </div>
      )}

      {/* AI FAB */}
      {activeTab === 'AI 生成' && (
        <button className="mp-fab">
          <Sparkles size={16} />
        </button>
      )}

      {/* 底部操作 */}
      {selected.size > 0 && (
        <div className="mp-editor-actions">
          <button className="mp-action-btn primary" onClick={() => onNavigate('b-editor')}>
            应用到画布 ({selected.size})
          </button>
        </div>
      )}
    </div>
  )
}
