/**
 * PhoneShell — 手机外壳组件（小窗 + 全屏复用）
 * 职责：手机外框、状态栏、titlebar、屏幕区、tabBar
 * 页面内容通过 children 注入，保持纯展示
 */
import { Wifi, BatteryFull, Signal, ChevronLeft, Maximize2 } from 'lucide-react'
import { PAGE_META, getTabsForRole } from './pageMeta'
import './PhoneShell.css'

export default function PhoneShell({
  role,
  page,
  canGoBack,
  onBack,
  onTabChange,
  onExpand,
  children,
  size = 'mini',   // 'mini' | 'full'
}) {
  const meta = PAGE_META[page] || {}
  const tabs = getTabsForRole(role)
  const activeTabKey = meta.parentTab || page

  const timeNow = '9:41'

  return (
    <div className={`phone-shell phone-shell-${size}`}>
      {/* 刘海 */}
      <div className="phone-shell-notch" />

      {/* 状态栏 */}
      <div className="phone-shell-status">
        <span>{timeNow}</span>
        <span className="phone-shell-status-icons">
          <Signal size={size === 'full' ? 12 : 10} strokeWidth={2} />
          <Wifi size={size === 'full' ? 12 : 10} strokeWidth={2} />
          <BatteryFull size={size === 'full' ? 14 : 11} strokeWidth={1.6} />
        </span>
      </div>

      {/* 标题栏 */}
      <div className={`phone-shell-titlebar role-${role}`}>
        {canGoBack && (
          <button
            className="phone-shell-back"
            onClick={onBack}
            aria-label="返回"
          >
            <ChevronLeft size={size === 'full' ? 16 : 13} strokeWidth={2} />
          </button>
        )}
        <span className="phone-shell-title-text">
          爱花型 · {meta.title || ''}
        </span>
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

      {/* 内容区 */}
      <div className="phone-shell-screen">
        {children}
      </div>

      {/* tabBar */}
      <div
        className={`phone-shell-tabbar role-${role}`}
        style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
      >
        {tabs.map(t => (
          <button
            key={t.key}
            className={`phone-shell-tab ${activeTabKey === t.key ? 'active' : ''}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.tabLabel || t.title}
          </button>
        ))}
      </div>
    </div>
  )
}
