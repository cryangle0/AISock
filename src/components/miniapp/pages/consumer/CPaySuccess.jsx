import { CheckCircle } from 'lucide-react'

export default function CPaySuccess({ onNavigate }) {
  return (
    <div className="mp-page mp-page-success">
      <div className="mp-success-content">
        <div className="mp-success-icon">
          <CheckCircle size={48} strokeWidth={1.5} />
        </div>
        <h3 className="mp-success-title">支付成功</h3>
        <div className="mp-success-info">
          <div className="mp-success-row">
            <span>订单号</span>
            <span>AS20260512001</span>
          </div>
          <div className="mp-success-row">
            <span>支付金额</span>
            <span className="mp-success-amount">¥166.00</span>
          </div>
        </div>
        <div className="mp-success-actions">
          <button className="mp-footer-btn primary" onClick={() => onNavigate('c-order-detail')}>
            查看订单
          </button>
          <button className="mp-footer-btn secondary" onClick={() => onNavigate('c-home')}>
            继续逛逛
          </button>
        </div>
      </div>
    </div>
  )
}
