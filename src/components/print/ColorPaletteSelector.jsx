import { Palette } from 'lucide-react'
import './ColorPaletteSelector.css'
import { COLOR_PALETTES } from './colorPalettes'

/**
 * 色卡选择器 — 卡片化展示 + 强度滑块
 *
 * @param {string|null} activeId  当前选中的色卡 id；null = 不应用映射
 * @param {(id:string|null)=>void} onChange
 * @param {number} strength  映射强度 0~100
 * @param {(v:number)=>void} onStrengthChange
 * @param {boolean} disabled  无印花时禁用
 */
export default function ColorPaletteSelector({
  activeId, onChange, strength, onStrengthChange, disabled,
}) {
  return (
    <div className={`palette-selector ${disabled ? 'disabled' : ''}`}>
      <div className="palette-row">
        <button
          className={`palette-card original ${!activeId ? 'active' : ''}`}
          onClick={() => onChange(null)}
          disabled={disabled}
          type="button"
        >
          <div className="palette-thumb origin">
            <Palette size={16} strokeWidth={1.6}/>
          </div>
          <div className="palette-meta">
            <div className="palette-name">原色</div>
            <div className="palette-desc">不做色卡映射</div>
          </div>
        </button>

        {COLOR_PALETTES.map((p) => (
          <button
            key={p.id}
            className={`palette-card ${activeId === p.id ? 'active' : ''}`}
            onClick={() => onChange(p.id)}
            disabled={disabled}
            type="button"
            title={p.desc}
          >
            <div className="palette-thumb">
              {(p.swatchOrder || p.colors).slice(0, 8).map((c) => (
                <span key={c} className="palette-dot" style={{ background: c }}/>
              ))}
            </div>
            <div className="palette-meta">
              <div className="palette-name">{p.name}</div>
              <div className="palette-desc">{p.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {activeId && (
        <div className="palette-strength">
          <div className="palette-strength-head">
            <span>映射强度</span>
            <span className="palette-strength-value">{strength}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={strength}
            disabled={disabled}
            onChange={(e) => onStrengthChange(Number(e.target.value))}
            className="palette-strength-slider"
          />
          <div className="palette-strength-hint">
            将印花上的颜色替换为色卡中"距离最近"的颜色，强度可调
          </div>
        </div>
      )}
    </div>
  )
}
