import { useState } from 'react'
import { Smartphone, ChevronDown, ChevronUp, Wifi, BatteryFull, Signal } from 'lucide-react'
import './MiniPhone.css'
import { PATTERN_LIST } from './patternConstants'
import { PatternDefs } from './patterns'

const MINI_TABS = ['首页', '设计', '订单']

export default function MiniPhone({ activeMenu }) {
  const [collapsed, setCollapsed] = useState(true)
  const [tab, setTab] = useState('首页')

  return (
    <div className={`mini-phone ${collapsed ? 'collapsed' : ''}`}>
      <button className="mini-phone-toggle" onClick={() => setCollapsed(v => !v)}>
        <Smartphone size={13} strokeWidth={1.6}/>
        小程序端预览
        {collapsed ? <ChevronUp size={13} strokeWidth={1.6}/> : <ChevronDown size={13} strokeWidth={1.6}/>}
      </button>

      {!collapsed && (
        <div className="phone-frame">
          <div className="phone-notch"/>
          <div className="phone-status">
            <span>9:41</span>
            <span className="phone-status-icons">
              <Signal size={10} strokeWidth={2}/>
              <Wifi size={10} strokeWidth={2}/>
              <BatteryFull size={11} strokeWidth={1.6}/>
            </span>
          </div>
          <div className="phone-titlebar">爱花型 · {tab}</div>

          <div className="phone-screen">
            {tab === '首页' && <MiniHome onJump={(t) => setTab(t)}/>}
            {tab === '设计' && <MiniDesign currentMenu={activeMenu}/>}
            {tab === '订单' && <MiniOrders/>}
          </div>

          <div className="phone-tabbar">
            {MINI_TABS.map(t => (
              <button
                key={t}
                className={`phone-tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MiniHome({ onJump }) {
  return (
    <div className="mini-page">
      <div className="mini-banner">
        <div className="mini-banner-title">AI 设计你的专属袜款</div>
        <div className="mini-banner-sub">一键生成 · 7 天交付</div>
        <button className="mini-banner-btn" onClick={() => onJump('设计')}>立即设计</button>
      </div>

      <div className="mini-section-title">热门花型</div>
      <div className="mini-pattern-grid">
        {PATTERN_LIST.slice(0, 6).map(p => (
          <div key={p.id} className="mini-pattern-card">
            <svg viewBox="0 0 60 60" width="100%" height="100%">
              <PatternDefs uid={`mh-${p.id}`}/>
              <rect width="60" height="60" rx="10" fill={`url(#${p.id}-mh-${p.id})`}/>
            </svg>
            <span>{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniDesign() {
  const [region, setRegion] = useState('body')
  const [pattern, setPattern] = useState('p-floral')
  const regions = { welt: 'p-stripe', cuff: pattern, body: pattern, toe: 'p-dots' }

  return (
    <div className="mini-page">
      <div className="mini-design-canvas">
        <svg viewBox="0 0 480 640" width="100%" height="100%">
          <PatternDefs uid="md"/>
          <defs>
            <clipPath id="md-clip">
              <path d="M100 60 L380 60 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z"/>
            </clipPath>
          </defs>
          <g clipPath="url(#md-clip)">
            <rect x="100" y="60" width="280" height="44" fill={`url(#${regions.welt}-md)`}/>
            <rect x="100" y="104" width="280" height="56" fill={`url(#${regions.cuff}-md)`}/>
            <rect x="100" y="160" width="280" height="320" fill={`url(#${regions.body}-md)`}/>
            <rect x="100" y="478" width="280" height="120" fill={`url(#${regions.toe}-md)`}/>
          </g>
          <path
            d="M100 60 L380 60 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z"
            fill="none" stroke="rgba(16,18,24,0.16)" strokeWidth="1.6"
          />
        </svg>
      </div>

      <div className="mini-region-tabs">
        {[['welt', '袜口'], ['cuff', '螺口'], ['body', '主体'], ['toe', '袜头']].map(([k, l]) => (
          <button key={k} className={`mini-region-tab ${region === k ? 'active' : ''}`} onClick={() => setRegion(k)}>{l}</button>
        ))}
      </div>

      <div className="mini-section-title">花型</div>
      <div className="mini-pattern-strip">
        {PATTERN_LIST.map(p => (
          <button
            key={p.id}
            className={`mini-pattern-chip ${pattern === p.id ? 'active' : ''}`}
            onClick={() => setPattern(p.id)}
          >
            <svg viewBox="0 0 48 48" width="100%" height="100%">
              <PatternDefs uid={`md-${p.id}`}/>
              <rect width="48" height="48" rx="8" fill={`url(#${p.id}-md-${p.id})`}/>
            </svg>
          </button>
        ))}
      </div>

      <button className="mini-cta">提交订单</button>
    </div>
  )
}

function MiniOrders() {
  return (
    <div className="mini-page">
      <div className="mini-order-card">
        <div className="mini-order-head">
          <span className="mini-order-no">AS20260424001</span>
          <span className="mini-order-status progress">生产中</span>
        </div>
        <div className="mini-order-body">
          <div className="mini-order-name">春日少女款 · 100 双</div>
          <div className="mini-order-time">2026-04-24 10:32</div>
        </div>
      </div>
      <div className="mini-order-card">
        <div className="mini-order-head">
          <span className="mini-order-no">AS20260422007</span>
          <span className="mini-order-status shipped">已发货</span>
        </div>
        <div className="mini-order-body">
          <div className="mini-order-name">商务通勤款 · 180 双</div>
          <div className="mini-order-time">2026-04-22 16:18</div>
        </div>
      </div>
    </div>
  )
}
