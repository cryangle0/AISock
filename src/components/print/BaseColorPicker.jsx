import { Check } from 'lucide-react'
import './BaseColorPicker.css'
import { BASE_COLOR_PRESETS } from './printConstants'

/**
 * 通用色板选择器 — 在底色 / 袜跟 / 袜头 三处复用
 *
 * @param {string} label             区段标题（如"袜身底色"）
 * @param {string|null} value        当前选中的 hex；null 表示"自动/跟印花"
 * @param {(hex:string|null)=>void} onChange
 * @param {boolean} allowAuto        是否允许"自动跟印花"（袜跟/袜头通常允许；底色可设为可选）
 * @param {boolean} disabled
 */
export default function BaseColorPicker({
  label, value, onChange, allowAuto = true, disabled = false,
}) {
  const presets = allowAuto
    ? BASE_COLOR_PRESETS
    : BASE_COLOR_PRESETS.filter((p) => p.value !== 'auto')

  return (
    <div className={`base-color ${disabled ? 'disabled' : ''}`}>
      {label && <div className="base-color-label">{label}</div>}
      <div className="base-color-grid">
        {presets.map((p) => {
          const active = (p.hex == null && value == null) || (p.hex && p.hex === value)
          return (
            <button
              key={p.value}
              type="button"
              className={`base-color-chip ${active ? 'active' : ''} ${p.hex == null ? 'auto' : ''}`}
              onClick={() => onChange(p.hex)}
              disabled={disabled}
              title={p.label}
              style={p.hex ? { background: p.hex } : undefined}
            >
              {active && <Check size={12} strokeWidth={2.4}/>}
              {p.hex == null && <span className="base-color-auto-label">自动</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
