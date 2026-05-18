/**
 * Home —— Web 首页（v2 复刻参考稿）
 *
 * 区块：
 *   1) Hero —— 暖橙渐变 + 装饰球 + 袜子展示台
 *   2) 4 格快捷入口（彩色圆形图标背板）
 *   3) 袜版设计预设（6 张方形卡）
 *   4) 最近设计（4 张方形卡） + 行业资讯（带缩略图条目）
 */
import { Sparkles, FolderHeart, ShoppingBag, Layers, ChevronRight, Play, Eye, BookOpen, TrendingUp, Wrench } from 'lucide-react'
import SockMiniSvg from './SockMiniSvg'
import { PRESET_TEMPLATES, INSIGHT_LIST } from './presetTemplates'
import './Home.css'

const SOCK_HERO = `${import.meta.env.BASE_URL}image-tool/sock.png`

export default function Home({
  designs = [],
  orders = [],
  onJump,
  onApplyPreset,
}) {
  const designCount = designs.length
  const orderCount = orders.length
  const recentDesigns = designs.slice(0, 4)

  return (
    <div className="home-page">
      {/* —— Hero —— */}
      <section className="home-hero">
        <div className="home-hero-deco"/>
        <div className="home-hero-bubble home-hero-bubble-1"/>
        <div className="home-hero-bubble home-hero-bubble-2"/>
        <div className="home-hero-bubble home-hero-bubble-3"/>
        <div className="home-hero-arch"/>

        <div className="home-hero-content">
          <span className="home-hero-badge">AI 设计 · 同款延展 · 一键下单</span>
          <h1 className="home-hero-title">从一根花线到成品</h1>
          <p className="home-hero-desc">
            选个预设模板，3 分钟出袜款；或直接进入设计器，<br/>
            自由编辑袜版四区花型，AI 同款一键延展，提交至爱花型工厂量产。
          </p>
          <div className="home-hero-cta">
            <button className="home-btn-primary" onClick={() => onJump?.('设计')}>
              <Play size={14} strokeWidth={2}/> 开始设计
            </button>
            <button className="home-btn-ghost" onClick={() => onJump?.('素材库')}>
              <Eye size={14} strokeWidth={1.6}/> 浏览素材
            </button>
          </div>
        </div>

        <div className="home-hero-stage">
          <div className="home-hero-pedestal"/>
          <img className="home-hero-sock" src={SOCK_HERO} alt="袜款展示" draggable={false}/>
        </div>
      </section>

      {/* —— 4 格快速入口 —— */}
      <section className="home-quick">
        <QuickCard
          icon={<Sparkles size={20} strokeWidth={1.8}/>}
          title="开始设计"
          desc="进入袜版编辑器"
          tone="orange"
          onClick={() => onJump?.('设计')}
        />
        <QuickCard
          icon={<FolderHeart size={20} strokeWidth={1.8}/>}
          title="我的设计"
          desc={`${designCount} 个袜版`}
          tone="purple"
          onClick={() => onJump?.('我的设计')}
        />
        <QuickCard
          icon={<ShoppingBag size={20} strokeWidth={1.8}/>}
          title="订单管理"
          desc={`${orderCount} 个订单`}
          tone="green"
          onClick={() => onJump?.('订单管理')}
        />
        <QuickCard
          icon={<Layers size={20} strokeWidth={1.8}/>}
          title="素材库"
          desc="公共 + 个人花型"
          tone="blue"
          onClick={() => onJump?.('素材库')}
        />
      </section>

      {/* —— 袜版设计预设 —— */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <h2 className="home-section-title">
              袜版设计预设 <Sparkles size={14} strokeWidth={1.6} className="home-section-icon"/>
            </h2>
            <p className="home-section-sub">从模板快速开局，一键进入编辑器调整即用</p>
          </div>
          <button className="home-section-more">
            查看全部 <ChevronRight size={12} strokeWidth={2}/>
          </button>
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
            <h2 className="home-section-title">
              最近设计 <Sparkles size={14} strokeWidth={1.6} className="home-section-icon"/>
            </h2>
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
            <button className="home-section-more">
              查看更多 <ChevronRight size={12} strokeWidth={2}/>
            </button>
          </div>
          <ul className="home-insight-list">
            {INSIGHT_LIST.map((it, idx) => {
              const Icon = INSIGHT_ICONS[idx % INSIGHT_ICONS.length]
              const tone = INSIGHT_TONES[idx % INSIGHT_TONES.length]
              return (
                <li key={it.id} className="home-insight-item">
                  <span className={`home-insight-thumb tone-${tone}`}>
                    <Icon size={18} strokeWidth={1.6}/>
                  </span>
                  <div className="home-insight-text">
                    <div className="home-insight-headline">
                      <span className={`home-insight-tag tone-${tone}`}>{it.tag}</span>
                      <span className="home-insight-title">{it.title}</span>
                    </div>
                    <div className="home-insight-meta">
                      <span>{INSIGHT_DATES[idx % INSIGHT_DATES.length]}</span>
                      <span className="home-insight-meta-sep">·</span>
                      <span>{INSIGHT_VIEWS[idx % INSIGHT_VIEWS.length]} 阅读</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </aside>
      </section>
    </div>
  )
}

const INSIGHT_ICONS = [BookOpen, TrendingUp, Wrench]
const INSIGHT_TONES = ['orange', 'pink', 'mint']
const INSIGHT_DATES = ['05-20', '05-19', '05-18']
const INSIGHT_VIEWS = ['1243', '856', '642']

function QuickCard({ icon, title, desc, tone = 'orange', onClick }) {
  return (
    <button className={`home-quick-card tone-${tone}`} onClick={onClick}>
      <span className="home-quick-icon">{icon}</span>
      <span className="home-quick-text">
        <span className="home-quick-title">{title}</span>
        <span className="home-quick-desc">{desc}</span>
      </span>
      <ChevronRight size={14} strokeWidth={1.6} className="home-quick-arrow"/>
    </button>
  )
}
