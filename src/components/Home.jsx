/**
 * Home —— Web 端首页
 *
 * 风格对齐 aihuaxing：欢迎区 + 功能入口 + 预设案例展示。
 * 我的设计 / 订单 / 素材库 都从这里点击进入，降低主菜单负担。
 */
import { Sparkles, FolderHeart, ShoppingBag, Layers, ChevronRight, Play } from 'lucide-react'
import SockMiniSvg from './SockMiniSvg'
import { PRESET_TEMPLATES, INSIGHT_LIST } from './presetTemplates'
import './Home.css'

export default function Home({
  designs = [],
  orders = [],
  onJump,
  onApplyPreset,
}) {
  // 三个功能入口的实时计数
  const designCount = designs.length
  const orderCount = orders.length
  const recentDesigns = designs.slice(0, 4)

  return (
    <div className="home-page">
      {/* —— Hero —— */}
      <section className="home-hero">
        <div className="home-hero-text">
          <span className="home-hero-badge">AI 设计 · 同款延展 · 一键下单</span>
          <h1 className="home-hero-title">从一根花线到成品</h1>
          <p className="home-hero-desc">
            选个预设模板，3 分钟出袜款；或直接进入设计器，
            自由编辑袜版四区花型，AI 同款一键延展，提交至爱花型工厂量产。
          </p>
          <div className="home-hero-cta">
            <button className="home-btn-primary" onClick={() => onJump?.('设计')}>
              <Play size={14} strokeWidth={2}/> 开始设计
            </button>
            <button className="home-btn-ghost" onClick={() => onJump?.('素材库')}>
              <Layers size={14} strokeWidth={1.6}/> 浏览素材
            </button>
          </div>
        </div>
      </section>

      {/* —— 功能入口三联卡 —— */}
      <section className="home-quick">
        <QuickCard
          icon={<Sparkles size={18} strokeWidth={1.6}/>}
          title="开始设计"
          desc="进入袜版编辑器"
          accent
          onClick={() => onJump?.('设计')}
        />
        <QuickCard
          icon={<FolderHeart size={18} strokeWidth={1.6}/>}
          title="我的设计"
          desc={`${designCount} 个袜版`}
          onClick={() => onJump?.('我的设计')}
        />
        <QuickCard
          icon={<ShoppingBag size={18} strokeWidth={1.6}/>}
          title="订单管理"
          desc={`${orderCount} 个订单`}
          onClick={() => onJump?.('订单管理')}
        />
        <QuickCard
          icon={<Layers size={18} strokeWidth={1.6}/>}
          title="素材库"
          desc="公共 + 个人花型"
          onClick={() => onJump?.('素材库')}
        />
      </section>

      {/* —— 袜版设计预设 —— */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <h2 className="home-section-title">袜版设计预设</h2>
            <p className="home-section-sub">从模板快速开局，一键进入编辑器调整即用</p>
          </div>
        </div>

        <div className="home-preset-grid">
          {PRESET_TEMPLATES.map((preset) => (
            <button
              key={preset.id}
              className="home-preset-card"
              onClick={() => onApplyPreset?.(preset)}
            >
              <div className="home-preset-cover">
                <SockMiniSvg regions={preset.regions} uid={`hp${preset.id}`}/>
              </div>
              <div className="home-preset-meta">
                <div className="home-preset-name">
                  {preset.name}
                  <span className="home-preset-tag">{preset.tag}</span>
                </div>
                <div className="home-preset-desc">{preset.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* —— 最近设计 + 行业资讯 双列 —— */}
      <section className="home-twocol">
        <div className="home-recent">
          <div className="home-section-head">
            <h2 className="home-section-title">最近设计</h2>
            <button className="home-section-more" onClick={() => onJump?.('我的设计')}>
              查看全部 <ChevronRight size={12} strokeWidth={2}/>
            </button>
          </div>
          {recentDesigns.length === 0 ? (
            <div className="home-empty">
              <span>还没有设计稿</span>
              <button className="home-btn-link" onClick={() => onJump?.('设计')}>去创建第一个</button>
            </div>
          ) : (
            <div className="home-recent-grid">
              {recentDesigns.map((d) => (
                <div key={d.id} className="home-recent-card">
                  <div className="home-recent-cover">
                    {d.coverImage ? (
                      <img src={d.coverImage} alt={d.name}/>
                    ) : d.regions ? (
                      <SockMiniSvg regions={d.regions} uid={`hr${d.id}`}/>
                    ) : (
                      <div className="home-recent-empty">暂无预览</div>
                    )}
                  </div>
                  <div className="home-recent-name">{d.name}</div>
                  <div className="home-recent-time">{d.savedAt}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="home-insight">
          <div className="home-section-head">
            <h2 className="home-section-title">行业资讯</h2>
          </div>
          <ul className="home-insight-list">
            {INSIGHT_LIST.map((it) => (
              <li key={it.id} className="home-insight-item">
                <span className="home-insight-tag">{it.tag}</span>
                <span className="home-insight-title">{it.title}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  )
}

function QuickCard({ icon, title, desc, accent, onClick }) {
  return (
    <button className={`home-quick-card ${accent ? 'accent' : ''}`} onClick={onClick}>
      <span className="home-quick-icon">{icon}</span>
      <span className="home-quick-text">
        <span className="home-quick-title">{title}</span>
        <span className="home-quick-desc">{desc}</span>
      </span>
      <ChevronRight size={14} strokeWidth={1.6} className="home-quick-arrow"/>
    </button>
  )
}
