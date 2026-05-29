import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Image as ImageIcon, MousePointerClick } from 'lucide-react'
import { SOCK_TYPES } from './print/sockTypes'
import './SockPrintCanvas.css'
import useSockResources from './print/useSockResources'
import { renderSock } from './print/sockRenderer'
import { hitTestRegion } from './print/hitTest'

const loadImage = (src) => new Promise((resolve) => {
  if (!src) return resolve(null)
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = () => resolve(null)
  img.src = src
})

const SockPrintCanvas = forwardRef(function SockPrintCanvas(
  { sockTypeId, onSockTypeChange, printImage, printName, params, colors, onDropImage, onResourceReady, onRegionClick },
  ref,
) {
  const canvasRef = useRef(null)
  const patternRef = useRef(null)
  const [hovering, setHovering] = useState(false)
  const resources = useSockResources(sockTypeId)

  // 资源就绪 → 设置画布尺寸 + 通知外部
  useEffect(() => {
    if (!resources.ready) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = resources.meta.width
    canvas.height = resources.meta.height
    onResourceReady?.(resources)
    renderSock(canvas, resources, patternRef.current, colors, params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources.ready])

  // 印花图变化 → 加载到 ref 后重绘
  useEffect(() => {
    let alive = true
    loadImage(printImage).then((img) => {
      if (!alive) return
      patternRef.current = img
      if (resources.ready) {
        renderSock(canvasRef.current, resources, patternRef.current, colors, params)
      }
    })
    return () => {
      alive = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printImage, resources.ready])

  // 颜色 / 参数变化 → 直接重绘（无需重新 load 印花）
  useEffect(() => {
    if (!resources.ready) return
    renderSock(canvasRef.current, resources, patternRef.current, colors, params)
  }, [resources, colors, params])

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      const canvas = canvasRef.current
      if (!canvas) return ''
      try { return canvas.toDataURL('image/png') } catch { return '' }
    },
    download: (filename = `袜版印花_${Date.now()}.png`) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()
    },
  }), [])

  // 点击袜版命中区域 → 通知外部跳到对应颜色行
  const handleClick = (e) => {
    if (!resources.ready || !onRegionClick) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const x = (e.clientX - rect.left) * sx
    const y = (e.clientY - rect.top) * sy
    const region = hitTestRegion(resources, x, y)
    if (region) onRegionClick(region)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setHovering(true)
    e.dataTransfer.dropEffect = 'copy'
  }
  const handleDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return
    setHovering(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    setHovering(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => onDropImage?.(ev.target.result, file.name)
      reader.readAsDataURL(file)
      return
    }
    const url = e.dataTransfer.getData('text/uri-list')
      || e.dataTransfer.getData('application/x-aisock-pattern')
      || e.dataTransfer.getData('text/plain')
    const name = e.dataTransfer.getData('application/x-aisock-name') || ''
    if (url) onDropImage?.(url, name)
  }

  return (
    <div className="spc-card">
      <div className="spc-head">
        <div className="spc-head-left">
          <span className="spc-title">袜版预览</span>
          {onSockTypeChange && (
            <SockTypeDropdown
              sockTypeId={sockTypeId}
              onChange={onSockTypeChange}
            />
          )}
        </div>
        {resources.ready && resources.meta.count > 0 && (
          <span className="spc-meta">
            可印区域 {resources.meta.count.toLocaleString()} px · {resources.meta.width}×{resources.meta.height}
          </span>
        )}
      </div>

      <div
        className={`spc-stage ${hovering ? 'hovering' : ''} ${onRegionClick ? 'clickable' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} className="spc-canvas"/>

        {!printImage && (
          <div className="spc-hint">
            <div className="spc-hint-frame">
              <div className="spc-hint-icon">
                <ImageIcon size={26} strokeWidth={1.4}/>
              </div>
              <div className="spc-hint-title">把花型拖到这里</div>
              <div className="spc-hint-sub">
                <MousePointerClick size={11} strokeWidth={1.6}/>
                从左侧素材库 / AI 生成结果直接拖入，或点右侧"上传印花"
              </div>
            </div>
          </div>
        )}

        {hovering && (
          <div className="spc-drop-mask">
            <div className="spc-drop-pill">松开应用为印花</div>
          </div>
        )}
      </div>

      {printImage && (
        <div className="spc-foot">
          <span className="spc-foot-dot"/>
          当前印花：<b>{printName || '自定义图片'}</b>
        </div>
      )}
    </div>
  )
})

function SockTypeDropdown({ sockTypeId, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = SOCK_TYPES.find((s) => s.id === sockTypeId) || SOCK_TYPES[0]

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="spc-sock-dropdown" ref={ref}>
      <button
        className={`spc-sock-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 100 100" width="20" height="20" className="spc-sock-trigger-icon">
          <path d={current.iconPath} fill="none" stroke="currentColor" strokeWidth="3"/>
        </svg>
        <span className="spc-sock-trigger-name">{current.name}</span>
        <svg viewBox="0 0 24 24" width="12" height="12" className="spc-sock-trigger-chevron">
          <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="spc-sock-panel">
          {SOCK_TYPES.map((s) => (
            <button
              key={s.id}
              className={`spc-sock-option ${s.id === sockTypeId ? 'active' : ''}`}
              onClick={() => { onChange(s.id); setOpen(false) }}
            >
              <svg viewBox="0 0 100 100" width="32" height="32" className="spc-sock-option-icon">
                <path d={s.iconPath} fill={s.id === sockTypeId ? 'var(--accent-soft)' : 'none'} stroke={s.id === sockTypeId ? 'var(--blue)' : 'var(--text-muted)'} strokeWidth="2.5"/>
              </svg>
              <div className="spc-sock-option-text">
                <span className="spc-sock-option-name">{s.name}</span>
                <span className="spc-sock-option-desc">{s.desc}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SockPrintCanvas
