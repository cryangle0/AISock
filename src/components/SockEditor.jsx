import { useEffect, useMemo, useRef, useState } from 'react'
import './SockEditor.css'
import AssetPanel from './AssetPanel'
import SockPrintCanvas from './SockPrintCanvas'
import ParamsPanel from './ParamsPanel'
import OrderModal from './OrderModal'
import AiExtendModal from './print/AiExtendModal'
import FamilyPairModal from './print/FamilyPairModal'
import SockTypeSelector from './print/SockTypeSelector'
import { applyPaletteMapping } from './print/colorMapping'
import { PALETTE_MAP } from './print/colorPalettes'
import { matchaBigFlowerImageURL } from './patternImage'
import { DEFAULT_SOCK_TYPE_ID } from './print/sockTypes'
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
  weltHex: null,
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
  const [sockTypeId, setSockTypeId] = useState(DEFAULT_SOCK_TYPE_ID)
  // 色卡映射缓存：{ key, url } —— key 由"原图+色卡+强度"组成
  const [paletteResult, setPaletteResult] = useState({ key: '', url: null })

  const [orderOpen, setOrderOpen] = useState(false)
  const [aiExtendOpen, setAiExtendOpen] = useState(false)
  const [familyPairOpen, setFamilyPairOpen] = useState(false)
  // 把袜版资源放进 state，以便 modal 可以在 render 中安全读取
  const [resources, setResources] = useState(null)
  // 当前在颜色面板中高亮的区域（点击袜版后短暂高亮）
  const [activeRegion, setActiveRegion] = useState(null)

  const canvasRef = useRef(null)

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

  const handleModifyPrintBackground = () => {
    // 演示用：把当前印花改成"大花 · 抹茶绿底"。这里不解析指令，
    // 只模拟 AI 图像编辑返回新花型图，确保当前印花和袜版预览同步更新。
    setPrintImage(matchaBigFlowerImageURL(512))
    setPrintName('大花 · 抹茶绿底')
    setPaletteId(null)
  }

  const handleResetParams = () => setParams(DEFAULT_PARAMS)
  const handleDownload = () => canvasRef.current?.download?.()

  const handleResourceReady = (r) => setResources(r)
  const separable = isHeelToeSeparable(resources)

  // 单击袜版区域 → 高亮对应颜色行 + 滚动到可见
  const handleRegionClick = (region) => {
    setActiveRegion(region)
    setTimeout(() => {
      const target = document.querySelector(`.params-panel [data-region="${regionLabel(region, separable)}"]`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 30)
    // 1.4s 后自然淡出高亮
    window.clearTimeout(handleRegionClick._t)
    handleRegionClick._t = window.setTimeout(() => setActiveRegion(null), 1400)
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
      sockTypeId,
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
      const raw = item.cover || await renderSockToDataURL(
        resources,
        item.url,
        item.colors || colors,
        item.params || params,
      )
      const cover = await compressDataURL(raw, 280)
      onSaveDesign?.({
        name: item.name,
        coverImage: cover,
        printName: item.name,
        params: item.params || params,
        colors: item.colors || colors,
        paletteId,
        familyTag: item.tag,
      })
    }
  }

  return (
    <div className="sock-editor">
      <AssetPanel onApplyImage={applyImage}/>

      <div className="canvas-wrap">
        <div className="sock-type-bar">
          <span className="sock-type-bar-label">袜版形状</span>
          <SockTypeSelector
            value={sockTypeId}
            onChange={setSockTypeId}
            variant="full"
          />
        </div>
        <SockPrintCanvas
          ref={canvasRef}
          sockTypeId={sockTypeId}
          printImage={finalPrintImage}
          printName={printName}
          params={params}
          colors={colors}
          onDropImage={applyImage}
          onResourceReady={handleResourceReady}
          onRegionClick={handleRegionClick}
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
        activeRegion={activeRegion}
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
        onModifyPrintBackground={handleModifyPrintBackground}
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
          baseDesign={{ printImage: finalPrintImage, printName, colors, params }}
          resources={resources}
          onClose={() => setAiExtendOpen(false)}
          onApply={(design) => {
            // 把整套设计一次性应用：印花 + 颜色 + 调节
            setPrintImage(design.printImage)
            setPrintName(design.printName || '')
            setColors({ ...DEFAULT_COLORS, ...design.colors })
            setParams({ ...DEFAULT_PARAMS, ...design.params })
            setPaletteId(null)
            setAiExtendOpen(false)
          }}
        />
      )}

      {familyPairOpen && (
        <FamilyPairModal
          baseDesign={{ printImage: finalPrintImage, printName, colors, params }}
          resources={resources}
          onClose={() => setFamilyPairOpen(false)}
          onApply={(design) => {
            setPrintImage(design.printImage)
            setPrintName(design.printName || '')
            setColors({ ...DEFAULT_COLORS, ...design.colors })
            setParams({ ...DEFAULT_PARAMS, ...design.params })
            setPaletteId(null)
            setFamilyPairOpen(false)
          }}
          onSavePair={handleSaveFamilyPair}
        />
      )}
    </div>
  )
}

// 从 region key 推 BaseColorPicker 的 label，用于滚动定位
function regionLabel(region, separable) {
  if (region === 'body') return '袜身底色'
  if (region === 'welt') return '螺口'
  if (separable) {
    if (region === 'heel') return '袜跟'
    if (region === 'toe') return '袜头'
  } else if (region === 'heel' || region === 'toe') {
    return '袜跟+袜头'
  }
  return ''
}
