import { Package, Heart, MapPin, Ticket, Headphones, Settings } from 'lucide-react'

const ORDER_STATUS = [
  { label: '待付款', count: 1 },
  { label: '待发货', count: 2 },
  { label: '待收货', count: 1 },
  { label: '已完成', count: 5 },
]

export default function CMine({ onNavigate }) {
  return (
    <div className="mp-page mp-page-mine">
      {/* 用户信息 */}
      <div className="mp-mine-header">
        <div className="mp-mine-avatar">花</div>
        <div className="mp-mine-info">
          <div className="mp-mine-name">花花同学</div>
          <div className="mp-mine-level">VIP 会员 · 积分 2,680</div>
        </div>
      </div>

      {/* 订单入口 */}
      <div className="mp-mine-section">
        <div className="mp-mine-section-header">
          <span>我的订单</span>
          <button className="mp-section-more" onClick={() => onNavigate('c-order-detail')}>全部 →</button>
        </div>
        <div className="mp-order-status-grid">
          {ORDER_STATUS.map(s => (
            <button key={s.label} className="mp-order-status-item" onClick={() => onNavigate('c-order-detail')}>
              <Package size={18} strokeWidth={1.4} />
              {s.count > 0 && <span className="mp-status-badge">{s.count}</span>}
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 功能列表 */}
      <div className="mp-mine-section">
        <div className="mp-mine-menu">
          <button className="mp-mine-menu-item">
            <Heart size={15} /> <span>我的收藏</span>
          </button>
          <button className="mp-mine-menu-item">
            <MapPin size={15} /> <span>收货地址</span>
          </button>
          <button className="mp-mine-menu-item">
            <Ticket size={15} /> <span>优惠券</span>
          </button>
          <button className="mp-mine-menu-item">
            <Headphones size={15} /> <span>联系客服</span>
          </button>
          <button className="mp-mine-menu-item">
            <Settings size={15} /> <span>设置</span>
          </button>
        </div>
      </div>
    </div>
  )
}
