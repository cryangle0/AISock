/**
 * MiniAppPrototype — 小程序原型入口
 * 提供右下角折叠小窗 + 点放大进入全屏弹层
 * 所有子组件通过 useMiniNav 共享导航状态
 */
import { useState, useCallback } from 'react'
import { Smartphone, ChevronDown, ChevronUp } from 'lucide-react'
import useMiniNav from './useMiniNav'
import PhoneShell from './PhoneShell'
import FullscreenModal from './FullscreenModal'
import RoleChip from './RoleChip'
import { PAGE_COMPONENTS } from './pages'
import './MiniAppPrototype.css'
import './pages/pages.css'

export default function MiniAppPrototype() {
  const [collapsed, setCollapsed] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const nav = useMiniNav()

  const PageComponent = PAGE_COMPONENTS[nav.page]

  const handleExpand = useCallback(() => setFullscreen(true), [])
  const handleCloseFullscreen = useCallback(() => setFullscreen(false), [])

  return (
    <>
      <div className={`mini-app ${collapsed ? 'collapsed' : ''}`}>
        <div className="mini-app-toolbar">
          <button
            className="mini-app-toggle"
            onClick={() => setCollapsed(v => !v)}
            aria-expanded={!collapsed}
          >
            <Smartphone size={13} strokeWidth={1.6} />
            小程序原型
            {collapsed
              ? <ChevronUp size={13} strokeWidth={1.6} />
              : <ChevronDown size={13} strokeWidth={1.6} />
            }
          </button>

          {!collapsed && (
            <RoleChip
              role={nav.role}
              onChange={nav.switchRole}
              variant="light"
            />
          )}
        </div>

        {!collapsed && (
          <PhoneShell
            role={nav.role}
            page={nav.page}
            canGoBack={nav.canGoBack}
            onBack={nav.goBack}
            onTabChange={nav.navigate}
            onExpand={handleExpand}
            size="mini"
          >
            {PageComponent && <PageComponent onNavigate={nav.navigate} />}
          </PhoneShell>
        )}
      </div>

      <FullscreenModal
        open={fullscreen}
        role={nav.role}
        page={nav.page}
        canGoBack={nav.canGoBack}
        onBack={nav.goBack}
        onNavigate={nav.navigate}
        onSwitchRole={nav.switchRole}
        onClose={handleCloseFullscreen}
      />
    </>
  )
}
