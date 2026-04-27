import './Orders.css'
import { Search, Package, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

const STATUS_STYLE = {
  '待生产': 'pending',
  '生产中': 'progress',
  '已发货': 'shipped',
  '已完成': 'done',
}

export default function Orders({ orders }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')

  const STATUS_TABS = ['全部', '待生产', '生产中', '已发货', '已完成']
  const filtered = orders.filter((o) => {
    if (statusFilter !== '全部' && o.status !== statusFilter) return false
    if (query && !o.no.includes(query) && !(o.designName || '').includes(query)) return false
    return true
  })

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">订单管理</h1>
          <p className="page-sub">共 {orders.length} 笔订单</p>
        </div>
        <div className="page-search">
          <Search size={13} strokeWidth={1.6}/>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索订单号 / 设计名称"/>
        </div>
      </header>

      <div className="status-tabs">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            className={`status-tab ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s}
            {s !== '全部' && (
              <span className="status-tab-count">
                {orders.filter((o) => o.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="orders-table">
        <div className="orders-row orders-head">
          <span>订单号</span>
          <span>设计名称</span>
          <span>尺码 / 数量</span>
          <span>材质 / 工艺</span>
          <span>支付</span>
          <span>状态</span>
          <span>下单时间</span>
        </div>
        {filtered.map((o) => (
          <div key={o.id} className="orders-row">
            <span className="order-no">{o.no}</span>
            <span>{o.designName}</span>
            <span className="order-size">
              {Object.entries(o.sizes || {}).map(([k, v]) => (
                <span key={k} className="size-pill">{k}×{v}</span>
              ))}
              <span className="size-total-pill">共 {o.total} 双</span>
            </span>
            <span className="order-mat-craft">
              <span className="mat-label">{o.material}</span>
              {o.craft && <span className="craft-label">{o.craft}</span>}
            </span>
            <span className="order-pay">
              {o.payment ? (
                <>
                  <span className="pay-tag paid">
                    <CheckCircle2 size={11} strokeWidth={2}/>
                    {o.payment.method}
                  </span>
                  {o.payment.amount != null && (
                    <span className="pay-amount-label">¥ {Number(o.payment.amount).toFixed(2)}</span>
                  )}
                </>
              ) : (
                <span className="pay-tag unpaid">未支付</span>
              )}
            </span>
            <span>
              <span className={`status-badge ${STATUS_STYLE[o.status] || ''}`}>{o.status}</span>
            </span>
            <span className="order-time">{o.createdAt}</span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="orders-empty">
            <Package size={28} strokeWidth={1.4}/>
            <span>暂无订单</span>
          </div>
        )}
      </div>
    </div>
  )
}
