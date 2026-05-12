import { useState } from 'react'
import { Sparkles, Users, ShoppingCart } from 'lucide-react'

const REGIONS = [
  { key: 'welt', label: '袜口' },
  { key: 'cuff', label: '螺口' },
  { key: 'body', label: '主体' },
  { key: 'toe', label: '袜头' },
]

const PATTERNS = [
  { id: 1, name: '碎花', color: '#fce8ef' },
  { id: 2, name: '条纹', color: '#e8f0fc' },
  { id: 3, name: '圆点', color: '#fdf3f8' },
  { id: 4, name: '方格', color: '#f3f4f7' },
  { id: 5, name: '大花', color: '#fff7fa' },
  { id: 6, name: '蓝花', color: '#eef4fb' },
  { id: 7, name: '薄荷', color: '#eaf6f0' },
  { id: 8, name: '金色', color: '#fff8e7' },
]

export default function BEditor({ onNavigate }) {
  const [activeRegion, setActiveRegion] = useState('body')
  const [regionPatterns, setRegionPatterns] = useState({
    welt: 2, cuff: 1, body: 1, toe: 3,
  })
  const [density, setDensity] = useState(50)

  const handlePatternSelect = (patternId) => {
    setRegionPatterns(prev => ({ ...prev, [activeRegion]: patternId }))
  }

  return (
    <div className="mp-page mp-page-editor">
      {/* 袜版预览 */}
      <div className="mp-editor-canvas">
        <svg viewBox="0 0 200 320" className="mp-sock-svg">
          <defs>
            <clipPath id="b-sock-clip">
              <path d="M40 20 L160 20 L160 200 Q160 230 148 245 L95 298 Q87 306 78 306 L50 306 Q40 306 40 296 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#b-sock-clip)">
            <rect x="40" y="20" width="120" height="30" fill={PATTERNS[regionPatterns.welt - 1]?.color} />
            <rect x="40" y="50" width="120" height="40" fill={PATTERNS[regionPatterns.cuff - 1]?.color} />
            <rect x="40" y="90" width="120" height="150" fill={PATTERNS[regionPatterns.body - 1]?.color} />
            <rect x="40" y="240" width="120" height="66" fill={PATTERNS[regionPatterns.toe - 1]?.color} />
          </g>
          <path
            d="M40 20 L160 20 L160 200 Q160 230 148 245 L95 298 Q87 306 78 306 L50 306 Q40 306 40 296 Z"
            fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5"
          />
          {/* 区域高亮 */}
          {activeRegion === 'welt' && <rect x="40" y="20" width="120" height="30" fill="rgba(58,111,176,0.15)" stroke="#3a6fb0" strokeWidth="1" strokeDasharray="3" />}
          {activeRegion === 'cuff' && <rect x="40" y="50" width="120" height="40" fill="rgba(58,111,176,0.15)" stroke="#3a6fb0" strokeWidth="1" strokeDasharray="3" />}
          {activeRegion === 'body' && <rect x="40" y="90" width="120" height="150" fill="rgba(58,111,176,0.15)" stroke="#3a6fb0" strokeWidth="1" strokeDasharray="3" />}
          {activeRegion === 'toe' && <rect x="40" y="240" width="120" height="66" fill="rgba(58,111,176,0.15)" stroke="#3a6fb0" strokeWidth="1" strokeDasharray="3" />}
        </svg>
      </div>

      {/* 区域 tab */}
      <div className="mp-region-tabs">
        {REGIONS.map(r => (
          <button
            key={r.key}
            className={`mp-region-tab ${activeRegion === r.key ? 'active' : ''}`}
            onClick={() => setActiveRegion(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* 花型选择 */}
      <div className="mp-section-header">
        <span className="mp-section-title">花型</span>
      </div>
      <div className="mp-pattern-scroll">
        {PATTERNS.map(p => (
          <button
            key={p.id}
            className={`mp-pattern-item ${regionPatterns[activeRegion] === p.id ? 'active' : ''}`}
            onClick={() => handlePatternSelect(p.id)}
          >
            <div className="mp-pattern-swatch" style={{ background: p.color }} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* 密度滑块 */}
      <div className="mp-slider-group">
        <span className="mp-slider-label">密度</span>
        <input
          type="range"
          min="10"
          max="100"
          value={density}
          onChange={e => setDensity(e.target.value)}
          className="mp-slider"
        />
        <span className="mp-slider-value">{density}%</span>
      </div>

      {/* 底部操作 */}
      <div className="mp-editor-actions">
        <button className="mp-action-btn" onClick={() => onNavigate('b-ai-extend')}>
          <Sparkles size={13} /> AI 同款
        </button>
        <button className="mp-action-btn" onClick={() => onNavigate('b-family')}>
          <Users size={13} /> 亲子袜
        </button>
        <button className="mp-action-btn primary" onClick={() => onNavigate('b-submit')}>
          <ShoppingCart size={13} /> 下单
        </button>
      </div>
    </div>
  )
}
