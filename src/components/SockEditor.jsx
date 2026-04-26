import { useRef, useState } from 'react'
import './SockEditor.css'
import AssetPanel from './AssetPanel'
import SockPrintCanvas from './SockPrintCanvas'
import ParamsPanel from './ParamsPanel'
import OrderModal from './OrderModal'

const DEFAULT_PARAMS = {
  density: 100,
  tileDensity: 3,
  rotation: 0,
  singleMode: true,
  debugMode: false,
}

export default function SockEditor({ onSaveDesign, onPlaceOrder }) {
  const [printImage, setPrintImage] = useState(null)
  const [printName, setPrintName] = useState('')
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [orderOpen, setOrderOpen] = useState(false)

  const canvasRef = useRef(null)

  const applyImage = (url, name) => {
    setPrintImage(url || null)
    setPrintName(name || '')
  }

  const handleUploadFile = (file) => {
    if (!file || !file.type?.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => applyImage(e.target.result, file.name)
    reader.readAsDataURL(file)
  }

  const handleClearPrint = () => applyImage(null, '')
  const handleResetParams = () => setParams(DEFAULT_PARAMS)
  const handleDownload = () => canvasRef.current?.download?.()

  const composeName = () => printName ? `${printName} 袜款` : '未命名袜版'

  // 缩小 cover 尺寸 — 避免 localStorage 体积爆掉
  const compressDataURL = (url, maxW = 280) => new Promise((resolve) => {
    if (!url) return resolve('')
    const img = new Image()
    img.onload = () => {
      const ratio = img.width / img.height
      const w = Math.min(maxW, img.width)
      const h = w / ratio
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      try { resolve(c.toDataURL('image/png')) } catch { resolve('') }
    }
    img.onerror = () => resolve('')
    img.src = url
  })

  const handleSave = async () => {
    const raw = canvasRef.current?.getDataURL?.() || ''
    const cover = await compressDataURL(raw, 280)
    onSaveDesign?.({
      name: composeName(),
      coverImage: cover,
      printName,
      params,
    })
  }

  const handleSubmitOrder = async (data) => {
    const raw = canvasRef.current?.getDataURL?.() || ''
    const cover = await compressDataURL(raw, 280)
    onPlaceOrder?.({
      ...data,
      designName: data.designName || composeName(),
      coverImage: cover,
    })
    setOrderOpen(false)
  }

  return (
    <div className="sock-editor">
      <AssetPanel onApplyImage={applyImage}/>

      <div className="canvas-wrap">
        <SockPrintCanvas
          ref={canvasRef}
          printImage={printImage}
          printName={printName}
          params={params}
          onDropImage={applyImage}
        />
      </div>

      <ParamsPanel
        printImage={printImage}
        printName={printName}
        params={params}
        onParamsChange={setParams}
        onUploadFile={handleUploadFile}
        onClearPrint={handleClearPrint}
        onResetParams={handleResetParams}
        onDownload={handleDownload}
        onSaveDesign={handleSave}
        onOpenOrder={() => setOrderOpen(true)}
      />

      {orderOpen && (
        <OrderModal
          onClose={() => setOrderOpen(false)}
          onSubmit={handleSubmitOrder}
        />
      )}
    </div>
  )
}
