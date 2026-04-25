import { useState } from 'react'
import './SockEditor.css'
import AssetPanel from './AssetPanel'
import SockCanvas from './SockCanvas'
import ParamsPanel from './ParamsPanel'
import ExtensionModal from './ExtensionModal'
import OrderModal from './OrderModal'

const DEFAULT_REGIONS = {
  welt: 'p-stripe',  // 袜口
  cuff: 'p-floral',  // 螺口
  body: 'p-floral',  // 主体（含袜跟）
  toe:  'p-dots',    // 袜头
}

export default function SockEditor({ onSaveDesign, onPlaceOrder }) {
  const [regions, setRegions] = useState(DEFAULT_REGIONS)
  const [activeRegion, setActiveRegion] = useState('body')
  const [params, setParams] = useState({
    density: 60,
    rotation: 0,
    spacing: 50,
    fillStrategy: 'tile', // tile | stretch | smart
    variantCount: 2,      // 1 | 2 | 4
  })
  const [extensionOpen, setExtensionOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)

  const setPattern = (patternId) => {
    setRegions(prev => ({ ...prev, [activeRegion]: patternId }))
  }

  const handleGenerateExtension = () => setExtensionOpen(true)
  const handleSubmitOrder = (data) => {
    onPlaceOrder?.({ ...data, regions, designName: data.designName || '未命名袜版' })
    setOrderOpen(false)
  }

  return (
    <div className="sock-editor">
      <AssetPanel
        activePattern={regions[activeRegion]}
        onSelectPattern={setPattern}
      />
      <div className="canvas-wrap">
        <SockCanvas
          regions={regions}
          activeRegion={activeRegion}
          onSelectRegion={setActiveRegion}
          params={params}
        />
      </div>
      <ParamsPanel
        activeRegion={activeRegion}
        params={params}
        onParamsChange={setParams}
        onGenerateExtension={handleGenerateExtension}
        onSaveDesign={() => onSaveDesign?.({ name: '未命名袜版', cover: regions.body, regions })}
        onOpenOrder={() => setOrderOpen(true)}
      />

      {extensionOpen && (
        <ExtensionModal
          variantCount={params.variantCount}
          baseRegions={regions}
          onClose={() => setExtensionOpen(false)}
          onApply={(picked) => { setRegions(picked); setExtensionOpen(false) }}
        />
      )}

      {orderOpen && (
        <OrderModal
          onClose={() => setOrderOpen(false)}
          onSubmit={handleSubmitOrder}
        />
      )}
    </div>
  )
}
