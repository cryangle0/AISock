import { Copy, Headphones, CheckCircle, Clock } from 'lucide-react'

const STEPS = [
  { label: '已下单', done: true },
  { label: '待生产', done: true },
  { label: '生产中', done: true, active: true },
  { label: '已发货', done: false },
  { label: '已完成', done: false },
]

const SIZE_DIST = [
  { size: 'S', qty: 20, percent: 20 },
  { size: 'M', qty: 50, percent: 50 },
  { size: 'L', qty: 30, percent: 30 },
]

export default function BOrderDetail({ onNavigate }) {
  return (
    <div className="mp-page mp-page-order-detail">
      {/* 状态进度 */}
      <div className="mp-steps">
        {STEPS.map((step, i) => (
          <div key={step.label} className={`mp-step ${step.done ? 'done' : ''} ${step.active ? 'active' : ''}`}>
            <div className="mp-step-dot">
              {step.done ? <CheckCircle size={12} /> : <Clock size={12} />}
            </div>
            <span className="mp-step-label">{step.label}</span>
            {i < STEPS.length - 1 && <div className="mp-step-line" />}
          </div>
        ))}
      </div>

      {/* 设计稿大图 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">设计稿</div>
        <div className="mp-design-big" />
        <div className="mp-od-row">
          <span>材质</span><span>纯棉 · 80%</span>
        </div>
        <div className="mp-od-row">
          <span>工艺</span><span>UV 印花</span>
        </div>
      </div>

      {/* 尺码分布 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">尺码分布 · 共 100 双</div>
        <div className="mp-size-dist">
          {SIZE_DIST.map(s => (
            <div key={s.size} className="mp-dist-row">
              <span className="mp-dist-size">{s.size}</span>
              <div className="mp-dist-bar">
                <div className="mp-dist-fill" style={{ width: `${s.percent}%` }} />
              </div>
              <span className="mp-dist-qty">{s.qty} 双</span>
            </div>
          ))}
        </div>
      </div>

      {/* 支付 + 物流 */}
      <div className="mp-od-section">
        <div className="mp-od-row">
          <span>订单号</span>
          <span className="mp-od-copy">AS20260512001 <Copy size={10} /></span>
        </div>
        <div className="mp-od-row">
          <span>下单时间</span><span>2 小时前</span>
        </div>
        <div className="mp-od-row">
          <span>支付方式</span><span>微信支付</span>
        </div>
        <div className="mp-od-row">
          <span>物流单号</span>
          <span className="mp-od-copy">待发货</span>
        </div>
        <div className="mp-od-row total">
          <span>订单金额</span><span>¥2,800</span>
        </div>
      </div>

      {/* 操作 */}
      <div className="mp-od-footer">
        <button className="mp-footer-btn secondary">
          <Headphones size={13} /> 联系客服
        </button>
        <button className="mp-footer-btn outline" onClick={() => onNavigate('b-orders')}>
          返回列表
        </button>
      </div>
    </div>
  )
}
