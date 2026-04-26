import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Image as ImageIcon, MousePointerClick } from 'lucide-react'
import './SockPrintCanvas.css'

const ASSET = (name) => `${import.meta.env.BASE_URL}image-tool/${name}`

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

// 从蒙版图建二值数组（白=可印=1）+ 边界
const buildBinaryMask = (canvas, maskImg, w, h) => {
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(maskImg, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  const mask = new Uint8Array(w * h)
  let count = 0
  let minX = w
  let maxX = 0
  let minY = h
  let maxY = 0
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (brightness > 128 && data[i + 3] > 100) {
      const px = i / 4
      mask[px] = 1
      count += 1
      const x = px % w
      const y = Math.floor(px / w)
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return { mask, count, bounds: { minX, minY, maxX, maxY } }
}

const buildMaskCanvas = (mask, w, h) => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const imgData = ctx.createImageData(w, h)
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i] === 1) {
      const idx = i * 4
      imgData.data[idx] = 255
      imgData.data[idx + 1] = 255
      imgData.data[idx + 2] = 255
      imgData.data[idx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)
  return canvas
}

const extractDominantColor = (image) => {
  const tmp = document.createElement('canvas')
  const size = 100
  tmp.width = size
  tmp.height = size
  const ctx = tmp.getContext('2d')
  ctx.drawImage(image, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  const map = new Map()
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 128) continue
    const r = (data[i] >> 5) << 5
    const g = (data[i + 1] >> 5) << 5
    const b = (data[i + 2] >> 5) << 5
    const key = (r << 16) | (g << 8) | b
    map.set(key, (map.get(key) || 0) + 1)
  }
  let bestKey = -1
  let bestCount = 0
  for (const [k, v] of map.entries()) {
    if (v > bestCount) {
      bestCount = v
      bestKey = k
    }
  }
  if (bestKey < 0) return { r: 200, g: 200, b: 200 }
  return { r: (bestKey >> 16) & 0xff, g: (bestKey >> 8) & 0xff, b: bestKey & 0xff }
}

