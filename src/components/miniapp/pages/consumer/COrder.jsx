import { MapPin, CreditCard } from 'lucide-react'

export default function COrder({ onNavigate }) {
  return (
    <div className="mp-page mp-page-order">
      {/* 收货地址 */}
      <div className="mp-order-section">
        <div className="mp-order-address">
          <MapPin size={14} className="mp-order-icon" />
          <div className="mp-address-info">
            <div className="mp-address-name">张三 · 138****8888</div>
            <div className="mp-address-detail">杭州市西湖区文一路 123 号 3 栋 501</div>
          </div>
          <span className="mp-address-arrow">›</span>
        </div>
      </div>

      {/* 订单明细 */}
      <div className="mp-order-section">
        <div className="mp-order-section-title">订单明细</div>
        <div className="mp-order-items">
          <div className="mp-order-item-row">
            <span>春日碎花款 × 2</span>
            <span>¥56</span>
          </div>
          <div className="mp-order-item-row">
            <span>商务条纹款 × 1</span>
            <span>¥32</span>
          </div>
          <div className="mp-order-item-row">
            <span>运动透气款 × 3</span>
            <span>¥78</span>
          </div>
        </div>
        <div className="mp-order-divider" />
        <div className="mp-order-item-row total">
          <span>商品合计</span>
          <span>¥166</span>
        </div>
        <div className="mp-order-item-row">
          <span>运费</span>
          <span className="mp-free">免运费</span>
        </div>
      </div>

      {/* 支付方式 */}
      <div className="mp-order-section">
        <div className="mp-order-section-title">支付方式</div>
        <div className="mp-payment-options">
          <label className="mp-payment-option active">
            <CreditCard size={14} />
            <span>微信支付</span>
            <div className="mp-radio checked" />
          </label>
          <label className="mp-payment-option">
            <CreditCard size={14} />
            <span>支付宝</span>
            <div className="mp-radio" />
          </label>
        </div>
      </div>

      {/* 底部 */}
      <div className="mp-order-footer">
        <div className="mp-order-total">
          <span>应付</span>
          <span className="mp-order-total-price">¥166</span>
        </div>
        <button className="mp-footer-btn primary" onClick={() => onNavigate('c-pay-success')}>
          提交订单
        </button>
      </div>
    </div>
  )
}
