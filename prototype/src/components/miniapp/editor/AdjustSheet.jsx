/**
 * AdjustSheet — "调节" 板块（缩放 / 旋转 / 单张-平铺 / 平铺密度 / 蒙版）
 */
import { Eye, EyeOff, RotateCcw } from 'lucide-react'

export default function AdjustSheet({
  params,
  onParamsChange,
  onResetParams,
  disabled,
}) {
  const update = (k, v) => onParamsChange({ ...params, [k]: v })

  return (
    <div className="mp-sheet-body">
      <Slider
        label="图片缩放"
        value={params.density}
        onChange={(v) => update('density', v)}
        min={50} max={300} unit="%"
        disabled={disabled}
      />
      {!params.singleMode && (
        <Slider
          label="平铺密度"
          value={params.tileDensity}
          onChange={(v) => update('tileDensity', v)}
          min={1} max={10} unit="列"
          disabled={disabled}
        />
      )}
      <Slider
        label="图片旋转"
        value={params.rotation}
        onChange={(v) => update('rotation', v)}
        min={0} max={360} unit="°"
        disabled={disabled}
      />

      <div className="mp-seg-control">
        <button
          className={`mp-seg-btn ${params.singleMode ? 'active' : ''}`}
          onClick={() => update('singleMode', true)}
        >
          单张
        </button>
        <button
          className={`mp-seg-btn ${!params.singleMode ? 'active' : ''}`}
          onClick={() => update('singleMode', false)}
        >
          平铺
        </button>
      </div>

      <div className="mp-action-row">
        <button className="mp-mini-btn" onClick={onResetParams}>
          <RotateCcw size={11} /> 重置参数
        </button>
        <button
          className={`mp-mini-btn ${params.debugMode ? 'active' : ''}`}
          onClick={() => update('debugMode', !params.debugMode)}
        >
          {params.debugMode
            ? <><EyeOff size={11} /> 关闭蒙版</>
            : <><Eye size={11} /> 查看蒙版</>}
        </button>
      </div>
    </div>
  )
}

function Slider({ label, value, onChange, min, max, unit, disabled }) {
  return (
    <div className={`mp-slider-row ${disabled ? 'disabled' : ''}`}>
      <div className="mp-slider-head">
        <span>{label}</span>
        <span className="mp-slider-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mp-slider"
      />
    </div>
  )
}
