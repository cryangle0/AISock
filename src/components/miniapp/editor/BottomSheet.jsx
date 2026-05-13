/**
 * BottomSheet — 通用底部抽屉弹层
 * 局部 absolute 在 phone-shell-screen 内。点遮罩或顶部 X 关闭。
 */
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function BottomSheet({
  open = true,
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = 'auto',  // 'auto' | 'tall' | 'full'
  closable = true,
}) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e) => { if (e.key === 'Escape' && closable) onClose?.() }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, onClose, closable])

  if (!open) return null

  return (
    <div className="mp-bottom-sheet-mask" onClick={(e) => {
      if (e.target === e.currentTarget && closable) onClose?.()
    }}>
      <div className={`mp-bottom-sheet mp-bottom-sheet-${size}`} role="dialog">
        <header className="mp-bottom-sheet-head">
          <div className="mp-bottom-sheet-titles">
            <div className="mp-bottom-sheet-title">{title}</div>
            {subtitle && <div className="mp-bottom-sheet-sub">{subtitle}</div>}
          </div>
          {closable && (
            <button
              className="mp-bottom-sheet-close"
              onClick={onClose}
              aria-label="关闭"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </header>
        <div className="mp-bottom-sheet-body">{children}</div>
        {footer && <footer className="mp-bottom-sheet-foot">{footer}</footer>}
      </div>
    </div>
  )
}