const SockPrintCanvas = forwardRef(function SockPrintCanvas(
  { printImage, printName, params, onDropImage, onStatusChange },
  ref,
) {
  const canvasRef = useRef(null)

  const sockImageRef = useRef(null)
  const lineartImageRef = useRef(null)
  const maskRef = useRef(null)
  const maskCanvasRef = useRef(null)
  const otherMaskRef = useRef(null)
  const sockPixelsRef = useRef(null)
  const patternImageRef = useRef(null)
  const dominantColorRef = useRef(null)

  const [ready, setReady] = useState(false)
  const [meta, setMeta] = useState({ count: 0, width: 0, height: 0 })
  const [hovering, setHovering] = useState(false)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !sockImageRef.current) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(sockImageRef.current, 0, 0)

    const otherMask = otherMaskRef.current
    const sockPixels = sockPixelsRef.current
    const dom = dominantColorRef.current
    if (patternImageRef.current && otherMask && sockPixels && dom) {
      const tmp = document.createElement('canvas')
      tmp.width = w
      tmp.height = h
      const tctx = tmp.getContext('2d')
      const imgData = tctx.createImageData(w, h)
      for (let i = 0; i < otherMask.length; i += 1) {
        const idx = i * 4
        if (otherMask[i] === 1 && sockPixels[idx + 3] > 0) {
          imgData.data[idx] = dom.r
          imgData.data[idx + 1] = dom.g
          imgData.data[idx + 2] = dom.b
          imgData.data[idx + 3] = 255
        }
      }
      tctx.putImageData(imgData, 0, 0)
      ctx.drawImage(tmp, 0, 0)
    }

    if (patternImageRef.current && maskRef.current) {
      const pattern = patternImageRef.current
      const { bounds } = maskRef.current
      const sockW = bounds.maxX - bounds.minX
      const sockH = bounds.maxY - bounds.minY
      const cx = (bounds.minX + bounds.maxX) / 2
      const cy = (bounds.minY + bounds.maxY) / 2

      const patternCanvas = document.createElement('canvas')
      patternCanvas.width = w
      patternCanvas.height = h
      const pctx = patternCanvas.getContext('2d')
      const rad = (params.rotation * Math.PI) / 180
      const scale = params.density / 100
      const ratio = pattern.width / pattern.height

      pctx.save()
      pctx.translate(cx, cy)
      pctx.rotate(rad)

      if (params.singleMode) {
        let drawW
        let drawH
        const sockRatio = sockW / sockH
        if (ratio > sockRatio) {
          drawH = sockH * scale
          drawW = drawH * ratio
        } else {
          drawW = sockW * scale
          drawH = drawW / ratio
        }
        pctx.drawImage(pattern, -drawW / 2, -drawH / 2, drawW, drawH)
      } else {
        const baseSize = (ratio > 1 ? sockW : sockH) / params.tileDensity * scale
        const singleW = baseSize
        const singleH = baseSize / ratio
        const cols = Math.ceil(sockW / singleW) + 2
        const rows = Math.ceil(sockH / singleH) + 2
        const startX = -(cols * singleW) / 2
        const startY = -(rows * singleH) / 2
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) {
            pctx.drawImage(
              pattern,
              startX + c * singleW,
              startY + r * singleH,
              singleW,
              singleH,
            )
          }
        }
      }
      pctx.restore()

      if (maskCanvasRef.current) {
        const clipped = document.createElement('canvas')
        clipped.width = w
        clipped.height = h
        const cctx = clipped.getContext('2d')
        cctx.drawImage(maskCanvasRef.current, 0, 0)
        cctx.globalCompositeOperation = 'source-in'
        cctx.drawImage(patternCanvas, 0, 0)
        ctx.drawImage(clipped, 0, 0)
      }
    }

    if (lineartImageRef.current) {
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(lineartImageRef.current, 0, 0, w, h)
      ctx.restore()
    }

    if (params.debugMode && maskRef.current) {
      const tmp = document.createElement('canvas')
      tmp.width = w
      tmp.height = h
      const tctx = tmp.getContext('2d')
      const imgData = tctx.createImageData(w, h)
      const m = maskRef.current.mask
      for (let i = 0; i < m.length; i += 1) {
        if (m[i] === 1) {
          imgData.data[i * 4 + 1] = 200
          imgData.data[i * 4 + 3] = 100
        }
      }
      tctx.putImageData(imgData, 0, 0)
      ctx.drawImage(tmp, 0, 0)
    }
  }, [params])

  // 一次性加载袜版 / 蒙版资源
  useEffect(() => {
    let cancelled = false
    onStatusChange?.('正在加载袜版资源…')
    Promise.all([
      loadImage(ASSET('sock.png')),
      loadImage(ASSET('mask.png')),
      loadImage(ASSET('othermask.png')),
      loadImage(ASSET('lineart.png')),
    ]).then(([sock, mask, otherMask, lineart]) => {
      if (cancelled) return
      if (!sock) {
        onStatusChange?.('袜版底图加载失败，无法继续')
        return
      }
      sockImageRef.current = sock
      lineartImageRef.current = lineart
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = sock.width
      canvas.height = sock.height

      const tmpA = document.createElement('canvas')
      tmpA.width = sock.width
      tmpA.height = sock.height
      const tctxA = tmpA.getContext('2d')
      tctxA.drawImage(sock, 0, 0)
      sockPixelsRef.current = tctxA.getImageData(0, 0, sock.width, sock.height).data

      const fallbackMask = mask || sock
      const tmpB = document.createElement('canvas')
      const built = buildBinaryMask(tmpB, fallbackMask, sock.width, sock.height)
      maskRef.current = built
      maskCanvasRef.current = buildMaskCanvas(built.mask, sock.width, sock.height)

      if (otherMask) {
        const tmpC = document.createElement('canvas')
        const otherBuilt = buildBinaryMask(tmpC, otherMask, sock.width, sock.height)
        otherMaskRef.current = otherBuilt.mask
      }

      setMeta({ count: built.count, width: sock.width, height: sock.height })
      setReady(true)
      onStatusChange?.('就绪 — 拖拽花型到画布即可贴印')
    })
    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 印花图变化时加载到 ref
  useEffect(() => {
    if (!printImage) {
      patternImageRef.current = null
      dominantColorRef.current = null
      if (ready) drawCanvas()
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      patternImageRef.current = img
      try {
        dominantColorRef.current = extractDominantColor(img)
      } catch {
        dominantColorRef.current = { r: 200, g: 200, b: 200 }
      }
      if (ready) drawCanvas()
    }
    img.src = printImage
  }, [printImage, ready, drawCanvas])

  useEffect(() => {
    if (ready) drawCanvas()
  }, [ready, drawCanvas])

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      const canvas = canvasRef.current
      if (!canvas) return ''
      try {
        return canvas.toDataURL('image/png')
      } catch {
        return ''
      }
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

  // 拖拽落图
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
        </div>
        {ready && meta.count > 0 && (
          <span className="spc-meta">
            可印区域 {meta.count.toLocaleString()} px · {meta.width}×{meta.height}
          </span>
        )}
      </div>

      <div
        className={`spc-stage ${hovering ? 'hovering' : ''} ${!printImage ? 'empty' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <canvas ref={canvasRef} className="spc-canvas"/>

        {!printImage && (
          <div className="spc-hint">
            <div className="spc-hint-icon">
              <ImageIcon size={26} strokeWidth={1.4}/>
            </div>
            <div className="spc-hint-title">把花型拖到这里</div>
            <div className="spc-hint-sub">
              <MousePointerClick size={11} strokeWidth={1.6}/>
              从左侧素材库 / AI 生成结果直接拖入，或点右侧"上传印花"
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
