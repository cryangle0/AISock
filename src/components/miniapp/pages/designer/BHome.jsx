/**
 * BHome —— 小程序首页（敦煌主题）
 *
 * 区块：
 *   1) 顶部品牌行：爱花型 · 袜稿设计
 *   2) 大型 banner：敦煌梦 · 千年壁画艺术之旅
 *   3) 主题随心订 - 三个主题卡片（二十四节气 / 敦煌入梦 / 文创物语）
 *   4) 大画展示区：敦煌九色鹿（横向滑动 carousel）
 */
import { useState } from 'react'
import { Music } from 'lucide-react'
import ShareSheet from '../../editor/ShareSheet'
import Toast from '../../ui/Toast'
import useToast from '../../ui/useToast'

const THEMES = [
  {
    id: 'jieqi',
    title: '二十四',
    subtitle: '节气',
    en: 'JIE QI',
    bg: 'linear-gradient(135deg, #E8D5B8 0%, #D4C09A 100%)',
    decoColor: '#5a8a7d',     /* 山水绿 */
  },
  {
    id: 'dunhuang',
    title: '敦煌',
    subtitle: '入梦',
    en: 'DUN HUANG',
    bg: 'linear-gradient(135deg, #C9B89A 0%, #B5A085 100%)',
    decoColor: '#8C5A3C',
  },
  {
    id: 'wenchuang',
    title: '文创',
    subtitle: '物语',
    en: 'WEN CHUANG',
    bg: 'linear-gradient(135deg, #DEC38A 0%, #C7A66E 100%)',
    decoColor: '#3a6fa3',     /* 螺青 */
  },
]

const FEATURED_DESIGNS = [
  { id: 'd1', title: '敦煌九色鹿', mainColor: '#C8B89A', accent: '#8C5A3C' },
  { id: 'd2', title: '飞天乐舞',   mainColor: '#A8C4B0', accent: '#5a8a7d' },
  { id: 'd3', title: '千手观音',   mainColor: '#D6A87A', accent: '#A05A3C' },
]

