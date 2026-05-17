/**
 * FullscreenModal — 全屏弹层
 * 居中放大手机预览，ESC 关闭 / 点遮罩关闭
 */
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import PhoneShell from './PhoneShell'
import BLoginPage from './BLoginPage'
import { PAGE_COMPONENTS } from './pages'
import { PAGE_META } from './pageMeta'
import './FullscreenModal.css'

export default function FullscreenModal({
  open,
  page,
  canGoBack,
  onBack,
  onNavigate,
  onClose,
  pageProps,
  mpAuthed = true,
  onMpLogin,
}) {
  const dialogRef = useRef(null)
  const prevFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    prevFocusRef.current = document.activeElement
    const focusable = dialogRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      prevFocusRef.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  const meta = PAGE_META[page] || {}
  const PageComponent = PAGE_COMPONENTS[page]
  const headerTitle = mpAuthed ? `爱花型小程序 · ${meta.title || ''}` : '爱花型小程序 · 登录页'
  const phoneTitle = mpAuthed ? undefined : '爱花型 · 登录页'

  return createPortal(
    <div
      className="fs-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={headerTitle}
      ref={dialogRef}
    >
      <div className="fs-modal-shell">
        <header className="fs-modal-top">
          <div className="fs-modal-title">
            <span className="fs-modal-title-text">{headerTitle}</span>
          </div>
          <button
            className="fs-modal-close"
            onClick={onClose}
            aria-label="关闭"
            title="关闭 (ESC)"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="fs-modal-stage">
          <div className="fs-modal-phone-wrap">
            <PhoneShell
              page={page}
              canGoBack={canGoBack}
              onBack={onBack}
              onTabChange={onNavigate}
              size="full"
              hideTabbar={!mpAuthed}
              titleOverride={phoneTitle}
            >
              {!mpAuthed
                ? <BLoginPage onLogin={onMpLogin}/>
                : (PageComponent && <PageComponent {...pageProps} />)
              }
            </PhoneShell>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
