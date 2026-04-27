import { useEffect, useRef, useState } from 'react'
import { Palette, ChevronDown, Check } from 'lucide-react'
import './ColorPaletteSelector.css'
import { COLOR_PALETTES, PALETTE_MAP } from './colorPalettes'

/**
 * 色卡选择器 — 折叠式抽屉控件，省空间。
 * 折叠态：单行 — 当前色卡缩略图 + 名称 + 收起箭头。
 * 展开态：内嵌面板，列出所有色卡 + 强度滑块；选中后自动收起。
 *
 * @param {string|null} activeId
 * @param {(id:string|null)=>void} onChange
 * @param {number} strength  0~100
 * @param {(v:number)=>void} onStrengthChange
 * @param {boolean} disabled
 */
export default function ColorPaletteSelector({
  activeId, onChange, strength, onStrengthChange, disabled,
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const active = activeId ? PALETTE_MAP[activeId] : null

  const handlePick = (id) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <div
      className={`palette-drawer ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="palette-trigger"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
      >
        <PaletteThumb palette={active} fallbackIcon/>
        <div className="palette-trigger-text">
          <div className="palette-trigger-name">{active ? active.name : '原色（不映射）'}</div>
          <div className="palette-trigger-desc">
            {active ? `${active.desc} · 强度 ${strength}%` : '点击选择色卡'}
          </div>
        </div>
        <ChevronDown size={14} strokeWidth={1.8} className="palette-trigger-chevron"/>
      </button>

      {open && (
        <div className="palette-pop">
          <button
            type="button"
            className={`palette-pop-item ${!activeId ? 'active' : ''}`}
            onClick={() => handlePick(null)}
          >
            <span className="palette-pop-thumb origin">
              <Palette size={13} strokeWidth={1.6}/>
            </span>
            <span className="palette-pop-info">
              <span className="palette-pop-name">原色（不映射）</span>
              <span className="palette-pop-desc">保留印花的原始配色</span>
            </span>
            {!activeId && <Check size={14} strokeWidth={2}/>}
          </button>

          {COLOR_PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`palette-pop-item ${activeId === p.id ? 'active' : ''}`}
              onClick={() => handlePick(p.id)}
              title={p.desc}
            >
              <PaletteThumb palette={p} className="palette-pop-thumb"/>
              <span className="palette-pop-info">
                <span className="palette-pop-name">{p.name}</span>
                <span className="palette-pop-desc">{p.desc}</span>
              </span>
              {activeId === p.id && <Check size={14} strokeWidth={2}/>}
            </button>
          ))}

          {activeId && (
            <div className="palette-pop-strength">
              <div className="palette-pop-strength-head">
                <span>映射强度</span>
                <span className="palette-pop-strength-value">{strength}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={strength}
                onChange={(e) => onStrengthChange(Number(e.target.value))}
                className="palette-pop-strength-slider"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** 色卡 8 色缩略图 — 复用于 trigger 和 popover */
function PaletteThumb({ palette, className = 'palette-trigger-thumb', fallbackIcon = false }) {
  if (!palette) {
    return (
      <span className={`${className} origin`}>
        {fallbackIcon ? <Palette size={13} strokeWidth={1.6}/> : null}
      </span>
    )
  }
  const order = palette.swatchOrder || palette.colors
  return (
    <span className={className}>
      {order.slice(0, 8).map((c) => (
        <span key={c} className="palette-dot" style={{ background: c }}/>
      ))}
    </span>
  )
}
