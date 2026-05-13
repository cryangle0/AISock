/**
 * MiniAppPrototype — 小程序原型入口
 *
 * 严格复刻 web 端 4 个 tab：设计 / 我的设计 / 订单管理 / 素材库。
 * 共享 web 端的 designs / orders / sessions 状态，下单后落到同一份订单列表。
 *
 * 编辑器状态在此处上提，保证切换 tab 时不会丢失袜版编辑进度。
 */
import { useState, useCallback, useRef } from 'react'
import { Smartphone, ChevronDown, ChevronUp } from 'lucide-react'
import useMiniNav from './useMiniNav'
import useEditorState from './editor/useEditorState'
import PhoneShell from './PhoneShell'
import FullscreenModal from './FullscreenModal'
import { PAGE_COMPONENTS } from './pages'
import './MiniAppPrototype.css'
import './pages/pages.css'

export default function MiniAppPrototype(props) {
  const [collapsed, setCollapsed] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const nav = useMiniNav()
  const editor = useEditorState()
  const canvasRef = useRef(null)

  const PageComponent = PAGE_COMPONENTS[nav.page]

  const handleExpand = useCallback(() => setFullscreen(true), [])
  const handleCloseFullscreen = useCallback(() => setFullscreen(false), [])

  // 统一传给所有页面的 props
  const pageProps = {
    ...props,
    nav,
    editor,
    canvasRef,
    onNavigate: nav.navigate,
    params: nav.params,
  }

  return (
    <>
      <div className={`mini-app ${collapsed ? 'collapsed' : ''}`}>
        <div className="mini-app-toolbar">
          <button
            className="mini-app-toggle"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
          >
            <Smartphone size={13} strokeWidth={1.6} />
            小程序原型
            {collapsed
              ? <ChevronUp size={13} strokeWidth={1.6} />
              : <ChevronDown size={13} strokeWidth={1.6} />}
          </button>
        </div>

        {!collapsed && (
          <PhoneShell
            page={nav.page}
            canGoBack={nav.canGoBack}
            onBack={nav.goBack}
            onTabChange={nav.navigate}
            onExpand={handleExpand}
            size="mini"
          >
            {PageComponent && <PageComponent {...pageProps} />}
          </PhoneShell>
        )}
      </div>

      <FullscreenModal
        open={fullscreen}
        page={nav.page}
        canGoBack={nav.canGoBack}
        onBack={nav.goBack}
        onNavigate={nav.navigate}
        onClose={handleCloseFullscreen}
        pageProps={pageProps}
      />
    </>
  )
}
