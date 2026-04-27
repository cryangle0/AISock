import { useEffect, useMemo, useRef, useState } from 'react'
import './SockEditor.css'
import AssetPanel from './AssetPanel'
import SockPrintCanvas from './SockPrintCanvas'
import ParamsPanel from './ParamsPanel'
import OrderModal from './OrderModal'
import AiExtendModal from './print/AiExtendModal'
import FamilyPairModal from './print/FamilyPairModal'
import { applyPaletteMapping } from './print/colorMapping'
import { PALETTE_MAP } from './print/colorPalettes'
import {
  isHeelToeSeparable,
  renderSockToDataURL,
  compressDataURL,
} from './print/sockRenderer'

const DEFAULT_PARAMS = {
  density: 100,
  tileDensity: 3,
  rotation: 0,
  singleMode: true,
  debugMode: false,
}

const DEFAULT_COLORS = {
  bodyHex: null,
  heelHex: null,
  toeHex: null,
}

const DEFAULT_PALETTE_STRENGTH = 80

export default function SockEditor({ onSaveDesign, onPlaceOrder }) {
  const [printImage, setPrintImage] = useState(null) // 用户原始印花
  const [printName, setPrintName] = useState('')
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [colors, setColors] = useState(DEFAULT_COLORS)
  const [paletteId, setPaletteId] = useState(null)
  const [paletteStrength, setPaletteStrength] = useState(DEFAULT_PALETTE_STRENGTH)
  // 色卡映射缓存：{ key, url } —— key 由"原图+色卡+强度"组成
  const [paletteResult, setPaletteResult] = useState({ key: '', url: null })

  const [orderOpen, setOrderOpen] = useState(false)
  const [aiExtendOpen, setAiExtendOpen] = useState(false)
  const [familyPairOpen, setFamilyPairOpen] = useState(false)
  const [separable, setSeparable] = useState(false)

  const canvasRef = useRef(null)
  const resourcesRef = useRef(null)

  // 当前生效的"映射缓存键"
  const mappingKey = useMemo(() => {
    if (!printImage || !paletteId || paletteStrength <= 0) return ''
    return `${printImage.slice(0, 60)}|${paletteId}|${paletteStrength}`
  }, [printImage, paletteId, paletteStrength])

  // 异步执行色卡映射，把结果写到缓存里；同步路径完全无 setState
  useEffect(() => {
    if (!mappingKey) return undefined
    const palette = PALETTE_MAP[paletteId]
    if (!palette) return undefined
    let alive = true
    applyPaletteMapping(printImage, palette, paletteStrength / 100).then((url) => {
      if (alive) setPaletteResult({ key: mappingKey, url })
    })
    return () => { alive = false }
  }, [mappingKey, paletteId, paletteStrength, printImage])

  // 派生最终印花：无映射时直接用原图；有映射但缓存还没回来时也用原图占位
  const finalPrintImage = useMemo(() => {
    if (!printImage) return null
    if (!mappingKey) return printImage
    if (paletteResult.key === mappingKey && paletteResult.url) return paletteResult.url
    return printImage
  }, [printImage, mappingKey, paletteResult])

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

  const handleClearPrint = () => {
    applyImage(null, '')
    setPaletteId(null)
  }

  const handleResetParams = () => setParams(DEFAULT_PARAMS)
  const handleDownload = () => canvasRef.current?.download?.()

  const handleResourceReady = (r) => {
    resourcesRef.current = r
    setSeparable(isHeelToeSeparable(r))
  }

  const composeName = () => printName ? `${printName} 袜款` : '未命名袜版'

  // 保存当前画布快照为缩略图
  const handleSave = async () => {
    const raw = canvasRef.current?.getDataURL?.() || ''
    const cover = await compressDataURL(raw, 280)
    onSaveDesign?.({
      name: composeName(),
      coverImage: cover,
      printName,
      params,
      colors,
      paletteId,
    })
  }

  const handleSubmitOrder = async (orderData) => {
    const raw = canvasRef.current?.getDataURL?.() || ''
    const cover = await compressDataURL(raw, 280)
    onPlaceOrder?.({
      ...orderData,
      designName: orderData.designName || composeName(),
      coverImage: cover,
    })
    setOrderOpen(false)
  }

  // 亲子袜：保存为套装（成人 + 儿童两个 design）
  const handleSaveFamilyPair = async (items) => {
    setFamilyPairOpen(false)
    for (const item of items) {
      const raw = await renderSockToDataURL(resourcesRef.current, item.url, colors, params)
      const cover = await compressDataURL(raw, 280)
      onSaveDesign?.({
        name: item.name,
        coverImage: cover,
        printName: item.name,
        params,
        colors,
        paletteId,
        familyTag: item.tag,
      })
    }
  }

  return (
    <div className="sock-editor">
      <AssetPanel onApplyImage={applyImage}/>

      <div className="canvas-wrap">
        <SockPrintCanvas
          ref={canvasRef}
          printImage={finalPrintImage}
          printName={printName}
          params={params}
          colors={colors}
          onDropImage={applyImage}
          onResourceReady={handleResourceReady}
        />
      </div>

      <ParamsPanel
        printImage={finalPrintImage}
        printName={printName}
        params={params}
        colors={colors}
        paletteId={paletteId}
        paletteStrength={paletteStrength}
        showHeelToeSeparate={separable}
        onParamsChange={setParams}
        onColorsChange={setColors}
        onPaletteChange={setPaletteId}
        onPaletteStrengthChange={setPaletteStrength}
        onUploadFile={handleUploadFile}
        onClearPrint={handleClearPrint}
        onResetParams={handleResetParams}
        onDownload={handleDownload}
        onSaveDesign={handleSave}
        onOpenOrder={() => setOrderOpen(true)}
        onAiExtend={() => setAiExtendOpen(true)}
        onFamilyPair={() => setFamilyPairOpen(true)}
      />

      {orderOpen && (
        <OrderModal
          defaultDesignName={composeName()}
          onClose={() => setOrderOpen(false)}
          onSubmit={handleSubmitOrder}
        />
      )}

      {aiExtendOpen && (
        <AiExtendModal
          basePrintImage={finalPrintImage}
          basePrintName={printName}
          onClose={() => setAiExtendOpen(false)}
          onApply={(url, name) => {
            applyImage(url, name)
            setAiExtendOpen(false)
          }}
        />
      )}

      {familyPairOpen && (
        <FamilyPairModal
          basePrintImage={finalPrintImage}
          basePrintName={printName}
          onClose={() => setFamilyPairOpen(false)}
          onApply={(url, name) => {
            applyImage(url, name)
            setFamilyPairOpen(false)
          }}
          onSavePair={handleSaveFamilyPair}
        />
      )}
    </div>
  )
}
