/**
 * MiniAppPrototype —— 小程序原型入口
 *
 * 重构后底部 3 个 tab：首页 / 设计 / 我的
 *   - 首页：欢迎区 + 功能入口（订单/素材/我的设计）+ 袜版设计预设
 *   - 设计：袜版编辑器（顶部带"我的设计"快捷入口）
 *   - 我的：账户/设计/订单/素材入口 + 退出登录
 *
 * 子页（订单管理 / 素材库 / 我的设计 / 订单详情）通过 nav.navigate 进入。
 * 新增：小程序自有登录态 — 未登录时强制走登录页，登录后才显示 3 tab 主页面。
 */
import { useState, useCallback, useRef } from 'react'
import { Smartphone, ChevronDown, ChevronUp } from 'lucide-react'
import useMiniNav from './useMiniNav'
import useEditorState from './editor/useEditorState'
import { markRegisteredOnce } from './editor/useDailyQuota'
import PhoneShell from './PhoneShell'
import FullscreenModal from './FullscreenModal'
import BLoginPage from './BLoginPage'
import { PAGE_COMPONENTS } from './pages'
import './MiniAppPrototype.css'
import './pages/pages.css'

const MP_AUTH_KEY = 'aisock.mp.authed'
const MP_PHONE_KEY = 'aisock.mp.phone'

export default function MiniAppPrototype(props) {
  const [collapsed, setCollapsed] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [mpAuthed, setMpAuthed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(MP_AUTH_KEY)) === true } catch { return false }
  })
  const [mpPhone, setMpPhone] = useState(() => {
    try { return localStorage.getItem(MP_PHONE_KEY) || '' } catch { return '' }
  })

  const nav = useMiniNav()
  const editor = useEditorState()
  const canvasRef = useRef(null)

  const PageComponent = PAGE_COMPONENTS[nav.page]

  const handleExpand = useCallback(() => setFullscreen(true), [])
  const handleCloseFullscreen = useCallback(() => setFullscreen(false), [])

  const handleMpLogin = useCallback(({ phone } = {}) => {
    localStorage.setItem(MP_AUTH_KEY, 'true')
    if (phone) localStorage.setItem(MP_PHONE_KEY, phone)
    markRegisteredOnce()
    setMpAuthed(true)
    setMpPhone(phone || '')
  }, [])

  const handleMpLogout = useCallback(() => {
    localStorage.setItem(MP_AUTH_KEY, 'false')
    setMpAuthed(false)
    // 退出后回到登录态，并重置导航
  }, [])

  // 应用预设：把预设当一份新的设计稿写入 designs，并跳到我的设计
  const handleApplyPreset = useCallback((preset) => {
    const id = Date.now()
    props.onSaveDesign?.({
      name: preset.name,
      regions: preset.regions,
      cover: preset.regions?.body,
      fromPreset: true,
      _id: id,
    })
    nav.navigate('b-designs')
  }, [props, nav])

  // 统一传给所有页面的 props
  const pageProps = {
    ...props,
    nav,
    editor,
    canvasRef,
    onNavigate: nav.navigate,
    params: nav.params,
    onApplyPreset: handleApplyPreset,
    onLogout: handleMpLogout,
    userPhone: mpPhone,
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
            page={mpAuthed ? nav.page : 'b-home'}
            canGoBack={mpAuthed && nav.canGoBack}
            onBack={nav.goBack}
            onTabChange={nav.navigate}
            onExpand={handleExpand}
            size="mini"
            hideTabbar={!mpAuthed}
            titleOverride={!mpAuthed ? '爱花型 · 登录页' : undefined}
          >
            {!mpAuthed
              ? <BLoginPage onLogin={handleMpLogin}/>
              : (PageComponent && <PageComponent {...pageProps} />)
            }
          </PhoneShell>
        )}
      </div>

      <FullscreenModal
        open={fullscreen}
        page={mpAuthed ? nav.page : 'b-home'}
        canGoBack={mpAuthed && nav.canGoBack}
        onBack={nav.goBack}
        onNavigate={nav.navigate}
        onClose={handleCloseFullscreen}
        pageProps={pageProps}
        mpAuthed={mpAuthed}
        onMpLogin={handleMpLogin}
      />
    </>
  )
}
