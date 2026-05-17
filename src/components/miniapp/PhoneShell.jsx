/**
 * PhoneShell —— 手机外壳（小窗 + 全屏复用）
 * 重构后底部 3 个 tab：首页 / 设计 / 我的
 */
import {
  Wifi, BatteryFull, Signal, ChevronLeft, Maximize2,
  Home as HomeIcon, Brush, User,
} from 'lucide-react'
import { PAGE_META, getTabs } from './pageMeta'
import './PhoneShell.css'

const TAB_ICONS = {
  'b-home':   HomeIcon,
  'b-editor': Brush,
  'b-mine':   User,
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
  // 未登录态时由调用方覆盖标题文案
  titleOverride,
}) {
  const meta = PAGE_META[page] || {}
  const tabs = getTabs()
  const activeTabKey = meta.parentTab || page

  // 标题：登录态优先用 override；否则按 PAGE_META.title
  const title = titleOverride || (meta.title ? `爱花型 · ${meta.title}` : '爱花型')

  return (
    <div className={`phone-shell phone-shell-${size}`}>
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
          {/* 凹槽：顶端边线绕过中间圆形按钮 */}
          {tabs.length % 2 === 1 && (
            <svg
              className="phone-shell-tabbar-notch"
              viewBox="0 0 44 22"
              aria-hidden="true"
            >
              {/* 凹陷区域填充 = tab bar 颜色，让凹陷下方仍是白色 */}
              <path
                d="M0,0 A22,22 0 0,0 44,0 L44,22 L0,22 Z"
                fill="var(--mp-bg-card)"
              />
              {/* 凹弧描边 */}
              <path
                d="M0,0.5 A22,22 0 0,0 44,0.5"
                fill="none"
                stroke="var(--mp-divider)"
                strokeWidth="1"
              />
            </svg>
          )}
          {tabs.map((t, i) => {
            const Icon = TAB_ICONS[t.key]
            const active = activeTabKey === t.key
            const isCenter = i === Math.floor(tabs.length / 2) && tabs.length % 2 === 1
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
                      {Icon && (
                        <Icon
                          size={size === 'full' ? 18 : 13}
                          strokeWidth={active ? 2.2 : 2}
                        />
                      )}
                    </span>
                    <span className="phone-shell-tab-fab-label">
                      {t.tabLabel || t.title}
                    </span>
                  </>
                ) : (
                  <>
                    {Icon && (
                      <span className="phone-shell-tab-icon">
                        <Icon
                          size={size === 'full' ? 18 : 14}
                          strokeWidth={active ? 2 : 1.6}
                        />
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
  )
}
