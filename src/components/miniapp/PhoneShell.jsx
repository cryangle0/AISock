/**
 * PhoneShell —— 手机外壳（小窗 + 全屏复用）
 * 底部 5 个 tab，中间「AI 设计」凸起为圆形按钮（袜子图标）
 */
import { useRef } from 'react'
import {
  Wifi, BatteryFull, Signal, ChevronLeft, Maximize2,
  Home as HomeIcon, Compass, ShoppingCart, User,
} from 'lucide-react'
import { PAGE_META, getTabs } from './pageMeta'
import { PhoneShellContext } from './phoneShellContext'
import './PhoneShell.css'

const TAB_ICONS = {
  'b-home':   HomeIcon,
  'b-feed':   Compass,
  'b-editor': null,            // 中间用自定义袜子图标
  'b-cart':   ShoppingCart,
  'b-mine':   User,
}

// 袜子 SVG 图标（用于中间凸起按钮）
function SockIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M40 14 L60 14 L60 64 Q60 76 56 80 L48 86 Q44 88 41 88 L36 88 Q34 88 34 86 L34 78 Q34 68 36 64 L40 60 Z"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <line x1="40" y1="22" x2="60" y2="22" stroke={color} strokeWidth="3" opacity="0.6"/>
    </svg>
  )
}

export default function PhoneShell({
  page,
  canGoBack,
  onBack,
  onTabChange,
  onExpand,
  children,
  size = 'mini',
  hideTabbar = false,
  titleOverride,
}) {
  const meta = PAGE_META[page] || {}
  const tabs = getTabs()
  const activeTabKey = meta.parentTab || page
  const shellRef = useRef(null)

  const title = titleOverride || (meta.title ? `爱花型 · ${meta.title}` : '爱花型')

  return (
    <PhoneShellContext.Provider value={{ shellRef }}>
    <div className={`phone-shell phone-shell-${size}`} ref={shellRef}>
      <div className="phone-shell-notch" />

      <div className="phone-shell-status">
        <span>9:41</span>
        <span className="phone-shell-status-icons">
          <Signal size={size === 'full' ? 12 : 10} strokeWidth={2} />
          <Wifi size={size === 'full' ? 12 : 10} strokeWidth={2} />
          <BatteryFull size={size === 'full' ? 14 : 11} strokeWidth={1.6} />
        </span>
      </div>

      <div className="phone-shell-titlebar">
        {canGoBack && (
          <button className="phone-shell-back" onClick={onBack} aria-label="返回">
            <ChevronLeft size={size === 'full' ? 16 : 13} strokeWidth={2} />
          </button>
        )}
        <span className="phone-shell-title-text">{title}</span>
        {size === 'mini' && onExpand && (
          <button
            className="phone-shell-expand"
            onClick={onExpand}
            aria-label="放大查看"
            title="放大查看"
          >
            <Maximize2 size={11} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="phone-shell-screen">
        {children}
      </div>

      {!hideTabbar && (
        <div
          className="phone-shell-tabbar"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
        >
          {/* 中间凸起的圆形 FAB 套圈（仅作为视觉装饰，按钮本身在下方 map 里渲染） */}
          <div className="phone-shell-tabbar-fab-bg" aria-hidden="true"/>

          {tabs.map((t) => {
            const Icon = TAB_ICONS[t.key]
            const active = activeTabKey === t.key
            const isCenter = t.key === 'b-editor'
            return (
              <button
                key={t.key}
                className={
                  `phone-shell-tab ${active ? 'active' : ''} ${isCenter ? 'phone-shell-tab-fab' : ''}`
                }
                onClick={() => onTabChange(t.key)}
              >
                {isCenter ? (
                  <>
                    <span className="phone-shell-tab-fab-circle">
                      <SockIcon size={size === 'full' ? 26 : 18} color="#fff"/>
                    </span>
                    <span className="phone-shell-tab-fab-label">
                      {t.tabLabel || t.title}
                    </span>
                  </>
                ) : (
                  <>
                    {Icon && (
                      <span className="phone-shell-tab-icon">
                        <Icon size={size === 'full' ? 20 : 15} strokeWidth={active ? 2 : 1.6}/>
                      </span>
                    )}
                    {t.tabLabel || t.title}
                  </>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
    </PhoneShellContext.Provider>
  )
}
