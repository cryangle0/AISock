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
          <span className="spc-tag">即印花工具</span>
          {onSockTypeChange && (
            <select
              className="spc-sock-select"
              value={sockTypeId}
              onChange={(e) => onSockTypeChange(e.target.value)}
            >
              {SOCK_TYPES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
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

export default SockPrintCanvas
