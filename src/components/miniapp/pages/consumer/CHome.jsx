import { ShoppingBag, Sparkles } from 'lucide-react'

const CATEGORIES = ['男袜', '女袜', '亲子', '运动']
const HOT_ITEMS = [
  { id: 1, name: '春日碎花', price: '¥28', color: '#fce8ef' },
  { id: 2, name: '商务条纹', price: '¥32', color: '#e8f0fc' },
  { id: 3, name: '薄荷清新', price: '¥26', color: '#eaf6f0' },
  { id: 4, name: '金色奢华', price: '¥38', color: '#fff8e7' },
  { id: 5, name: '海蓝度假', price: '¥30', color: '#e8f0fc' },
  { id: 6, name: '梦幻大花', price: '¥35', color: '#fce8ef' },
]

export default function CHome({ onNavigate }) {
  return (
    <div className="mp-page">
      {/* Banner */}
      <div className="mp-banner">
        <div className="mp-banner-bg" />
        <div className="mp-banner-content">
          <h3>AI 设计你的专属袜款</h3>
          <p>一键生成 · 7 天交付</p>
          <button className="mp-banner-btn" onClick={() => onNavigate('c-customize')}>
            <Sparkles size={12} /> 立即定制
          </button>
        </div>
      </div>

      {/* 分类入口 */}
      <div className="mp-categories">
        {CATEGORIES.map(cat => (
          <button key={cat} className="mp-cat-item" onClick={() => onNavigate('c-category')}>
            <ShoppingBag size={16} />
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* 热销 */}
      <div className="mp-section-header">
        <span className="mp-section-title">热销推荐</span>
        <button className="mp-section-more" onClick={() => onNavigate('c-category')}>更多 →</button>
      </div>
      <div className="mp-product-grid">
        {HOT_ITEMS.map(item => (
          <button key={item.id} className="mp-product-card" onClick={() => onNavigate('c-detail')}>
            <div className="mp-product-img" style={{ background: item.color }}>
              <ShoppingBag size={20} strokeWidth={1.2} style={{ opacity: 0.3 }} />
            </div>
            <div className="mp-product-info">
              <span className="mp-product-name">{item.name}</span>
              <span className="mp-product-price">{item.price}</span>
            </div>
          </button>
        ))}
      </div>

      {/* AI 灵感入口 */}
      <button className="mp-ai-entry" onClick={() => onNavigate('c-customize')}>
        <Sparkles size={14} />
        <span>AI 灵感生成 — 输一句话出袜款</span>
      </button>
    </div>
  )
}
