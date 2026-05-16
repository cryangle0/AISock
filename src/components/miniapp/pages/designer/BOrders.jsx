/**
 * BOrders — 订单管理（对齐 web Orders）
 * 状态 tab + 搜索 + 真实订单数据
 */
import { useMemo, useState } from 'react'
import { Search, Package, Paperclip } from 'lucide-react'

const STATUS_TABS = ['全部', '待生产', '生产中', '已发货', '已完成']

export default function BOrders({ orders = [], onNavigate }) {
  const [tab, setTab] = useState('全部')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => orders.filter((o) => {
    if (tab !== '全部' && o.status !== tab) return false
    if (query && !o.no?.includes(query) && !(o.designName || '').includes(query)) return false
    return true
  }), [orders, tab, query])

  const counts = useMemo(() => {
    const map = {}
    for (const t of STATUS_TABS) {
      map[t] = t === '全部' ? orders.length : orders.filter((o) => o.status === t).length
    }
    return map
  }, [orders])

  return (
    <div className="mp-page mp-page-orders">
      <div className="mp-search-bar">
        <Search size={12} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索订单号 / 设计名称"
        />
      </div>

      <div className="mp-filter-tabs">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            className={`mp-filter-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {counts[t] > 0 && <span className="mp-filter-badge">{counts[t]}</span>}
          </button>
        ))}
      </div>

      <div className="mp-orders-list">
        {filtered.map((o) => (
          <OrderCard key={o.id} order={o} onClick={() => onNavigate?.('b-order-detail', { orderId: o.id })} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mp-empty-state">
          <Package size={28} strokeWidth={1.4} />
          <p>{orders.length === 0 ? '暂无订单' : `暂无${tab}的订单`}</p>
        </div>
      )}
    </div>
  )
}

const STATUS_CLASS = {
  '待生产': 'pending',
  '生产中': 'progress',
  '已发货': 'shipped',
  '已完成': 'done',
}

function OrderCard({ order, onClick }) {
  const attachCount = order.attachments?.length || 0
  return (
    <button className="mp-order-card-v2" onClick={onClick}>
      <div className="mp-order-card-head">
        <span className="mp-order-card-no">{order.no}</span>
        <span className={`mp-order-status ${STATUS_CLASS[order.status] || ''}`}>
          {order.status}
        </span>
      </div>
      <div className="mp-order-card-body">
        <div className="mp-order-card-thumb">
          {order.coverImage
            ? <img src={order.coverImage} alt={order.designName} />
            : <div className="mp-order-card-thumb-empty" />}
        </div>
        <div className="mp-order-card-info">
          <div className="mp-order-card-name">{order.designName}</div>
          <div className="mp-order-card-sub">
            {order.material} · {order.craft || ''} · {order.total} 双
          </div>
          <div className="mp-order-card-time">{order.createdAt}</div>
          {(order.note || attachCount > 0) && (
            <div className="mp-order-card-meta">
              {attachCount > 0 && (
                <span className="mp-order-card-attach">
                  <Paperclip size={10} strokeWidth={1.8} />{attachCount}
                </span>
              )}
              {order.note && (
                <span className="mp-order-card-note">{order.note}</span>
              )}
            </div>
          )}
        </div>
        <div className="mp-order-card-amount">
          {order.payment?.amount != null
            ? `¥${Number(order.payment.amount).toFixed(2)}`
            : '未支付'}
        </div>
      </div>
    </button>
  )
}
