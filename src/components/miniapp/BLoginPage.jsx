/**
 * BLoginPage —— 小程序登录页
 *
 * 风格：与小程序整体棕橙暖色系一致；放在 PhoneShell 内部，
 * 隐藏 tabbar，登录成功后才进入 3 个 tab 页面。
 */
import { useState } from 'react'
import { Phone, MessageCircle, Sparkles } from 'lucide-react'
import { BrandLogo } from '../BrandLogo'

export default function BLoginPage({ onLogin }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const canSubmit = phone.trim().length >= 8 && code.trim().length >= 4

  const handleSubmit = () => {
    if (!canSubmit) return
    onLogin?.({ phone: phone.trim() })
  }

  return (
    <div className="mp-login-screen">
      {/* —— 顶部品牌区 —— */}
      <div className="mp-login-hero">
        <div className="mp-login-logo">
          <BrandLogo size={56}/>
        </div>
        <div className="mp-login-brand">爱花型</div>
        <div className="mp-login-slogan">创意由你，花型随心</div>
      </div>

      {/* —— 表单 —— */}
      <div className="mp-login-card">
        <div className="mp-login-tabs">
          <span className="mp-login-tab active">手机号登录</span>
        </div>

        <div className="mp-login-field">
          <Phone size={13} strokeWidth={1.6}/>
          <input
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            maxLength={11}
          />
        </div>

        <div className="mp-login-field">
          <MessageCircle size={13} strokeWidth={1.6}/>
          <input
            placeholder="请输入验证码"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
          />
          <button className="mp-login-code-btn" onClick={() => setCode('1234')}>
            获取验证码
          </button>
        </div>

        {/* —— 协议提示（紧贴"登录"按钮上方） —— */}
        <div className="mp-login-agreement">
          登录即代表同意 <span>《用户协议》</span> 和 <span>《隐私政策》</span>
        </div>

        <button
          className={`mp-login-submit ${canSubmit ? 'active' : ''}`}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          登录
        </button>

        <div className="mp-login-divider"><span>或</span></div>

        <button className="mp-login-wechat" onClick={() => onLogin?.({ phone: 'wechat' })}>
          <WechatIcon/> 微信登录
        </button>

        <div className="mp-login-tip">
          <Sparkles size={10} strokeWidth={1.8}/>
          登录后体验 AI 同款延展、亲子袜等专属功能
        </div>
      </div>

      <div className="mp-login-footer">
        爱花型袜业 · 2026
      </div>
    </div>
  )
}

function WechatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 7c-3.866 0-7 2.462-7 5.5 0 1.74 1.029 3.291 2.633 4.301L4 19l2.5-1.4c.78.252 1.62.4 2.5.4 3.866 0 7-2.462 7-5.5S12.866 7 9 7zm-3 4.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      <path d="M22 14.5c0-2.502-2.547-4.5-5.694-4.5h-.118c.205.475.32.987.32 1.5 0 2.484-2.241 4.5-5 4.5-.241 0-.479-.014-.713-.04C11.6 17.84 13.616 19 16 19c.74 0 1.443-.108 2.097-.305L20 19.7l-.51-1.776A4.39 4.39 0 0 0 22 14.5zm-7-1a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm5 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z"/>
    </svg>
  )
}
