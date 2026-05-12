import { useState } from 'react'
import { Search } from 'lucide-react'

const STATUS_TABS = ['全部', '待付款', '待发货', '待收货', '已完成']

const ORDERS = [
  { id: 1, no: 'AS20260512001', name: '春日碎花款', spec: 'M / 粉色 × 2', price: 56, status: '待付款', color: '#fce8ef' },
  { id: 2, no: 'AS20260510002', name: '商务条纹款', spec: 'L / 黑色 × 1', price: 32, status: '待发货', color: '#e8f0fc' },
  { id: 3, no: 'AS20260508007', name: '运动透气款', spec: 'M / 白色 × 3', price: 78, status: '待收货', color: '#eaf6f0' },
  { id: 4, no: 'AS20260502003', name: '梦幻大花款', spec: 'S / 粉色 × 1', price: 35, status: '已完成', color: '#fce8ef' },
  { id: 5, no: 'AS20260428004', name: '海蓝度假款', spec: 'M / 蓝色 × 2', price: 60, status: '已完成', color: '#e8f0fc' },
]

const STATUS_ACTIONS = {
  '待付款': [['取消', 'outline'], ['去付款', 'primary']],
  '待发货': [['提醒发货', 'secondary']],
  '待收货': [['查看物流', 'secondary'], ['确认收货', 'primary']],
  '已完成': [['申请售后', 'outline'], ['再次购买', 'primary']],
}

export default function CMyOrders({ onNavigate }) {
  const [tab, setTab] = useState('全部')
  const [kw, setKw] = useState('')

  const filtered = ORDERS
    .filter(o => tab === '全部' || o.status === tab)
    .filter(o => !kw || o.name.includes(kw) || o.no.includes(kw))

  return (
    <div className="mp-page mp-page-my-orders">
      {/* 搜索 */}
      <div className="mp-search-bar">
        <Search size={12} />
        <input
          type="text"
          placeholder="搜索订单号或商品名"
          value={kw}
          onChange={e => setKw(e.target.value)}
        />
      </div>

      {/* 状态 tab */}
      <div className="mp-filter-tabs">
        {STATUS_TABS.map(t => (
          <button
            key={t}
            className={`mp-filter-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      <div className="mp-myorder-list">
        {filtered.map(o => (
          <div key={o.id} className="mp-myorder-card">
            <div className="mp-myorder-head">
              <span className="mp-myorder-no">{o.no}</span>
              <span className={`mp-myorder-status s-${o.status}`}>{o.status}</span>
            </div>
            <button
              className="mp-myorder-body"
              onClick={() => onNavigate('c-order-detail')}
            >
              <div className="mp-myorder-thumb" style={{ background: o.color }} />
              <div className="mp-myorder-info">
                <div className="mp-myorder-name">{o.name}</div>
                <div className="mp-myorder-spec">{o.spec}</div>
              </div>
              <div className="mp-myorder-price">¥{o.price}</div>
            </button>
            <div className="mp-myorder-actions">
              {(STATUS_ACTIONS[o.status] || []).map(([label, variant]) => (
                <button key={label} className={`mp-myorder-btn ${variant}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mp-empty-state">
          <p>暂无{tab !== '全部' ? tab + '的' : ''}订单</p>
        </div>
      )}
    </div>
  )
}
