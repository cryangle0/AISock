import { useRef } from 'react'
import './ParamsPanel.css'
import {
  Save, ShoppingBag, Upload, Eraser, RotateCcw, Eye, EyeOff,
  Download, Image as ImageIcon,
} from 'lucide-react'

export default function ParamsPanel({
  printImage,
  printName,
  params,
  onParamsChange,
  onUploadFile,
  onClearPrint,
  onResetParams,
  onDownload,
  onSaveDesign,
  onOpenOrder,
}) {
  const fileInputRef = useRef(null)
  const update = (k, v) => onParamsChange({ ...params, [k]: v })

  const handlePick = () => fileInputRef.current?.click()
  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) onUploadFile?.(f)
    e.target.value = ''
  }

  return (
    <aside className="params-panel">
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

      <div className="params-section">
        <div className="section-title">印花调节</div>
        <Slider
          label="图片缩放"
          value={params.density}
          onChange={(v) => update('density', v)}
          min={50} max={300} unit="%"
        />
        {!params.singleMode && (
          <Slider
            label="平铺密度"
            value={params.tileDensity}
            onChange={(v) => update('tileDensity', v)}
            min={1} max={10} unit="列"
          />
        )}
        <Slider
          label="图片旋转"
          value={params.rotation}
          onChange={(v) => update('rotation', v)}
          min={0} max={360} unit="°"
        />
      </div>

      <div className="params-section">
        <div className="section-title">铺满模式</div>
        <div className="seg-control">
          <button
            className={`seg-btn ${params.singleMode ? 'active' : ''}`}
            onClick={() => update('singleMode', true)}
          >
            单张
          </button>
          <button
            className={`seg-btn ${!params.singleMode ? 'active' : ''}`}
            onClick={() => update('singleMode', false)}
          >
            平铺
          </button>
        </div>
        <div className="action-row tight">
          <button className="action-btn ghost" onClick={onResetParams}>
            <RotateCcw size={12} strokeWidth={1.6}/>
            重置参数
          </button>
          <button
            className={`action-btn ghost ${params.debugMode ? 'active' : ''}`}
            onClick={() => update('debugMode', !params.debugMode)}
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
