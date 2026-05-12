import { useState } from 'react'
import { Heart, ShoppingCart } from 'lucide-react'

const FAVORITES = [
  { id: 1, name: '春日碎花款', price: 28, color: '#fce8ef', stock: true },
  { id: 2, name: '商务条纹款', price: 32, color: '#e8f0fc', stock: true },
  { id: 3, name: '薄荷清新款', price: 26, color: '#eaf6f0', stock: true },
  { id: 4, name: '金色奢华款', price: 38, color: '#fff8e7', stock: false },
  { id: 5, name: '海蓝度假款', price: 30, color: '#e8f0fc', stock: true },
  { id: 6, name: '梦幻大花款', price: 35, color: '#fce8ef', stock: true },
]

export default function CFavorites({ onNavigate }) {
  const [liked, setLiked] = useState(() => new Set(FAVORITES.map(f => f.id)))

  const toggleLike = (id, e) => {
    e.stopPropagation()
    setLiked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const visible = FAVORITES.filter(f => liked.has(f.id))

  return (
    <div className="mp-page mp-page-favorites">
      <div className="mp-fav-header">
        <span>共 {visible.length} 件收藏</span>
      </div>

      {visible.length > 0 ? (
        <div className="mp-product-grid cols-2">
          {visible.map(f => (
            <div key={f.id} className="mp-fav-card">
              <button
                className="mp-fav-img-btn"
                onClick={() => onNavigate('c-detail')}
                disabled={!f.stock}
              >
                <div
                  className="mp-product-img"
                  style={{ background: f.color, opacity: f.stock ? 1 : 0.5 }}
                >
                  <div className="mp-product-placeholder" />
                  {!f.stock && <div className="mp-fav-soldout">已下架</div>}
                </div>
              </button>
              <button
                className="mp-fav-heart"
                onClick={(e) => toggleLike(f.id, e)}
                aria-label="取消收藏"
              >
                <Heart size={13} fill="#d4376b" color="#d4376b" />
              </button>
              <div className="mp-product-info">
                <span className="mp-product-name">{f.name}</span>
                <div className="mp-product-meta">
                  <span className="mp-product-price">¥{f.price}</span>
                  {f.stock && (
                    <button className="mp-fav-cart-btn" aria-label="加入购物车">
                      <ShoppingCart size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mp-empty-state">
          <Heart size={24} strokeWidth={1.2} />
          <p>还没有收藏</p>
          <button className="mp-footer-btn primary" onClick={() => onNavigate('c-home')}>
            去逛逛
          </button>
        </div>
      )}
    </div>
  )
}
