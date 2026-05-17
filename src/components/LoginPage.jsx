/**
 * LoginPage —— Web 登录页
 *
 * 视觉参考 21st.dev "animated-characters-login-page"：
 *   - 左面板：几何卡通角色 + 眼睛追踪 / 眨眼 / 输入互动
 *   - 右面板：卡片化登录表单
 *
 * 业务保持不变：手机号 + 验证码（演示用，按钮可输入即过）
 */
import { useMemo, useState } from 'react'
import { Phone, MessageCircle, Eye, EyeOff } from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import AnimatedCharacters from './AnimatedCharacters'
import './LoginPage.css'

export default function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [remember, setRemember] = useState(true)
  const [codeVisible, setCodeVisible] = useState(false)
  const [focused, setFocused] = useState(null)   // 'phone' | 'code' | null
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(
    () => phone.trim().length >= 8 && code.trim().length >= 4,
    [phone, code],
  )

  const isTyping = focused !== null
  const codeMasked  = code.length > 0 && !codeVisible
  const codeVisibleEffective = code.length > 0 && codeVisible

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    if (!canSubmit || loading) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 250))
    setLoading(false)
    onLogin?.({ phone })
  }

  return (
    <div className="lp-root lp-v2">
      {/* —— 左面板：品牌 + 卡通角色 + 法律链接 —— */}
      <aside className="lp-left">
        <header className="lp-left-header">
          <span className="lp-left-logo">
            <BrandLogo size={36}/>
          </span>
          <span className="lp-left-brand">爱花型</span>
        </header>

        <div className="lp-left-stage">
          <AnimatedCharacters
            isTyping={isTyping}
            codeMasked={codeMasked}
            codeVisible={codeVisibleEffective}
          />
        </div>

        <div className="lp-left-bg-grid"/>
        <div className="lp-left-bg-glow lp-left-bg-glow-1"/>
        <div className="lp-left-bg-glow lp-left-bg-glow-2"/>
      </aside>

      {/* —— 右面板：登录卡片 —— */}
      <main className="lp-right">
        <div className="lp-card">
          <div className="lp-mobile-brand">
            <BrandLogo size={32}/>
            <span>爱花型</span>
          </div>

          <div className="lp-heading">
            <h1>欢迎回来</h1>
            <p>输入手机号和验证码，开始你的袜款设计</p>
          </div>

          <form className="lp-form" onSubmit={handleSubmit}>
            <label className="lp-field">
              <span className="lp-label">手机号</span>
              <div className={`lp-input ${focused === 'phone' ? 'focus' : ''}`}>
                <Phone size={15} strokeWidth={1.6}/>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused(null)}
                  autoComplete="off"
                />
              </div>
            </label>

            <label className="lp-field">
              <span className="lp-label">验证码</span>
              <div className={`lp-input ${focused === 'code' ? 'focus' : ''}`}>
                <MessageCircle size={15} strokeWidth={1.6}/>
                <input
                  type={codeVisible ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="请输入验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onFocus={() => setFocused('code')}
                  onBlur={() => setFocused(null)}
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setCodeVisible((v) => !v)}
                  aria-label={codeVisible ? '隐藏验证码' : '显示验证码'}
                >
                  {codeVisible
                    ? <EyeOff size={16} strokeWidth={1.6}/>
                    : <Eye size={16} strokeWidth={1.6}/>}
                </button>
                <button
                  type="button"
                  className="lp-code-btn"
                  onClick={() => setCode('1234')}
                >
                  获取验证码
                </button>
              </div>
            </label>

            <div className="lp-row">
              <label className="lp-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="lp-check-box"/>
                <span>30 天内自动登录</span>
              </label>
              <a className="lp-link" href="#" onClick={(e) => e.preventDefault()}>
                忘记账号？
              </a>
            </div>

            <button
              type="submit"
              className={`lp-submit ${canSubmit && !loading ? 'enabled' : ''}`}
              disabled={!canSubmit || loading}
            >
              {loading ? '登录中…' : '登录'}
            </button>
          </form>

          <div className="lp-divider"><span>或</span></div>

          <button
            type="button"
            className="lp-wechat"
            onClick={() => onLogin?.({ phone: 'wechat' })}
          >
            <WechatIcon/> 微信扫码登录
          </button>
        </div>

        <div className="lp-copy">爱花型袜业 · 2026</div>
      </main>
    </div>
  )
}

function WechatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#07c160">
      <path d="M9 7c-3.866 0-7 2.462-7 5.5 0 1.74 1.029 3.291 2.633 4.301L4 19l2.5-1.4c.78.252 1.62.4 2.5.4 3.866 0 7-2.462 7-5.5S12.866 7 9 7zm-3 4.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      <path d="M22 14.5c0-2.502-2.547-4.5-5.694-4.5h-.118c.205.475.32.987.32 1.5 0 2.484-2.241 4.5-5 4.5-.241 0-.479-.014-.713-.04C11.6 17.84 13.616 19 16 19c.74 0 1.443-.108 2.097-.305L20 19.7l-.51-1.776A4.39 4.39 0 0 0 22 14.5zm-7-1a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm5 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z"/>
    </svg>
  )
}
