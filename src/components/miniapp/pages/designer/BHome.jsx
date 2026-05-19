/**
 * BHome —— 小程序首页
 *
 * 结构：
 *   1) 可切换的 hero banner（3 张 slide：主视觉 / 限时活动 / 趋势推荐）
 *   2) 4 格功能入口：开始设计 / 我的设计 / 订单 / 素材
 *   3) 袜版设计预设网格（点击 → 加到我的设计 + 跳转）
 *   4) 行业资讯
 */
import { useEffect, useState } from 'react'
import {
  Sparkles, ShoppingBag, Layers, FolderHeart, ChevronRight, Play, Share2, Gift, TrendingUp,
} from 'lucide-react'
import SockMiniSvg from '../../../SockMiniSvg'
import { PRESET_TEMPLATES, INSIGHT_LIST } from '../../../presetTemplates'
import ShareSheet from '../../editor/ShareSheet'
import Toast from '../../ui/Toast'
import useToast from '../../ui/useToast'

const SLIDES = [
  {
    id: 'main',
    badge: 'AI 袜版 · 一键下单',
    title: '从一根花线到成品',
    desc: '选个预设 3 分钟出袜款，或自由编辑四区花型。',
    primaryLabel: '开始设计',
    primaryIcon: Play,
    secondaryLabel: '邀请好友',
    secondaryIcon: Share2,
    tone: 'blue',
  },
  {
    id: 'gift',
    badge: '新用户专属',
    title: '每日 5 次免费 AI 生图',
    desc: '注册即送 7 天高级配额，邀请好友再得额外次数。',
    primaryLabel: '立即体验',
    primaryIcon: Gift,
    secondaryLabel: '了解更多',
    secondaryIcon: ChevronRight,
    tone: 'pink',
  },
  {
    id: 'trend',
    badge: '春夏趋势',
    title: '2024 流行花型已上线',
    desc: '新风格、新色系，看看其他设计师都在做什么。',
    primaryLabel: '浏览素材',
    primaryIcon: TrendingUp,
    secondaryLabel: '收藏灵感',
    secondaryIcon: Sparkles,
    tone: 'purple',
  },
]

export default function BHome({
  designs = [],
  orders = [],
  onNavigate,
  onApplyPreset,
}) {
  const [shareOpen, setShareOpen] = useState(false)
  const [slide, setSlide] = useState(0)
  const { toast, show } = useToast()

  // 自动轮播
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  const handlePrimary = (id) => {
    if (id === 'main' || id === 'gift') onNavigate?.('b-editor')
    else if (id === 'trend') onNavigate?.('b-assets')
  }
  const handleSecondary = (id) => {
    if (id === 'main') setShareOpen(true)
    else if (id === 'gift') show('查看每日免费配额详情')
    else if (id === 'trend') show('已收藏到灵感库')
  }

  return (
    <div className="mp-page mp-page-home">
      {/* —— Hero Banner —— */}
      <section className="mp-home-banner">
        <div
          className="mp-home-banner-track"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {SLIDES.map((s) => {
            const PrimaryIcon = s.primaryIcon
            const SecondaryIcon = s.secondaryIcon
            return (
              <div key={s.id} className={`mp-home-slide tone-${s.tone}`}>
                <div className="mp-home-slide-bubble mp-home-slide-bubble-1"/>
                <div className="mp-home-slide-bubble mp-home-slide-bubble-2"/>
                <div className="mp-home-slide-bubble mp-home-slide-bubble-3"/>
                <div className="mp-home-slide-text">
                  <span className="mp-home-slide-badge">{s.badge}</span>
                  <h2 className="mp-home-slide-title">{s.title}</h2>
                  <p className="mp-home-slide-desc">{s.desc}</p>
                  <div className="mp-home-slide-cta-row">
                    <button
                      className="mp-home-slide-cta"
                      onClick={() => handlePrimary(s.id)}
                    >
                      <PrimaryIcon size={11} strokeWidth={2}/>
                      <span>{s.primaryLabel}</span>
                    </button>
                    <button
                      className="mp-home-slide-share"
                      onClick={() => handleSecondary(s.id)}
                    >
                      <SecondaryIcon size={11} strokeWidth={1.8}/>
                      <span>{s.secondaryLabel}</span>
                    </button>
                  </div>
                </div>
                <div className="mp-home-slide-stage">
                  <img
                    src={`${import.meta.env.BASE_URL}image-tool/sock.png`}
                    alt="袜款展示"
                    className="mp-home-slide-sock"
                    draggable={false}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {/* 圆点指示器 */}
        <div className="mp-home-banner-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`mp-home-banner-dot ${slide === i ? 'active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`切换到第 ${i + 1} 张 banner`}
            />
          ))}
        </div>
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

      {shareOpen && (
        <ShareSheet
          design={{ name: '爱花型 · AI 袜版定制', printName: '邀请好友' }}
          getCover={async () => null}
          onClose={() => setShareOpen(false)}
          onShared={(target) => { setShareOpen(false); show(`已分享到${target}`) }}
        />
      )}
      <Toast message={toast}/>
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
