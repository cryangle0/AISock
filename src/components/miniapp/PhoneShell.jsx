/**
 * PhoneShell — 手机外壳（小窗 + 全屏复用）
 * 4 个底部 tab，对齐 web 端的 4 个菜单
 */
import { Wifi, BatteryFull, Signal, ChevronLeft, Maximize2 } from 'lucide-react'
import { PAGE_META, getTabs } from './pageMeta'
import './PhoneShell.css'

export default function PhoneShell({
  page,
  canGoBack,
  onBack,
  onTabChange,
  onExpand,
  children,
  size = 'mini',
}) {
  const meta = PAGE_META[page] || {}
  const tabs = getTabs()
  const activeTabKey = meta.parentTab || page

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

      <div className="phone-shell-screen">
        {children}
      </div>

      <div
        className="phone-shell-tabbar"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
      >
        {tabs.map((t) => (
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
