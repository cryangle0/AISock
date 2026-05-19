/**
 * Home —— Web 首页中间主区（三栏布局中的中间列）
 *
 * 参考稿结构：
 *   1) Hero：白底圆角卡 + 左文案 + 右袜子图
 *   2) 4 格快捷入口（横向卡片）
 *   3) 袜版设计预设网格（6 张方形卡）
 */
import { Sparkles, FolderHeart, ShoppingBag, Layers, ChevronRight, Play, Eye } from 'lucide-react'
import SockMiniSvg from './SockMiniSvg'
import { PRESET_TEMPLATES } from './presetTemplates'
import './Home.css'

const SOCK_HERO = `${import.meta.env.BASE_URL}image-tool/sock.png`

export default function Home({
  designs = [],
  orders = [],
  onJump,
  onApplyPreset,
}) {
  return (
    <div className="home-page">
      {/* —— Hero —— */}
      <section className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-hero-title">从一根花线到成品</h1>
          <p className="home-hero-desc">
            3 分钟出袜款，或直接进入设计器<br/>
            自由编辑模板匹配花型，AI 同款一键延展<br/>
            提交至爱花型工厂量产。
          </p>
          <div className="home-hero-cta">
            <button className="home-btn-primary" onClick={() => onJump?.('设计')}>
              <Play size={13} strokeWidth={2}/> 开始设计
            </button>
            <button className="home-btn-ghost" onClick={() => onJump?.('素材库')}>
              <Eye size={13} strokeWidth={1.6}/> 浏览素材
            </button>
          </div>
        </div>
        <div className="home-hero-stage">
          <img className="home-hero-sock" src={SOCK_HERO} alt="袜款展示" draggable={false}/>
        </div>
      </section>

      {/* —— 4 格快捷入口 —— */}
      <section className="home-quick">
        <QuickCard
          icon={<Sparkles size={18} strokeWidth={1.8}/>}
          title="开始设计"
          desc="进入袜版编辑器"
          onClick={() => onJump?.('设计')}
        />
        <QuickCard
          icon={<FolderHeart size={18} strokeWidth={1.8}/>}
          title="我的设计"
          desc={`${designs.length} 个模板`}
          onClick={() => onJump?.('我的设计')}
        />
        <QuickCard
          icon={<ShoppingBag size={18} strokeWidth={1.8}/>}
          title="订单管理"
          desc={`${orders.length} 个订单`}
          onClick={() => onJump?.('订单管理')}
        />
        <QuickCard
          icon={<Layers size={18} strokeWidth={1.8}/>}
          title="素材库"
          desc="公共 + 个人花型"
          onClick={() => onJump?.('素材库')}
        />
      </section>

      {/* —— 袜版设计预设 —— */}
      <section className="home-section">
        <div className="home-section-head">
          <h2 className="home-section-title">
            袜版设计预设 <Sparkles size={14} strokeWidth={1.6} className="home-section-icon"/>
          </h2>
          <p className="home-section-sub">从模板快速开局，一键进入编辑器调整即用</p>
          <button className="home-section-more">
            查看更多模板 <ChevronRight size={12} strokeWidth={2}/>
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
                <div className="home-preset-name">{preset.name}</div>
                <div className="home-preset-desc">4 区模板</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function QuickCard({ icon, title, desc, onClick }) {
  return (
    <button className="home-quick-card" onClick={onClick}>
      <span className="home-quick-icon">{icon}</span>
      <span className="home-quick-text">
        <span className="home-quick-title">{title}</span>
        <span className="home-quick-desc">{desc}</span>
      </span>
      <ChevronRight size={14} strokeWidth={1.6} className="home-quick-arrow"/>
    </button>
  )
}
