import { useState } from 'react'
import { Ticket, Gift } from 'lucide-react'

const TABS = ['可用', '已用', '已过期']

const COUPONS = {
  '可用': [
    { id: 1, amount: 10, threshold: 99, title: '新人立减券', scope: '全场通用', expire: '2026-05-31' },
    { id: 2, amount: 20, threshold: 199, title: '春日焕新券', scope: '限定制款', expire: '2026-06-15' },
    { id: 3, amount: 5, threshold: 50, title: '无门槛礼券', scope: '全场通用', expire: '2026-05-20' },
  ],
  '已用': [
    { id: 4, amount: 15, threshold: 99, title: '首单礼券', scope: '全场通用', expire: '已于 2026-04-18 使用' },
  ],
  '已过期': [
    { id: 5, amount: 30, threshold: 299, title: '满减大券', scope: '限商城', expire: '已过期' },
  ],
}

export default function CCoupons({ onNavigate }) {
  const [tab, setTab] = useState('可用')
  const list = COUPONS[tab] || []

  return (
    <div className="mp-page mp-page-coupons">
      <div className="mp-filter-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`mp-filter-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {tab === t && COUPONS[t]?.length > 0 && (
              <span className="mp-filter-count-inline">{COUPONS[t].length}</span>
            )}
          </button>
        ))}
      </div>

      {list.length > 0 ? (
        <div className="mp-coupon-list">
          {list.map(c => (
            <div key={c.id} className={`mp-coupon-card ${tab !== '可用' ? 'disabled' : ''}`}>
              <div className="mp-coupon-amount">
                <span className="mp-coupon-unit">¥</span>
                <span className="mp-coupon-num">{c.amount}</span>
                <span className="mp-coupon-condition">满 {c.threshold} 可用</span>
              </div>
              <div className="mp-coupon-info">
                <div className="mp-coupon-title">{c.title}</div>
                <div className="mp-coupon-scope">{c.scope}</div>
                <div className="mp-coupon-expire">{c.expire}</div>
              </div>
              {tab === '可用' && (
                <button
                  className="mp-coupon-use"
                  onClick={() => onNavigate('c-home')}
                >
                  去使用
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mp-empty-state">
          <Ticket size={24} strokeWidth={1.2} />
          <p>暂无{tab}的优惠券</p>
        </div>
      )}

      <button className="mp-coupon-center-btn">
        <Gift size={13} /> 领券中心
      </button>
    </div>
  )
}
