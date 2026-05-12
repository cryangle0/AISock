import { useState } from 'react'

const FILTERS = ['全部', '草稿', '已下单']

const DESIGNS = [
  { id: 1, name: '春日碎花款', time: '2 小时前', status: 'draft', color: '#fce8ef' },
  { id: 2, name: '商务条纹款', time: '昨天', status: 'ordered', color: '#e8f0fc' },
  { id: 3, name: '运动透气款', time: '3 天前', status: 'draft', color: '#eaf6f0' },
  { id: 4, name: '梦幻大花款', time: '5 天前', status: 'ordered', color: '#fce8ef' },
  { id: 5, name: '海蓝度假款', time: '1 周前', status: 'draft', color: '#e8f0fc' },
  { id: 6, name: '金色奢华款', time: '2 周前', status: 'ordered', color: '#fff8e7' },
]

export default function BDesigns({ onNavigate }) {
  const [filter, setFilter] = useState('全部')

  const filtered = DESIGNS.filter(d => {
    if (filter === '全部') return true
    if (filter === '草稿') return d.status === 'draft'
    if (filter === '已下单') return d.status === 'ordered'
    return true
  })

  return (
    <div className="mp-page mp-page-designs">
      <div className="mp-filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`mp-filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mp-designs-grid">
        {filtered.map(d => (
          <button key={d.id} className="mp-design-card" onClick={() => onNavigate('b-editor')}>
            <div className="mp-design-cover" style={{ background: d.color }}>
              <span className={`mp-design-badge ${d.status}`}>
                {d.status === 'draft' ? '草稿' : '已下单'}
              </span>
            </div>
            <div className="mp-design-info">
              <span className="mp-design-name">{d.name}</span>
              <span className="mp-design-time">{d.time}</span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mp-empty-state">
          <p>暂无{filter}的设计</p>
        </div>
      )}
    </div>
  )
}
