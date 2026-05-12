import { useState } from 'react'
import { Heart, Share2, ShoppingCart } from 'lucide-react'

const SIZES = ['S', 'M', 'L', 'XL']
const COLORS = ['#d4376b', '#3a6fb0', '#5fb18a', '#b8893a']

export default function CDetail({ onNavigate }) {
  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [liked, setLiked] = useState(false)

  return (
    <div className="mp-page mp-page-detail">
      {/* 主图 */}
      <div className="mp-detail-hero">
        <div className="mp-detail-img" />
        <div className="mp-detail-actions">
          <button className={`mp-icon-btn ${liked ? 'liked' : ''}`} onClick={() => setLiked(v => !v)}>
            <Heart size={16} fill={liked ? '#d4376b' : 'none'} />
          </button>
          <button className="mp-icon-btn"><Share2 size={16} /></button>
        </div>
      </div>

      {/* 信息 */}
      <div className="mp-detail-info">
        <div className="mp-detail-price">¥28.00</div>
        <h3 className="mp-detail-title">春日碎花款 · 纯棉中筒袜</h3>
        <div className="mp-detail-tags">
          <span className="mp-tag">纯棉</span>
          <span className="mp-tag">透气</span>
          <span className="mp-tag">四季可穿</span>
        </div>
        <div className="mp-detail-sales">月销 1,200+ · 好评 98%</div>
      </div>

      {/* 规格选择 */}
      <div className="mp-detail-spec">
        <div className="mp-spec-group">
          <span className="mp-spec-label">颜色</span>
          <div className="mp-spec-options">
            {COLORS.map(c => (
              <button
                key={c}
                className={`mp-color-btn ${selectedColor === c ? 'active' : ''}`}
                style={{ '--c': c }}
                onClick={() => setSelectedColor(c)}
              />
            ))}
          </div>
        </div>
        <div className="mp-spec-group">
          <span className="mp-spec-label">尺码</span>
          <div className="mp-spec-options">
            {SIZES.map(s => (
              <button
                key={s}
                className={`mp-size-btn ${selectedSize === s ? 'active' : ''}`}
                onClick={() => setSelectedSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="mp-detail-footer">
        <button className="mp-footer-btn secondary" onClick={() => onNavigate('c-cart')}>
          <ShoppingCart size={14} /> 加入购物车
        </button>
        <button className="mp-footer-btn primary" onClick={() => onNavigate('c-customize')}>
          立即定制
        </button>
      </div>
    </div>
  )
}
