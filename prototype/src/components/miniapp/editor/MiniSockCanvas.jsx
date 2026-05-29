/**
 * MiniSockCanvas — 小程序版袜版预览画布
 *
 * 直接复用 web 端的 useSockResources + renderSock 渲染管线，
 * 不带 web 端的桌面 chrome（卡片、标题栏等），只输出一张干净的 canvas。
 *
 * 对外暴露 imperative：getDataURL / download；同时通过 onResourceReady 把
 * 资源对象传给父级，便于做 AI 衍生 / 亲子袜的离屏渲染。
 */
import {
  forwardRef, useEffect, useImperativeHandle, useRef, useState,
} from 'react'
import { Image as ImageIcon } from 'lucide-react'
import useSockResources from '../../print/useSockResources'
import { renderSock } from '../../print/sockRenderer'

const loadImage = (src) => new Promise((resolve) => {
  if (!src) return resolve(null)
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = () => resolve(null)
  img.src = src
})

const MiniSockCanvas = forwardRef(function MiniSockCanvas(
  { sockTypeId, printImage, params, colors, onDropImage, onResourceReady },
  ref,
) {
  const canvasRef = useRef(null)
  const patternRef = useRef(null)
  const [hovering, setHovering] = useState(false)
  const resources = useSockResources(sockTypeId)

  // 资源就绪 → 设置画布尺寸 + 通知外部
  useEffect(() => {
    if (!resources.ready) return
    const c = canvasRef.current
    if (!c) return
    c.width = resources.meta.width
    c.height = resources.meta.height
    onResourceReady?.(resources)
    renderSock(c, resources, patternRef.current, colors, params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources.ready])

  // 印花变化 → 加载到 ref 后重绘
  useEffect(() => {
    let alive = true
    loadImage(printImage).then((img) => {
      if (!alive) return
      patternRef.current = img
      if (resources.ready) {
        renderSock(canvasRef.current, resources, patternRef.current, colors, params)
      }
    })
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printImage, resources.ready])

  // 颜色 / 参数变化 → 直接重绘（无需重 load 印花）
  useEffect(() => {
    if (!resources.ready) return
    renderSock(canvasRef.current, resources, patternRef.current, colors, params)
  }, [resources, colors, params])

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      const c = canvasRef.current
      if (!c) return ''
      try { return c.toDataURL('image/png') } catch { return '' }
    },
    download: (filename = `袜版印花_${Date.now()}.png`) => {
      const c = canvasRef.current
      if (!c) return
      const link = document.createElement('a')
      link.download = filename
      link.href = c.toDataURL('image/png')
      link.click()
    },
  }), [])

  // ----- 拖拽：移动端鼠标用户也能用 -----
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
    <div
      className={`mp-sock-canvas ${hovering ? 'hovering' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} className="mp-sock-canvas-el" />
      {!printImage && (
        <div className="mp-sock-canvas-hint">
          <ImageIcon size={18} strokeWidth={1.4} />
          <span>选择花型或上传印花</span>
        </div>
      )}
      {hovering && (
        <div className="mp-sock-canvas-drop">松开应用为印花</div>
      )}
    </div>
  )
})

export default MiniSockCanvas
