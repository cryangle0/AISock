import { useRef } from 'react'
import './ParamsPanel.css'
import {
  Save, ShoppingBag, Upload, Eraser, RotateCcw, Eye, EyeOff,
  Download, Image as ImageIcon, Sparkles, Heart,
} from 'lucide-react'
import BaseColorPicker from './print/BaseColorPicker'
import ColorPaletteSelector from './print/ColorPaletteSelector'

export default function ParamsPanel({
  printImage,
  printName,
  params,
  colors,
  paletteId,
  paletteStrength,
  showHeelToeSeparate,
  onParamsChange,
  onColorsChange,
  onPaletteChange,
  onPaletteStrengthChange,
  onUploadFile,
  onClearPrint,
  onResetParams,
  onDownload,
  onSaveDesign,
  onOpenOrder,
  onAiExtend,
  onFamilyPair,
}) {
  const fileInputRef = useRef(null)
  const updateParam = (k, v) => onParamsChange({ ...params, [k]: v })
  const updateColor = (k, v) => onColorsChange({ ...colors, [k]: v })

  const handlePick = () => fileInputRef.current?.click()
  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) onUploadFile?.(f)
    e.target.value = ''
  }

  return (
    <aside className="params-panel">
      {/* ── 当前印花 ───────────── */}
      <div className="params-section">
        <div className="section-title">
          当前印花
          {printImage && <span className="region-badge ellipsis">{printName || '自定义'}</span>}
        </div>
        <div className="print-preview">
          {printImage ? (
            <img src={printImage} alt="当前印花"/>
          ) : (
            <div className="print-empty">
              <ImageIcon size={20} strokeWidth={1.4}/>
              <span>尚未设置印花</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          hidden
        />
        <button className="action-btn primary" onClick={handlePick}>
          <Upload size={13} strokeWidth={1.6}/>
          {printImage ? '更换印花图片' : '上传印花图片'}
        </button>
      </div>

      {/* ── 印花调节 ───────────── */}
      <div className="params-section">
        <div className="section-title">印花调节</div>
        <Slider
          label="图片缩放"
          value={params.density}
          onChange={(v) => updateParam('density', v)}
          min={50} max={300} unit="%"
          disabled={!printImage}
        />
        {!params.singleMode && (
          <Slider
            label="平铺密度"
            value={params.tileDensity}
            onChange={(v) => updateParam('tileDensity', v)}
            min={1} max={10} unit="列"
            disabled={!printImage}
          />
        )}
        <Slider
          label="图片旋转"
          value={params.rotation}
          onChange={(v) => updateParam('rotation', v)}
          min={0} max={360} unit="°"
          disabled={!printImage}
        />
        <div className="seg-control two">
          <button
            className={`seg-btn ${params.singleMode ? 'active' : ''}`}
            onClick={() => updateParam('singleMode', true)}
          >
            单张
          </button>
          <button
            className={`seg-btn ${!params.singleMode ? 'active' : ''}`}
            onClick={() => updateParam('singleMode', false)}
          >
            平铺
          </button>
        </div>
      </div>

      {/* ── 颜色 ───────────── */}
      <div className="params-section">
        <div className="section-title">颜色</div>
        <BaseColorPicker
          label="袜身底色"
          value={colors.bodyHex}
          onChange={(v) => updateColor('bodyHex', v)}
          allowAuto
        />
        {showHeelToeSeparate ? (
          <>
            <BaseColorPicker
              label="袜跟"
              value={colors.heelHex}
              onChange={(v) => updateColor('heelHex', v)}
            />
            <BaseColorPicker
              label="袜头"
              value={colors.toeHex}
              onChange={(v) => updateColor('toeHex', v)}
            />
          </>
        ) : (
          <BaseColorPicker
            label="袜跟+袜头"
            value={colors.heelHex}
            onChange={(v) => {
              updateColor('heelHex', v)
              updateColor('toeHex', v)
            }}
          />
        )}
      </div>

      {/* ── 色卡映射 ───────────── */}
      <div className="params-section">
        <div className="section-title">
          色卡映射
          {!printImage && <span className="region-badge muted">需先设置印花</span>}
        </div>
        <ColorPaletteSelector
          activeId={paletteId}
          onChange={onPaletteChange}
          strength={paletteStrength}
          onStrengthChange={onPaletteStrengthChange}
          disabled={!printImage}
        />
      </div>

      {/* ── 操作 ───────────── */}
      <div className="params-section">
        <div className="section-title">操作</div>
        <div className="action-row">
          <button
            className="action-btn ghost"
            onClick={onAiExtend}
            disabled={!printImage}
            title="基于当前印花生成 4 个延伸方向"
          >
            <Sparkles size={13} strokeWidth={1.6}/>
            同款延伸
          </button>
          <button
            className="action-btn ghost"
            onClick={onFamilyPair}
            disabled={!printImage}
            title="衍生亲子袜（成人 + 儿童）"
          >
            <Heart size={13} strokeWidth={1.6}/>
            亲子袜
          </button>
        </div>
        <div className="action-row tight">
          <button className="action-btn ghost" onClick={onResetParams}>
            <RotateCcw size={12} strokeWidth={1.6}/>
            重置参数
          </button>
          <button
            className={`action-btn ghost ${params.debugMode ? 'active' : ''}`}
            onClick={() => updateParam('debugMode', !params.debugMode)}
          >
            {params.debugMode
              ? <><EyeOff size={12} strokeWidth={1.6}/>关闭蒙版</>
              : <><Eye size={12} strokeWidth={1.6}/>查看蒙版</>}
          </button>
        </div>
        <button
          className="action-btn ghost full"
          onClick={onClearPrint}
          disabled={!printImage}
        >
          <Eraser size={12} strokeWidth={1.6}/>
          清除当前印花
        </button>
      </div>

      {/* ── 保存 / 下单 ───────────── */}
      <div className="params-actions">
        <button className="action-btn outline" onClick={onDownload} disabled={!printImage}>
          <Download size={13} strokeWidth={1.6}/>
          导出袜版 PNG
        </button>
        <div className="action-row">
          <button className="action-btn ghost" onClick={onSaveDesign}>
            <Save size={13} strokeWidth={1.6}/>
            保存
          </button>
          <button className="action-btn primary" onClick={onOpenOrder}>
            <ShoppingBag size={13} strokeWidth={1.6}/>
            下单
          </button>
        </div>
      </div>
    </aside>
  )
}

function Slider({ label, value, onChange, min, max, unit, disabled }) {
  return (
    <div className={`slider-row ${disabled ? 'disabled' : ''}`}>
      <div className="slider-head">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
      />
    </div>
  )
}
