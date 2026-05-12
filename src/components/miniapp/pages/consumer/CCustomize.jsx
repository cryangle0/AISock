import { useState } from 'react'

const PATTERNS = [
  { id: 1, name: '碎花', color: '#fce8ef' },
  { id: 2, name: '条纹', color: '#e8f0fc' },
  { id: 3, name: '圆点', color: '#fdf3f8' },
  { id: 4, name: '方格', color: '#f3f4f7' },
  { id: 5, name: '大花', color: '#fff7fa' },
  { id: 6, name: '蓝花', color: '#eef4fb' },
  { id: 7, name: '薄荷', color: '#eaf6f0' },
  { id: 8, name: '金色', color: '#fff8e7' },
  { id: 9, name: '单色', color: '#2c3140' },
]

const BASE_COLORS = [
  { id: 'white', color: '#ffffff', name: '白' },
  { id: 'pink', color: '#fce8ef', name: '粉' },
  { id: 'blue', color: '#e8f0fc', name: '蓝' },
  { id: 'black', color: '#2c3140', name: '黑' },
]

export default function CCustomize({ onNavigate }) {
  const [selectedPattern, setSelectedPattern] = useState(1)
  const [baseColor, setBaseColor] = useState('white')

  const currentBase = BASE_COLORS.find(c => c.id === baseColor)?.color || '#fff'

  return (
    <div className="mp-page mp-page-customize">
      {/* 袜版预览 */}
      <div className="mp-customize-preview">
        <svg viewBox="0 0 200 320" className="mp-sock-svg">
          <defs>
            <clipPath id="c-sock-clip">
              <path d="M40 20 L160 20 L160 200 Q160 230 148 245 L95 298 Q87 306 78 306 L50 306 Q40 306 40 296 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#c-sock-clip)">
            <rect x="40" y="20" width="120" height="286" fill={currentBase} />
            <rect x="40" y="20" width="120" height="30" fill={PATTERNS[selectedPattern - 1]?.color} opacity="0.8" />
            <rect x="40" y="50" width="120" height="40" fill={PATTERNS[selectedPattern - 1]?.color} opacity="0.6" />
            <rect x="40" y="90" width="120" height="150" fill={PATTERNS[selectedPattern - 1]?.color} opacity="0.4" />
            <rect x="40" y="240" width="120" height="66" fill={PATTERNS[selectedPattern - 1]?.color} opacity="0.7" />
          </g>
          <path
            d="M40 20 L160 20 L160 200 Q160 230 148 245 L95 298 Q87 306 78 306 L50 306 Q40 306 40 296 Z"
            fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* 花型选择 */}
      <div className="mp-section-header">
        <span className="mp-section-title">选择花型</span>
      </div>
      <div className="mp-pattern-scroll">
        {PATTERNS.map(p => (
          <button
            key={p.id}
            className={`mp-pattern-item ${selectedPattern === p.id ? 'active' : ''}`}
            onClick={() => setSelectedPattern(p.id)}
          >
            <div className="mp-pattern-swatch" style={{ background: p.color }} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* 底色选择 */}
      <div className="mp-section-header">
        <span className="mp-section-title">底色</span>
      </div>
      <div className="mp-base-colors">
        {BASE_COLORS.map(c => (
          <button
            key={c.id}
            className={`mp-base-color-btn ${baseColor === c.id ? 'active' : ''}`}
            onClick={() => setBaseColor(c.id)}
          >
            <div className="mp-base-swatch" style={{ background: c.color }} />
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* 底部操作 */}
      <div className="mp-customize-footer">
        <button className="mp-footer-btn primary" onClick={() => onNavigate('c-cart')}>
          加购定制款
        </button>
      </div>
    </div>
  )
}
