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
          {/* 凸起：tab bar 顶端边线在中间向上鼓起一段半圆，把圆按钮装在里面 */}
          {tabs.length % 2 === 1 && (
            <svg
              className="phone-shell-tabbar-bump"
              viewBox="0 0 38 20"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* 凸起填充 = tab bar 颜色，让凸起和 tab bar 内部连成一片 */}
              {/* 包含底部 1px 把 tabbar 自身的 border-top 那段直线盖掉 */}
              <path
                d="M0,20 L0,19 A19,19 0 0 1 38,19 L38,20 Z"
                fill="var(--mp-bg-card)"
              />
              {/* 描边只画半圆弧（左右两侧的水平线由 tabbar 自身的 border-top 提供） */}
              <path
                d="M0,19 A19,19 0 0 1 38,19"
                fill="none"
                stroke="var(--mp-divider)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
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
                          size={size === 'full' ? 16 : 11}
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
