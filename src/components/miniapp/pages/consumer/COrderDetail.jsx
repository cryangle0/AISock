import { Package, Truck, CheckCircle, Clock, Copy } from 'lucide-react'

const STEPS = [
  { label: '已下单', done: true },
  { label: '已付款', done: true },
  { label: '生产中', done: true, active: true },
  { label: '已发货', done: false },
  { label: '已完成', done: false },
]

export default function COrderDetail({ onNavigate }) {
  return (
    <div className="mp-page mp-page-order-detail">
      {/* 状态步骤条 */}
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

      {/* 商品信息 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">
          <Package size={13} /> 商品信息
        </div>
        <div className="mp-od-product">
          <div className="mp-od-product-img" />
          <div className="mp-od-product-info">
            <div className="mp-od-product-name">春日碎花款</div>
            <div className="mp-od-product-spec">M / 粉色 × 2</div>
            <div className="mp-od-product-price">¥56</div>
          </div>
        </div>
      </div>

      {/* 物流信息 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">
          <Truck size={13} /> 物流信息
        </div>
        <div className="mp-od-logistics">
          <div className="mp-od-row">
            <span>物流单号</span>
            <span className="mp-od-copy">SF1234567890 <Copy size={10} /></span>
          </div>
          <div className="mp-od-row">
            <span>收货地址</span>
            <span>杭州市西湖区文一路 123 号</span>
          </div>
        </div>
      </div>

      {/* 价格明细 */}
      <div className="mp-od-section">
        <div className="mp-od-row">
          <span>商品合计</span><span>¥166</span>
        </div>
        <div className="mp-od-row">
          <span>运费</span><span>¥0</span>
        </div>
        <div className="mp-od-row total">
          <span>实付</span><span>¥166</span>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="mp-od-footer">
        <button className="mp-footer-btn secondary" onClick={() => onNavigate('c-home')}>
          再次购买
        </button>
        <button className="mp-footer-btn outline">
          申请售后
        </button>
      </div>
    </div>
  )
}
