import { useEffect, useRef, useState, useCallback } from 'react'
import { Upload, Download, RotateCcw, Layers, Eraser, Eye, EyeOff } from 'lucide-react'
import './ImageTool.css'

// 静态资源路径 — Vite 会把 BASE_URL 注入为 /AISock/（生产）或 / （dev）
const ASSET = (name) => `${import.meta.env.BASE_URL}image-tool/${name}`

// 加载单张图片，转 HTMLImageElement，失败返回 null（保持初始化弹性）
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
  const tmp = canvas
  tmp.width = w
  tmp.height = h
  const tctx = tmp.getContext('2d')
  tctx.clearRect(0, 0, w, h)
  tctx.drawImage(maskImg, 0, 0, w, h)
  const { data } = tctx.getImageData(0, 0, w, h)
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

// 把 mask 渲染成纯白 RGBA 缓存画布，供 source-in 裁剪复用
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

// 直方图法提取主色调（缩到 100x100，量化 RGB 到 32 一档）
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

export default function ImageTool() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  // 资源 / 蒙版数据 — 用 ref 而非 state，避免重渲染依赖
  const sockImageRef = useRef(null)
  const lineartImageRef = useRef(null)
  const maskRef = useRef(null) // { mask, count, bounds }
  const maskCanvasRef = useRef(null)
  const otherMaskRef = useRef(null)
  const sockPixelsRef = useRef(null)
  const patternImageRef = useRef(null)
  const dominantColorRef = useRef(null)

  const [ready, setReady] = useState(false)
  const [hasPattern, setHasPattern] = useState(false)
  const [density, setDensity] = useState(100) // 100..300 缩放百分比
  const [tileDensity, setTileDensity] = useState(3) // 1..10 列
  const [rotation, setRotation] = useState(0) // 0..360
  const [singleMode, setSingleMode] = useState(true)
  const [debugMode, setDebugMode] = useState(false)
  const [statusMsg, setStatusMsg] = useState('正在加载袜版资源…')
  // 把初始化后从 ref 算出来的"渲染相关元数据"提到 state，避免 render 中读 ref
  const [meta, setMeta] = useState({ count: 0, width: 0, height: 0 })

  // 主绘制 — 任一参数变化都触发
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !sockImageRef.current) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(sockImageRef.current, 0, 0)

    // 袜跟袜头主色填充
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

    // 印花
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
      const rad = (rotation * Math.PI) / 180
      const scale = density / 100
      const ratio = pattern.width / pattern.height

      pctx.save()
      pctx.translate(cx, cy)
      pctx.rotate(rad)

      if (singleMode) {
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
        const baseSize = (ratio > 1 ? sockW : sockH) / tileDensity * scale
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

      // 蒙版裁剪（source-in）
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

    // 线稿叠加
    if (lineartImageRef.current) {
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(lineartImageRef.current, 0, 0, w, h)
      ctx.restore()
    }

    // 调试蒙版（半透明绿色）
    if (debugMode && maskRef.current) {
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
  }, [density, tileDensity, rotation, singleMode, debugMode])

  // 初始化资源 — 仅一次
  useEffect(() => {
    let cancelled = false
    Promise.all([
      loadImage(ASSET('sock.png')),
      loadImage(ASSET('mask.png')),
      loadImage(ASSET('othermask.png')),
      loadImage(ASSET('lineart.png')),
    ]).then(([sock, mask, otherMask, lineart]) => {
      if (cancelled) return
      if (!sock) {
        setStatusMsg('袜版底图加载失败，无法继续')
        return
      }
      sockImageRef.current = sock
      lineartImageRef.current = lineart
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = sock.width
      canvas.height = sock.height

      // 缓存袜版原始像素（用于颜色填充判断 alpha）
      const tmpA = document.createElement('canvas')
      tmpA.width = sock.width
      tmpA.height = sock.height
      const tctxA = tmpA.getContext('2d')
      tctxA.drawImage(sock, 0, 0)
      sockPixelsRef.current = tctxA.getImageData(0, 0, sock.width, sock.height).data

      // 主蒙版 — 无 mask.png 时回退用底图反色
      const fallbackMask = mask || sock
      const tmpB = document.createElement('canvas')
      const built = buildBinaryMask(tmpB, fallbackMask, sock.width, sock.height)
      maskRef.current = built
      maskCanvasRef.current = buildMaskCanvas(built.mask, sock.width, sock.height)

      // 颜色填充蒙版（袜跟+袜头）
      if (otherMask) {
        const tmpC = document.createElement('canvas')
        const otherBuilt = buildBinaryMask(tmpC, otherMask, sock.width, sock.height)
        otherMaskRef.current = otherBuilt.mask
      }

      setMeta({ count: built.count, width: sock.width, height: sock.height })
      setReady(true)
      setStatusMsg('就绪 — 上传印花图开始预览')
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 重绘
  useEffect(() => {
    if (ready) drawCanvas()
  }, [ready, drawCanvas, hasPattern])

  const handleUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatusMsg('请选择图片文件')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        patternImageRef.current = img
        dominantColorRef.current = extractDominantColor(img)
        setDensity(100)
        setHasPattern(true)
        setStatusMsg(`印花上传成功 ${img.width}×${img.height}`)
        drawCanvas()
      }
      img.onerror = () => setStatusMsg('图片解析失败')
      img.src = e.target.result
    }
    reader.onerror = () => setStatusMsg('文件读取失败')
    reader.readAsDataURL(file)
  }

  const handleClearPattern = () => {
    patternImageRef.current = null
    dominantColorRef.current = null
    setHasPattern(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setStatusMsg('印花已清除')
    drawCanvas()
  }

  const handleReset = () => {
    setDensity(100)
    setTileDensity(3)
    setRotation(0)
    setStatusMsg('参数已重置')
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const wasDebug = debugMode
    if (wasDebug) {
      setDebugMode(false)
      // 立即重绘一帧后再导出 — 用 requestAnimationFrame
      requestAnimationFrame(() => {
        const link = document.createElement('a')
        link.download = `袜版印花_${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        setDebugMode(true)
      })
    } else {
      const link = document.createElement('a')
      link.download = `袜版印花_${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    setStatusMsg('图片已导出')
  }

  return (
    <div className="image-tool">
      <header className="page-header">
        <div>
          <h1 className="page-title">印花工具</h1>
          <p className="page-sub">{statusMsg}</p>
        </div>
      </header>

      <div className="it-layout">
        <section className="it-canvas-card" ref={containerRef}>
          <div className="it-canvas-head">
            <span>袜版预览</span>
            {ready && meta.count > 0 && (
              <span className="it-meta">
                可印区域 {meta.count.toLocaleString()} px · 画布 {meta.width}×{meta.height}
              </span>
            )}
          </div>
          <div className="it-canvas-stage">
            <canvas ref={canvasRef} className="it-canvas"/>
          </div>
        </section>

        <aside className="it-panel">
          <div className="it-section">
            <div className="it-section-title">上传印花</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              hidden
            />
            <button
              className="it-btn it-btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} strokeWidth={1.8}/>
              选择印花图片
            </button>
          </div>

          <div className="it-section">
            <div className="it-section-title">印花调节</div>

            <Slider
              label="图片缩放"
              value={density}
              onChange={setDensity}
              min={100} max={300} unit="%"
            />

            {!singleMode && (
              <Slider
                label="平铺密度"
                value={tileDensity}
                onChange={setTileDensity}
                min={1} max={10} unit="列"
              />
            )}

            <Slider
              label="图片旋转"
              value={rotation}
              onChange={setRotation}
              min={0} max={360} unit="°"
            />
          </div>

          <div className="it-section">
            <div className="it-section-title">操作</div>
            <div className="it-btn-row">
              <button
                className="it-btn it-btn-ghost"
                onClick={() => setSingleMode((v) => !v)}
              >
                <Layers size={13} strokeWidth={1.8}/>
                {singleMode ? '单张模式' : '平铺模式'}
              </button>
              <button className="it-btn it-btn-ghost" onClick={handleReset}>
                <RotateCcw size={13} strokeWidth={1.8}/>
                重置
              </button>
            </div>
            <div className="it-btn-row">
              <button
                className="it-btn it-btn-ghost"
                onClick={handleClearPattern}
                disabled={!hasPattern}
              >
                <Eraser size={13} strokeWidth={1.8}/>
                清除印花
              </button>
              <button
                className={`it-btn it-btn-ghost ${debugMode ? 'active' : ''}`}
                onClick={() => setDebugMode((v) => !v)}
              >
                {debugMode ? <EyeOff size={13} strokeWidth={1.8}/> : <Eye size={13} strokeWidth={1.8}/>}
                {debugMode ? '关闭蒙版' : '查看蒙版'}
              </button>
            </div>
            <button
              className="it-btn it-btn-primary it-btn-full"
              onClick={handleDownload}
              disabled={!ready}
            >
              <Download size={14} strokeWidth={1.8}/>
              导出 PNG
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Slider({ label, value, onChange, min, max, unit }) {
  return (
    <div className="it-slider-row">
      <div className="it-slider-head">
        <span>{label}</span>
        <span className="it-slider-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="it-slider"
      />
    </div>
  )
}
