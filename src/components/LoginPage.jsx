import { useState, useMemo } from 'react'
import './LoginPage.css'
import { BrandLogo } from './BrandLogo'

function VisionRings() {
  return (
    <div className="lp-rings-scene">
      <div className="lp-ring lp-ring-1"/>
      <div className="lp-ring lp-ring-2"/>
      <div className="lp-ring lp-ring-3"/>
      <div className="lp-ring lp-ring-4"/>
    </div>
  )
}

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('sms')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const canSubmit = useMemo(() => phone.trim().length >= 8 && code.trim().length >= 4, [phone, code])

  return (
    <div className="lp-root">
      {/* 左侧品牌面板 */}
      <div className="lp-left">
        <VisionRings/>
        <div className="lp-glow lp-glow-bottom"/>
        <div className="lp-glow lp-glow-top"/>

        <div className="lp-left-inner">
          <div className="lp-brand">
            <div className="lp-brand-logo">
              <BrandLogo size={46}/>
            </div>
            <div className="lp-brand-info">
              <div className="lp-brand-name">爱花型</div>
              <div className="lp-brand-sub">AI 袜版设计 · 一键下单</div>
            </div>
          </div>

          <div className="lp-main-copy">
            <div className="lp-badge">AI 设计 · 同款延展 · 一键下单</div>
            <h1 className="lp-headline">
              一根<em>花线</em>到成品<br/>
              5分钟交付定制袜款
            </h1>
            <p className="lp-desc">
              在线编辑袜版四区花型，AI 同款一键延展 1 / 2 / 4 个变体，
              一键提交至爱花型工厂量产 — 让袜款设计从画稿走向出货。
            </p>
          </div>

          <div className="lp-tags">
            <span>四区独立填花</span>
            <span>AI 同款延展</span>
            <span>素材库 + 私人定制</span>
            <span>小程序端实时预览</span>
          </div>
        </div>
      </div>

      {/* 右侧登录面板 */}
      <div className="lp-right">
        <div className="lp-form-wrap">
          {mode === 'sms' && (
            <>
              <h2 className="lp-form-title">欢迎来到爱花型</h2>
              <p className="lp-form-sub">手机号验证码登录，开启你的袜款设计之旅。</p>

              <div className="lp-fields">
                <div className="lp-field">
                  <label>手机号</label>
                  <div className="lp-input-wrap">
                    <PhoneIcon/>
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="请输入手机号"
                    />
                  </div>
                </div>

                <div className="lp-field">
                  <label>验证码</label>
                  <div className="lp-input-wrap lp-code-wrap">
                    <MsgIcon/>
                    <input
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="请输入验证码"
                    />
                    <button className="lp-code-btn" type="button" onClick={() => setCode('1234')}>
                      获取验证码
                    </button>
                  </div>
                </div>

                <button
                  className={`lp-submit${canSubmit ? ' lp-submit-active' : ''}`}
                  disabled={!canSubmit}
                  onClick={() => canSubmit && onLogin?.({ phone })}
                >
                  登录
                </button>

                <div className="lp-divider"><span>其他登录方式</span></div>

                <button className="lp-wechat-btn" type="button" onClick={() => setMode('wechat')}>
                  <WechatIcon/>
                  微信扫码登录
                </button>
              </div>
            </>
          )}

          {mode === 'wechat' && (
            <>
              <h2 className="lp-form-title">微信扫码登录</h2>
              <p className="lp-form-sub">使用微信 App 扫描下方二维码完成登录。</p>

              <div className="lp-qr-box">
                <div className="lp-qr-inner">
                  <WechatQrIcon/>
                  <div className="lp-qr-loading">二维码加载中…</div>
                </div>
              </div>

              <button className="lp-back-btn" type="button" onClick={() => setMode('sms')}>
                ← 返回手机号登录
              </button>
            </>
          )}
        </div>

        <div className="lp-footer">爱花型袜业 · 2026</div>
      </div>
    </div>
  )
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  )
}

function MsgIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function WechatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 7c-3.866 0-7 2.462-7 5.5 0 1.74 1.029 3.291 2.633 4.301L4 19l2.5-1.4c.78.252 1.62.4 2.5.4 3.866 0 7-2.462 7-5.5S12.866 7 9 7zm-3 4.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      <path d="M22 14.5c0-2.502-2.547-4.5-5.694-4.5h-.118c.205.475.32.987.32 1.5 0 2.484-2.241 4.5-5 4.5-.241 0-.479-.014-.713-.04C11.6 17.84 13.616 19 16 19c.74 0 1.443-.108 2.097-.305L20 19.7l-.51-1.776A4.39 4.39 0 0 0 22 14.5zm-7-1a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm5 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z"/>
    </svg>
  )
}

function WechatQrIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="rgba(40, 40, 40, 0.06)"/>
      <path d="M24 22c-4.5 0-8 2.9-8 6.5 0 2.05 1.2 3.86 3.07 5.04L18 36.5l3-1.7c.92.3 1.91.47 2.94.47.34 0 .67-.02 1-.06C24.65 39.16 28.32 41 32.65 41c.86 0 1.69-.13 2.46-.36L37.5 42l-.6-2.1c1.6-.94 2.6-2.4 2.6-4.06 0-3-3-5.42-6.7-5.42h-.14c.24.55.37 1.15.37 1.78 0 2.92-2.65 5.3-5.92 5.3-.28 0-.56-.02-.84-.05C25.92 36.66 24 34.06 24 31c0-3.04 2-5.65 4.83-6.83-.27-.05-.55-.08-.83-.11C26.7 22.42 25.4 22 24 22z" fill="#282828" fillOpacity="0.55"/>
    </svg>
  )
}
