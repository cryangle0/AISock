/**
 * FullscreenModal — 全屏弹层
 * 职责：深色遮罩 + 顶部控件 + 放大手机 + 右侧注解栏
 * 支持 ESC 关闭 / 点遮罩关闭 / 无障碍 dialog
 */
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import PhoneShell from './PhoneShell'
import AnnotationPanel from './AnnotationPanel'
import RoleChip from './RoleChip'
import { PAGE_COMPONENTS } from './pages'
import { PAGE_META } from './pageMeta'
import './FullscreenModal.css'

export default function FullscreenModal({
  open,
  role,
  page,
  canGoBack,
  onBack,
  onNavigate,
  onSwitchRole,
  onClose,
}) {
  const dialogRef = useRef(null)
  const prevFocusRef = useRef(null)

  // ESC 关闭
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // 焦点管理 + 禁止 body 滚动
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

  const handleTabChange = (pageKey) => onNavigate(pageKey)

  return createPortal(
    <div
      className="fs-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`爱花型小程序 · ${meta.title || ''}`}
      ref={dialogRef}
    >
      <div className="fs-modal-shell">
        {/* 顶部控件 */}
        <header className="fs-modal-top">
          <div className="fs-modal-title">
            <span className="fs-modal-no">{meta.no} / 18</span>
            <span className="fs-modal-title-text">{meta.title} · 爱花型小程序</span>
          </div>
          <RoleChip role={role} onChange={onSwitchRole} variant="dark" />
          <button
            className="fs-modal-close"
            onClick={onClose}
            aria-label="关闭"
            title="关闭 (ESC)"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        {/* 主舞台：手机 + 注解栏 */}
        <div className="fs-modal-stage">
          <div className="fs-modal-phone-wrap">
            <PhoneShell
              role={role}
              page={page}
              canGoBack={canGoBack}
              onBack={onBack}
              onTabChange={handleTabChange}
              size="full"
            >
              {PageComponent && <PageComponent onNavigate={onNavigate} />}
            </PhoneShell>
          </div>

          <AnnotationPanel
            page={page}
            role={role}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
