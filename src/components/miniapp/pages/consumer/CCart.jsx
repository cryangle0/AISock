import { Trash2 } from 'lucide-react'

const CART_ITEMS = [
  { id: 1, name: '春日碎花款', spec: 'M / 粉色', price: 28, qty: 2, isCustom: true },
  { id: 2, name: '商务条纹款', spec: 'L / 黑色', price: 32, qty: 1, isCustom: false },
  { id: 3, name: '运动透气款', spec: 'M / 白色', price: 26, qty: 3, isCustom: false },
]

export default function CCart({ onNavigate }) {
  const total = CART_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <div className="mp-page mp-page-cart">
      <div className="mp-cart-list">
        {CART_ITEMS.map(item => (
          <div key={item.id} className="mp-cart-item">
            <div className="mp-cart-img">
              {item.isCustom && <span className="mp-cart-badge">定制</span>}
            </div>
            <div className="mp-cart-info">
              <div className="mp-cart-name">{item.name}</div>
              <div className="mp-cart-spec">{item.spec}</div>
              <div className="mp-cart-bottom">
                <span className="mp-cart-price">¥{item.price}</span>
                <span className="mp-cart-qty">×{item.qty}</span>
              </div>
            </div>
            <button className="mp-cart-delete">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* 底部结算 */}
      <div className="mp-cart-footer">
        <div className="mp-cart-total">
          <span>合计</span>
          <span className="mp-cart-total-price">¥{total}</span>
        </div>
        <button className="mp-footer-btn primary" onClick={() => onNavigate('c-order')}>
          结算 ({CART_ITEMS.length})
        </button>
      </div>
    </div>
  )
}
