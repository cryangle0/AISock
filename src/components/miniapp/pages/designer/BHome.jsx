/**
 * BHome —— 小程序首页
 *
 * 结构：
 *   1) 欢迎横幅 + 立即设计 CTA
 *   2) 4 格功能入口：开始设计 / 订单 / 素材 / 我的设计
 *   3) 袜版设计预设网格（点击 → 加到我的设计 + 跳转）
 *   4) 行业资讯
 */
import { Sparkles, ShoppingBag, Layers, FolderHeart, ChevronRight, Play } from 'lucide-react'
import SockMiniSvg from '../../../SockMiniSvg'
import { PRESET_TEMPLATES, INSIGHT_LIST } from '../../../presetTemplates'

export default function BHome({
  designs = [],
  orders = [],
  onNavigate,
  onApplyPreset,
}) {
  return (
    <div className="mp-page mp-page-home">
      {/* —— Hero —— */}
      <section className="mp-home-hero">
        <span className="mp-home-hero-badge">AI 袜版 · 一键下单</span>
        <h2 className="mp-home-hero-title">从一根花线到成品</h2>
        <p className="mp-home-hero-desc">
          选个预设 3 分钟出袜款，或自由编辑四区花型。
        </p>
        <button className="mp-home-hero-cta" onClick={() => onNavigate?.('b-editor')}>
          <Play size={11} strokeWidth={2}/> 开始设计
        </button>
      </section>

      {/* —— 4 格功能入口 —— */}
      <section className="mp-home-quick">
        <QuickEntry
          icon={<Sparkles size={16} strokeWidth={1.6}/>}
          title="开始设计"
          desc="进入编辑器"
          accent
          onClick={() => onNavigate?.('b-editor')}
        />
        <QuickEntry
          icon={<FolderHeart size={16} strokeWidth={1.6}/>}
          title="我的设计"
          desc={`${designs.length} 个`}
          onClick={() => onNavigate?.('b-designs')}
        />
        <QuickEntry
          icon={<ShoppingBag size={16} strokeWidth={1.6}/>}
          title="订单管理"
          desc={`${orders.length} 个`}
          onClick={() => onNavigate?.('b-orders')}
        />
        <QuickEntry
          icon={<Layers size={16} strokeWidth={1.6}/>}
          title="素材库"
          desc="花型 / 袜型"
          onClick={() => onNavigate?.('b-assets')}
        />
      </section>

      {/* —— 袜版设计预设 —— */}
      <section className="mp-home-section">
        <div className="mp-home-section-head">
          <div>
            <div className="mp-home-section-title">袜版设计预设</div>
            <div className="mp-home-section-sub">点一下，即刻拥有同款</div>
          </div>
        </div>
        <div className="mp-home-preset-grid">
          {PRESET_TEMPLATES.map((preset) => (
            <button
              key={preset.id}
              className="mp-home-preset-card"
              onClick={() => onApplyPreset?.(preset)}
            >
              <div className="mp-home-preset-cover">
                <SockMiniSvg regions={preset.regions} uid={`bhp${preset.id}`}/>
              </div>
              <div className="mp-home-preset-name">{preset.name}</div>
              <div className="mp-home-preset-tag">{preset.tag}</div>
            </button>
          ))}
        </div>
      </section>

      {/* —— 行业资讯 —— */}
      <section className="mp-home-section">
        <div className="mp-home-section-head">
          <div className="mp-home-section-title">行业资讯</div>
        </div>
        <div className="mp-home-insight">
          {INSIGHT_LIST.map((it) => (
            <div key={it.id} className="mp-home-insight-item">
              <span className="mp-home-insight-tag">{it.tag}</span>
              <span className="mp-home-insight-title">{it.title}</span>
              <ChevronRight size={11} strokeWidth={1.6}/>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function QuickEntry({ icon, title, desc, accent, onClick }) {
  return (
    <button className={`mp-home-quick-card ${accent ? 'accent' : ''}`} onClick={onClick}>
      <span className="mp-home-quick-icon">{icon}</span>
      <span className="mp-home-quick-title">{title}</span>
      <span className="mp-home-quick-desc">{desc}</span>
    </button>
  )
}
