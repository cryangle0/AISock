/**
 * PaletteSheet —— "推荐色" 板块（原"色卡"）
 *
 * 重做为基于场景/搭配的推荐式选择：
 *   - 顶部场景标签：热门 / 通勤 / 居家 / 运动 / 节日
 *   - 推荐卡片：每张卡显示主题名 + 描述 + 5 色样本 + 推荐理由
 *   - 选中后，下方出现强度滑杆
 *
 * 数据基于现有 COLOR_PALETTES，附加 `tags` 与 `vibe` 字段做归类。
 */
import { useMemo, useState } from 'react'
import { Sparkles, Check, TrendingUp, Briefcase, Sofa, Activity, Gift } from 'lucide-react'
import { COLOR_PALETTES } from '../../print/colorPalettes'

// 场景与推荐内容的元数据
const SCENES = [
  { key: 'hot',     label: '热门',  icon: TrendingUp },
  { key: 'work',    label: '通勤',  icon: Briefcase },
  { key: 'casual',  label: '居家',  icon: Sofa },
  { key: 'sport',   label: '运动',  icon: Activity },
  { key: 'holiday', label: '节日',  icon: Gift },
]

// 把每个色卡 id 归入若干场景；同时给 vibe（推荐理由）
const PALETTE_META = {
  fuchun:   { vibe: '雅致山水 · 文艺男女通用', scenes: ['hot', 'casual'] },
  morandi:  { vibe: '低饱和静物 · 冷感不挑人', scenes: ['hot', 'work', 'casual'] },
  dunhuang: { vibe: '矿物厚重 · 节日礼盒首选', scenes: ['hot', 'holiday'] },
  macaron:  { vibe: '少女糖果 · 居家与亲子袜', scenes: ['casual', 'holiday'] },
  guochao:  { vibe: '帝王红 · 通勤与新中式',   scenes: ['hot', 'work', 'holiday'] },
  ocean:    { vibe: '潮汐白沙 · 运动与日常',   scenes: ['sport', 'casual', 'hot'] },
}

export default function PaletteSheet({
  paletteId,
  onChange,
  strength,
  onStrengthChange,
  disabled,
}) {
  const [scene, setScene] = useState('hot')

  const recommended = useMemo(() => {
    return COLOR_PALETTES.filter((p) => {
      const meta = PALETTE_META[p.id]
      if (!meta) return scene === 'hot'
      return meta.scenes.includes(scene)
    })
  }, [scene])

  return (
    <div className={`mp-sheet-body mp-recommend-sheet ${disabled ? 'disabled' : ''}`}>
      {disabled && (
        <div className="mp-palette-locked">
          <Sparkles size={11} strokeWidth={1.8}/>
          <span>需先设置印花，推荐配色才会生效</span>
        </div>
      )}

      {/* 场景切换 */}
      <div className="mp-recommend-scenes">
        {SCENES.map((s) => {
          const Icon = s.icon
          const active = s.key === scene
          return (
            <button
              key={s.key}
              className={`mp-recommend-scene ${active ? 'active' : ''}`}
              onClick={() => setScene(s.key)}
            >
              <Icon size={11} strokeWidth={1.8}/>
              <span>{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* 取消映射（保留原色） */}
      <button
        type="button"
        className={`mp-recommend-card mp-recommend-origin ${!paletteId ? 'active' : ''}`}
        onClick={() => !disabled && onChange(null)}
      >
        <div className="mp-recommend-card-head">
          <div className="mp-recommend-card-title">原色 · 不映射</div>
          {!paletteId && <Check size={12} strokeWidth={2.4}/>}
        </div>
        <div className="mp-recommend-card-vibe">保留印花原始配色，看真实效果</div>
      </button>

      {/* 推荐卡片 */}
      {recommended.map((p) => {
        const meta = PALETTE_META[p.id] || {}
        const active = paletteId === p.id
        const swatches = (p.swatchOrder || p.colors).slice(0, 5)
        return (
          <button
            key={p.id}
            type="button"
            className={`mp-recommend-card ${active ? 'active' : ''}`}
            onClick={() => !disabled && onChange(p.id)}
          >
            <div className="mp-recommend-card-head">
              <div className="mp-recommend-card-title">{p.name}</div>
              {active && <Check size={12} strokeWidth={2.4}/>}
            </div>
            <div className="mp-recommend-card-vibe">{meta.vibe || p.desc}</div>
            <div className="mp-recommend-card-swatches">
              {swatches.map((c) => (
                <span key={c} style={{ background: c }} />
              ))}
            </div>
          </button>
        )
      })}

      {recommended.length === 0 && (
        <div className="mp-empty-state">
          <p>该场景下暂无推荐</p>
          <small>试试切换其他场景标签</small>
        </div>
      )}

      {paletteId && !disabled && (
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
