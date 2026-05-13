/**
 * PaletteSheet — "色卡" 板块
 * 移动版调色板（不复用 web 的 ColorPaletteSelector，因为它是 desktop drawer）
 */
import { Palette, Check } from 'lucide-react'
import { COLOR_PALETTES } from '../../print/colorPalettes'

export default function PaletteSheet({
  paletteId,
  onChange,
  strength,
  onStrengthChange,
  disabled,
}) {
  return (
    <div className={`mp-sheet-body mp-palette-sheet ${disabled ? 'disabled' : ''}`}>
      {disabled && (
        <div className="mp-palette-locked">
          需先设置印花，色卡映射才会生效
        </div>
      )}

      <button
        type="button"
        className={`mp-palette-row ${!paletteId ? 'active' : ''}`}
        onClick={() => !disabled && onChange(null)}
      >
        <span className="mp-palette-thumb origin">
          <Palette size={13} strokeWidth={1.6} />
        </span>
        <div className="mp-palette-info">
          <div className="mp-palette-name">原色（不映射）</div>
          <div className="mp-palette-desc">保留印花原始配色</div>
        </div>
        {!paletteId && <Check size={14} strokeWidth={2.4} />}
      </button>

      {COLOR_PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`mp-palette-row ${paletteId === p.id ? 'active' : ''}`}
          onClick={() => !disabled && onChange(p.id)}
        >
          <span className="mp-palette-thumb">
            {(p.swatchOrder || p.colors).slice(0, 8).map((c) => (
              <span key={c} style={{ background: c }} />
            ))}
          </span>
          <div className="mp-palette-info">
            <div className="mp-palette-name">{p.name}</div>
            <div className="mp-palette-desc">{p.desc}</div>
          </div>
          {paletteId === p.id && <Check size={14} strokeWidth={2.4} />}
        </button>
      ))}

      {paletteId && (
        <div className="mp-palette-strength">
          <div className="mp-palette-strength-head">
            <span>映射强度</span>
            <span>{strength}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={strength}
            disabled={disabled}
            onChange={(e) => onStrengthChange(Number(e.target.value))}
            className="mp-slider"
          />
        </div>
      )}
    </div>
  )
}