export default function BHome({
  onNavigate,
}) {
  const [shareOpen, setShareOpen] = useState(false)
  const [active, setActive] = useState(0)
  const { toast, show } = useToast()

  // 让侧边能露出前后两张（参考稿效果）
  const handleSelect = (i) => setActive(i)

  return (
    <div className="mp-page mp-page-home mp-home-dunhuang">
      {/* —— 1. 顶部品牌行 —— */}
      <div className="mp-home-brand">爱花型. 袜稿设计</div>

      {/* —— 2. 敦煌梦 banner —— */}
      <section className="mp-home-banner-dunhuang" onClick={() => onNavigate?.('b-feed')}>
        <div className="mp-home-banner-left">
          <div className="mp-home-banner-cn">敦<br/>煌<br/>梦</div>
          <div className="mp-home-banner-en">DUN HUANG DREAM</div>
        </div>
        <div className="mp-home-banner-tag">千年壁画艺术之旅</div>
        <svg className="mp-home-banner-art" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="bg-glow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#a8c4b0" stopOpacity="0.6"/>
              <stop offset="60%" stopColor="#5a8a7d" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3a6fa3" stopOpacity="0.1"/>
            </radialGradient>
          </defs>
          <ellipse cx="140" cy="50" rx="60" ry="40" fill="url(#bg-glow)"/>
          {/* 飞天剪影 */}
          <g fill="#5a8a7d" opacity="0.5">
            <circle cx="120" cy="45" r="4"/>
            <path d="M 120 49 Q 130 52 140 50 Q 145 60 130 65 Q 120 65 115 60 Z"/>
          </g>
          {/* 飘带 */}
          <path d="M 100 30 Q 130 20 160 35 Q 180 50 170 70" fill="none" stroke="#8C5A3C" strokeWidth="1.5" opacity="0.5"/>
        </svg>
        <span className="mp-home-banner-stamp">岁岁年上历史</span>
      </section>

      {/* —— 3. 主题随心订 —— */}
      <section className="mp-home-themes">
        <div className="mp-home-themes-head">
          <h3 className="mp-home-themes-title">主题随心订</h3>
          <span className="mp-home-themes-en">Select theme</span>
          <span className="mp-home-themes-music">
            <Music size={11} strokeWidth={1.6}/>
            <Music size={11} strokeWidth={1.6}/>
            <Music size={11} strokeWidth={1.6}/>
          </span>
        </div>
        <div className="mp-home-themes-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className="mp-home-theme-card"
              style={{ background: t.bg }}
              onClick={() => { onNavigate?.('b-feed'); show(`查看主题：${t.title}${t.subtitle}`) }}
            >
              <div className="mp-home-theme-text">
                <div className="mp-home-theme-cn">{t.title}</div>
                <div className="mp-home-theme-cn">{t.subtitle}</div>
                <div className="mp-home-theme-en">{t.en}</div>
              </div>
              <svg className="mp-home-theme-deco" viewBox="0 0 60 60">
                <circle cx="42" cy="22" r="10" fill={t.decoColor} opacity="0.45"/>
                <path d="M 30 38 Q 40 30 50 40 Q 50 50 38 50 Q 28 48 30 38 Z" fill={t.decoColor} opacity="0.55"/>
              </svg>
            </button>
          ))}
        </div>
      </section>

      {/* —— 4. 大画展示（横向 carousel）—— */}
      <section className="mp-home-showcase">
        <div className="mp-home-showcase-track">
          {FEATURED_DESIGNS.map((d, i) => {
            const offset = i - active
            const abs = Math.abs(offset)
            const scale = 1 - 0.12 * abs
            return (
              <button
                key={d.id}
                className={`mp-home-showcase-card ${offset === 0 ? 'active' : 'side'}`}
                style={{
                  transform: `translateX(${offset * 60}%) scale(${scale})`,
                  zIndex: 10 - abs,
                  background: `linear-gradient(180deg, ${d.mainColor} 0%, #d4b796 100%)`,
                }}
                onClick={() => handleSelect(i)}
              >
                <ShowcaseArt accent={d.accent} mainColor={d.mainColor}/>
                <div className="mp-home-showcase-title-vertical">
                  {d.title.split('').map((ch, k) => (
                    <span key={k}>{ch}</span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
        <div className="mp-home-showcase-dots">
          {FEATURED_DESIGNS.map((d, i) => (
            <button
              key={d.id}
              type="button"
              aria-label={`切换到 ${d.title}`}
              className={`mp-home-showcase-dot ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
        <div className="mp-home-showcase-music">
          <Music size={10} strokeWidth={1.6}/>
          <Music size={10} strokeWidth={1.6}/>
          <Music size={10} strokeWidth={1.6}/>
        </div>
      </section>

      {shareOpen && (
        <ShareSheet
          design={{ name: '爱花型 · 敦煌主题', printName: '邀请好友' }}
          getCover={async () => null}
          onClose={() => setShareOpen(false)}
          onShared={(target) => { setShareOpen(false); show(`已分享到${target}`) }}
        />
      )}
      <Toast message={toast}/>
    </div>
  )
}

/** 大画卡片中央装饰：模拟敦煌九色鹿剪影 */
function ShowcaseArt({ accent, mainColor }) {
  return (
    <svg viewBox="0 0 120 180" className="mp-home-showcase-art">
      <defs>
        <radialGradient id="halo">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6"/>
          <stop offset="80%" stopColor={accent} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={accent} stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* 圆形光环 */}
      <circle cx="60" cy="80" r="45" fill="url(#halo)"/>
      {/* 鹿身 */}
      <ellipse cx="60" cy="120" rx="22" ry="34" fill={mainColor}/>
      {/* 鹿头 */}
      <ellipse cx="60" cy="92" rx="14" ry="18" fill={mainColor}/>
      {/* 鹿角 */}
      <path d="M 50 76 L 42 60 L 38 50 M 50 76 L 46 64 M 50 76 L 44 56" stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M 70 76 L 78 60 L 82 50 M 70 76 L 74 64 M 70 76 L 76 56" stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      {/* 眼鼻额头 */}
      <circle cx="55" cy="92" r="1.4" fill="#2B1F14"/>
      <circle cx="65" cy="92" r="1.4" fill="#2B1F14"/>
      <path d="M 60 80 L 57 86 L 60 88 L 63 86 Z" fill={accent} opacity="0.7"/>
    </svg>
  )
}
