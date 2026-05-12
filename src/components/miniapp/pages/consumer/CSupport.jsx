import { MessageCircle, Phone, Mail, ChevronRight } from 'lucide-react'

const FAQ_ITEMS = [
  { q: '如何查询订单物流？', hint: '我的 → 订单详情 → 查看物流' },
  { q: '定制款能退换货吗？', hint: '非质量问题不支持退换' },
  { q: '多久可以发货？', hint: '现货 48 小时、定制款 7 天' },
  { q: '如何申请发票？', hint: '订单详情 → 申请发票' },
  { q: '忘记密码怎么办？', hint: '登录页 → 手机号验证码重置' },
]

const SELF_SERVICE = [
  { label: '订单查询', icon: '📦' },
  { label: '物流追踪', icon: '🚚' },
  { label: '退换货', icon: '↩️' },
  { label: '发票服务', icon: '🧾' },
]

export default function CSupport() {
  return (
    <div className="mp-page mp-page-support">
      {/* 快捷自助 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">自助服务</div>
        <div className="mp-self-service-grid">
          {SELF_SERVICE.map(s => (
            <button key={s.label} className="mp-self-service-item">
              <span className="mp-self-icon">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 常见问题 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">常见问题</div>
        <div className="mp-faq-list">
          {FAQ_ITEMS.map(f => (
            <button key={f.q} className="mp-faq-item">
              <div className="mp-faq-content">
                <div className="mp-faq-q">{f.q}</div>
                <div className="mp-faq-hint">{f.hint}</div>
              </div>
              <ChevronRight size={13} color="#c5c9d1" />
            </button>
          ))}
        </div>
      </div>

      {/* 联系方式 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">联系我们</div>

        <button className="mp-contact-primary">
          <MessageCircle size={16} />
          <div className="mp-contact-primary-text">
            <div>在线客服</div>
            <span>服务时间 9:00 - 22:00</span>
          </div>
          <span className="mp-contact-online">在线</span>
        </button>

        <div className="mp-contact-list">
          <div className="mp-contact-item">
            <Phone size={13} />
            <span>客服电话</span>
            <span className="mp-contact-val">400-888-1234</span>
          </div>
          <div className="mp-contact-item">
            <Mail size={13} />
            <span>客服邮箱</span>
            <span className="mp-contact-val">support@aihuaxing.com</span>
          </div>
        </div>
      </div>
    </div>
  )
}
