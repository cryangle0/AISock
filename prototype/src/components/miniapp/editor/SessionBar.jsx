/**
 * SessionBar — 编辑器顶部的会话切换条（对齐 web TopBar）
 * 功能：当前会话名 + 下拉切换 + 新建/重命名/删除
 */
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Check, Pencil, Trash2 } from 'lucide-react'

export default function SessionBar({
  currentSession,
  sessions,
  onSelect,
  onNew,
  onRename,
  onDelete,
}) {
  const [open, setOpen] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setRenamingId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleRenameStart = (s) => {
    setRenamingId(s.id)
    setRenameValue(s.name)
  }

  const handleRenameSubmit = (id) => {
    if (renameValue.trim()) onRename?.(id, renameValue.trim())
    setRenamingId(null)
  }

  return (
    <div className="mp-session-bar" ref={wrapRef}>
      <button
        className={`mp-session-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mp-session-name">{currentSession?.name || '未命名袜版'}</span>
        <ChevronDown size={11} strokeWidth={2} />
      </button>

      {open && (
        <div className="mp-session-pop">
          <button
            className="mp-session-new"
            onClick={() => { onNew?.(); setOpen(false) }}
          >
            <Plus size={11} strokeWidth={2.4} /> 新建袜版
          </button>
          <div className="mp-session-divider" />
          <div className="mp-session-list">
            {sessions.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                isCurrent={currentSession?.id === s.id}
                isRenaming={renamingId === s.id}
                renameValue={renameValue}
                onRenameValueChange={setRenameValue}
                onRenameSubmit={() => handleRenameSubmit(s.id)}
                onRenameCancel={() => setRenamingId(null)}
                onSelect={() => { onSelect?.(s); setOpen(false) }}
                onRenameStart={() => handleRenameStart(s)}
                onDelete={() => { onDelete?.(s.id); setOpen(false) }}
                canDelete={sessions.length > 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SessionItem({
  session, isCurrent, isRenaming, renameValue,
  onRenameValueChange, onRenameSubmit, onRenameCancel,
  onSelect, onRenameStart, onDelete, canDelete,
}) {
  const inputRef = useRef(null)
  useEffect(() => {
    if (isRenaming) inputRef.current?.focus()
  }, [isRenaming])

  if (isRenaming) {
    return (
      <div className="mp-session-item renaming">
        <input
          ref={inputRef}
          className="mp-input"
          value={renameValue}
          onChange={(e) => onRenameValueChange(e.target.value)}
          onBlur={onRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameSubmit()
            if (e.key === 'Escape') onRenameCancel()
          }}
        />
      </div>
    )
  }

  return (
    <div className={`mp-session-item ${isCurrent ? 'current' : ''}`}>
      <button className="mp-session-item-main" onClick={onSelect}>
        <span className="mp-session-item-name">{session.name}</span>
        <span className="mp-session-item-date">{session.date}</span>
      </button>
      {isCurrent && <Check size={11} strokeWidth={2.4} className="mp-session-check" />}
      <button
        className="mp-session-item-action"
        onClick={onRenameStart}
        aria-label="重命名"
      >
        <Pencil size={10} strokeWidth={1.8} />
      </button>
      <button
        className="mp-session-item-action danger"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label="删除"
      >
        <Trash2 size={10} strokeWidth={1.8} />
      </button>
    </div>
  )
}
