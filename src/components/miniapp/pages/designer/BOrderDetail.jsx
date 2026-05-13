/**
 * BOrderDetail — 订单详情（基于真实订单数据）
 * 状态进度条 + 设计稿大图 + 尺码分布 + 支付/物流
 */
import { useMemo } from 'react'
import { Copy, Headphones, CheckCircle, Clock, Truck, Package } from 'lucide-react'

const STATUS_FLOW = ['待生产', '生产中', '已发货', '已完成']

const STATUS_ICONS = {
  '待生产': Clock,
  '生产中': Package,
  '已发货': Truck,
  '已完成': CheckCircle,
}

export default function BOrderDetail({ orders = [], params = {}, onNavigate }) {
  const order = useMemo(
    () => orders.find((o) => o.id === params.orderId) || orders[0],
    [orders, params.orderId],
  )

  if (!order) {
    return (
      <div className="mp-page mp-page-order-detail">
        <div className="mp-empty-state">
          <p>订单不存在</p>
          <button className="mp-cta-primary" onClick={() => onNavigate?.('b-orders')}>
            返回列表
          </button>
        </div>
      </div>
    )
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status)

  return (
    <div className="mp-page mp-page-order-detail">
      {/* 状态进度 */}
      <div className="mp-od-section">
        <div className="mp-steps-v2">
          {STATUS_FLOW.map((label, i) => {
            const Icon = STATUS_ICONS[label]
            const done = i < currentIdx
            const active = i === currentIdx
            return (
              <div
                key={label}
                className={`mp-step-v2 ${done ? 'done' : ''} ${active ? 'active' : ''}`}
              >
                <div className="mp-step-dot-v2"><Icon size={12} /></div>
                <span>{label}</span>
                {i < STATUS_FLOW.length - 1 && <div className="mp-step-line-v2" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* 设计稿 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">设计稿</div>
        <div className="mp-od-design">
          {order.coverImage
            ? <img src={order.coverImage} alt={order.designName} />
            : <div className="mp-od-design-empty">无预览图</div>}
        </div>
        <div className="mp-od-row">
          <span>设计名称</span><span>{order.designName}</span>
        </div>
        <div className="mp-od-row">
          <span>材质</span><span>{order.material}</span>
        </div>
        {order.craft && (
          <div className="mp-od-row">
            <span>工艺</span><span>{order.craft}</span>
          </div>
        )}
      </div>

      {/* 尺码分布 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">尺码分布 · 共 {order.total} 双</div>
        <div className="mp-size-dist">
          {Object.entries(order.sizes || {}).map(([s, qty]) => {
            const percent = order.total ? Math.round((qty / order.total) * 100) : 0
            return (
              <div key={s} className="mp-dist-row">
                <span className="mp-dist-size">{s}</span>
                <div className="mp-dist-bar">
                  <div className="mp-dist-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="mp-dist-qty">{qty} 双 · {percent}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 支付/物流 */}
      <div className="mp-od-section">
        <div className="mp-od-row">
          <span>订单号</span>
          <span className="mp-od-copy">{order.no} <Copy size={10} /></span>
        </div>
        <div className="mp-od-row">
          <span>下单时间</span><span>{order.createdAt}</span>
        </div>
        {order.payment?.method && (
          <div className="mp-od-row">
            <span>支付方式</span><span>{order.payment.method}</span>
          </div>
        )}
        {order.payment?.paidAt && (
          <div className="mp-od-row">
            <span>支付时间</span><span>{order.payment.paidAt}</span>
          </div>
        )}
        {order.contact && (
          <div className="mp-od-row">
            <span>收件人</span><span>{order.contact} {order.phone}</span>
          </div>
        )}
        {order.address && (
          <div className="mp-od-row">
            <span>收货地址</span><span style={{ textAlign: 'right', maxWidth: '60%' }}>{order.address}</span>
          </div>
        )}
        {order.note && (
          <div className="mp-od-row">
            <span>备注</span><span>{order.note}</span>
          </div>
        )}
        {order.payment?.amount != null && (
          <div className="mp-od-row total">
            <span>订单金额</span>
            <span>¥{Number(order.payment.amount).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* 操作 */}
      <div className="mp-od-footer">
        <button className="mp-cta-secondary">
          <Headphones size={12} /> 联系客服
        </button>
        <button
          className="mp-cta-primary"
          onClick={() => onNavigate?.('b-orders')}
        >
          返回列表
        </button>
      </div>
    </div>
  )
}
