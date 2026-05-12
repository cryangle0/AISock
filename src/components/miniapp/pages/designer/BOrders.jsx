import { useState } from 'react'

const STATUS_TABS = ['全部', '待生产', '生产中', '已发货', '已完成']

const ORDERS = [
  { id: 1, no: 'AS20260512001', design: '春日碎花款', qty: 100, status: '生产中', time: '2 小时前', color: '#fce8ef' },
  { id: 2, no: 'AS20260510003', design: '商务条纹款', qty: 180, status: '待生产', time: '昨天', color: '#e8f0fc' },
  { id: 3, no: 'AS20260508007', design: '运动透气款', qty: 60, status: '已发货', time: '3 天前', color: '#eaf6f0' },
  { id: 4, no: 'AS20260505002', design: '梦幻大花款', qty: 120, status: '已完成', time: '1 周前', color: '#fce8ef' },
  { id: 5, no: 'AS20260502009', design: '海蓝度假款', qty: 80, status: '生产中', time: '10 天前', color: '#e8f0fc' },
]

const STATUS_COLORS = {
  '待生产': 'pending',
  '生产中': 'progress',
  '已发货': 'shipped',
  '已完成': 'done',
}

export default function BOrders({ onNavigate }) {
  const [tab, setTab] = useState('全部')

  const filtered = tab === '全部' ? ORDERS : ORDERS.filter(o => o.status === tab)

  return (
    <div className="mp-page mp-page-orders">
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

      <div className="mp-orders-list">
        {filtered.map(o => (
          <button key={o.id} className="mp-order-card-item" onClick={() => onNavigate('b-order-detail')}>
            <div className="mp-order-card-head">
              <span className="mp-order-card-no">{o.no}</span>
              <span className={`mp-order-card-status ${STATUS_COLORS[o.status]}`}>{o.status}</span>
            </div>
            <div className="mp-order-card-body">
              <div className="mp-order-card-thumb" style={{ background: o.color }} />
              <div className="mp-order-card-info">
                <div className="mp-order-card-name">{o.design}</div>
                <div className="mp-order-card-meta">
                  <span>{o.qty} 双</span>
                  <span>{o.time}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mp-empty-state">
          <p>暂无{tab}的订单</p>
        </div>
      )}
    </div>
  )
}
