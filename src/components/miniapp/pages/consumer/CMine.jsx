import { Package, Heart, MapPin, Ticket, Headphones, Settings, Clock, Truck, CheckCircle2, CreditCard } from 'lucide-react'

// 订单 4 状态入口（每个映射到"我的订单"的具体 tab 或直接到详情）
const ORDER_STATUS = [
  { label: '待付款', count: 1, icon: CreditCard, tab: '待付款' },
  { label: '待发货', count: 2, icon: Clock,      tab: '待发货' },
  { label: '待收货', count: 1, icon: Truck,      tab: '待收货' },
  { label: '已完成', count: 5, icon: CheckCircle2, tab: '已完成' },
]

// 功能菜单项统一配置
const MENU_ITEMS = [
  { key: 'c-favorites', label: '我的收藏', icon: Heart,      tip: '12 件' },
  { key: 'c-addresses', label: '收货地址', icon: MapPin,     tip: '3 个' },
  { key: 'c-coupons',   label: '优惠券',   icon: Ticket,     tip: '3 张可用', highlight: true },
  { key: 'c-support',   label: '联系客服', icon: Headphones, tip: '9:00-22:00 在线' },
  { key: 'c-settings',  label: '设置',     icon: Settings,   tip: '' },
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
          <button className="mp-section-more" onClick={() => onNavigate('c-my-orders')}>
            全部订单 →
          </button>
        </div>
        <div className="mp-order-status-grid">
          {ORDER_STATUS.map(s => (
            <button
              key={s.label}
              className="mp-order-status-item"
              onClick={() => onNavigate('c-my-orders')}
            >
              <s.icon size={18} strokeWidth={1.4} />
              {s.count > 0 && <span className="mp-status-badge">{s.count}</span>}
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 功能列表 */}
      <div className="mp-mine-section">
        <div className="mp-mine-menu">
          {MENU_ITEMS.map(m => (
            <button
              key={m.key}
              className="mp-mine-menu-item"
              onClick={() => onNavigate(m.key)}
            >
              <m.icon size={15} />
              <span className="mp-mine-menu-label">{m.label}</span>
              {m.tip && (
                <span className={`mp-mine-menu-tip ${m.highlight ? 'highlight' : ''}`}>
                  {m.tip}
                </span>
              )}
              <span className="mp-mine-menu-arrow">›</span>
            </button>
          ))}
        </div>
      </div>

      {/* 底部版本信息 */}
      <div className="mp-mine-footer">爱花型 v1.0 · 为你而设计</div>
    </div>
  )
}

// 导出其他子页可能会用到的常量（如需外部访问）
export { ORDER_STATUS, MENU_ITEMS }
