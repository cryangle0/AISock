import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import './BaseColorPicker.css'
import { BASE_COLOR_PRESETS, COLOR_CATEGORIES } from './printConstants'

/**
 * 通用色板选择器 — 在底色 / 袜跟 / 袜头 三处复用
 *
 * 升级要点
 *   - 分类 chips 筛选（中性 / 暖色 / 冷色 / 流行色）
 *   - 关键字搜索（按颜色名）
 *   - 单击直接选中并立刻应用
 *   - 由外部通过 active prop 高亮（用于"袜版点击命中"联动）
 *
 * @param {string} label             区段标题（如"袜身底色"）
 * @param {string|null} value        当前选中的 hex；null 表示"自动/跟印花"
 * @param {(hex:string|null)=>void} onChange
 * @param {boolean} allowAuto        是否允许"自动跟印花"
 * @param {boolean} disabled
 * @param {boolean} highlight        true 时整组以高亮态展示（用于点击袜版后聚焦）
 * @param {boolean} showFilter       是否显示分类 chips + 搜索（默认 true）
 */
export default function BaseColorPicker({
  label, value, onChange, allowAuto = true, disabled = false,
  highlight = false, showFilter = true,
}) {
  const [cat, setCat] = useState('all')
  const [query, setQuery] = useState('')

  const presets = useMemo(() => {
    let list = allowAuto
      ? BASE_COLOR_PRESETS
      : BASE_COLOR_PRESETS.filter((p) => p.value !== 'auto')
    if (cat !== 'all') list = list.filter((p) => p.category === cat || p.category === 'auto')
    if (query) list = list.filter((p) => p.label.includes(query))
    return list
  }, [allowAuto, cat, query])

  return (
    <div
      className={`base-color ${disabled ? 'disabled' : ''} ${highlight ? 'highlight' : ''}`}
      data-region={label}
    >
      {label && <div className="base-color-label">{label}</div>}

      {showFilter && (
        <div className="base-color-filter">
          <div className="base-color-cats">
            {COLOR_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`base-color-cat ${cat === c.key ? 'active' : ''}`}
                disabled={disabled}
                onClick={() => setCat(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="base-color-search">
            <Search size={11} strokeWidth={1.8} />
            <input
              placeholder="搜颜色"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      )}

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
              {active && <Check size={12} strokeWidth={2.4} />}
              {p.hex == null && <span className="base-color-auto-label">自动</span>}
            </button>
          )
        })}
        {presets.length === 0 && (
          <div className="base-color-empty">没有匹配的颜色</div>
        )}
      </div>
    </div>
  )
}
