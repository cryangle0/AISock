import './ParamsPanel.css'
import { Save, Sparkles, ShoppingBag } from 'lucide-react'
import { REGION_LABELS } from './patternConstants'

const FILL_STRATEGIES = [
  { value: 'tile', label: '平铺' },
  { value: 'stretch', label: '拉伸' },
  { value: 'smart', label: '智能分块' },
]

const VARIANT_OPTIONS = [1, 2, 4]

export default function ParamsPanel({
  activeRegion,
  params,
  onParamsChange,
  onGenerateExtension,
  onSaveDesign,
  onOpenOrder,
}) {
  const update = (k, v) => onParamsChange({ ...params, [k]: v })

  return (
    <aside className="params-panel">
      <div className="params-section">
        <div className="section-title">
          当前区域
          <span className="region-badge">{REGION_LABELS[activeRegion]}</span>
        </div>

        <Slider
          label="花型密度"
          value={params.density}
          onChange={(v) => update('density', v)}
          min={20} max={100} unit="%"
        />
        <Slider
          label="旋转角度"
          value={params.rotation}
          onChange={(v) => update('rotation', v)}
          min={-180} max={180} unit="°"
        />
        <Slider
          label="花型间距"
          value={params.spacing}
          onChange={(v) => update('spacing', v)}
          min={0} max={100} unit="%"
        />
      </div>

      <div className="params-section">
        <div className="section-title">填充策略</div>
        <div className="seg-control">
          {FILL_STRATEGIES.map(s => (
            <button
              key={s.value}
              className={`seg-btn ${params.fillStrategy === s.value ? 'active' : ''}`}
              onClick={() => update('fillStrategy', s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="params-section">
        <div className="section-title">同款生成数量</div>
        <div className="seg-control">
          {VARIANT_OPTIONS.map(n => (
            <button
              key={n}
              className={`seg-btn ${params.variantCount === n ? 'active' : ''}`}
              onClick={() => update('variantCount', n)}
            >
              {n} 款
            </button>
          ))}
        </div>
      </div>

      <div className="params-actions">
        <button className="action-btn primary" onClick={onGenerateExtension}>
          <Sparkles size={14} strokeWidth={1.6}/>
          AI 同款生成
        </button>
        <div className="action-row">
          <button className="action-btn ghost" onClick={onSaveDesign}>
            <Save size={13} strokeWidth={1.6}/>
            保存
          </button>
          <button className="action-btn outline" onClick={onOpenOrder}>
            <ShoppingBag size={13} strokeWidth={1.6}/>
            下单
          </button>
        </div>
      </div>
    </aside>
  )
}

function Slider({ label, value, onChange, min, max, unit }) {
  return (
    <div className="slider-row">
      <div className="slider-head">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="slider"
      />
    </div>
  )
}
