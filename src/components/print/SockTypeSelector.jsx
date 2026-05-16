/**
 * SockTypeSelector — 袜版形状选择器
 * 共享给 web SockEditor 和小程序 BEditor，UI 跟随容器尺寸
 *
 * @param {string} value          当前选中的 sockTypeId
 * @param {(id:string)=>void} onChange
 * @param {'compact'|'full'} variant  小程序用 compact，web 用 full
 */
import { Check } from 'lucide-react'
import { SOCK_TYPES } from './sockTypes'
import './SockTypeSelector.css'

export default function SockTypeSelector({ value, onChange, variant = 'full' }) {
  return (
    <div className={`sock-type-selector sts-${variant}`} role="radiogroup" aria-label="袜版形状">
      {SOCK_TYPES.map((t) => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`sts-item ${active ? 'active' : ''}`}
            onClick={() => onChange?.(t.id)}
            title={t.desc}
          >
            <svg viewBox="0 0 100 100" className="sts-icon" aria-hidden="true">
              <path
                d={t.iconPath}
                fill="currentColor"
                opacity={active ? 0.9 : 0.55}
              />
            </svg>
            <span className="sts-name">{t.name}</span>
            {variant === 'full' && <span className="sts-desc">{t.desc}</span>}
            {active && (
              <span className="sts-check" aria-hidden="true">
                <Check size={10} strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
