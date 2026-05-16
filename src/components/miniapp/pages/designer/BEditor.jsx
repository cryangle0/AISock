/**
 * BEditor — 小程序版袜版编辑器
 *
 * 状态由 MiniAppPrototype 通过 props 注入（editor + canvasRef），
 * 这样在切换 tab 时，编辑进度不会丢失。
 *
 * 严格复刻 web 端 SockEditor 的全部功能：
 *   - 真实的袜版渲染（复用 useSockResources + sockRenderer）
 *   - 印花上传 / 内置花型选择 / AI 修改背景
 *   - 调节（缩放/旋转/单张-平铺/平铺密度/蒙版）
 *   - 4 区颜色（袜身/螺口/袜跟/袜头）
 *   - 色卡映射 + 强度
 *   - 款式衍生（AI 图生图）
 *   - 亲子袜
 *   - 保存设计 / 下单（提交订单 → 支付 → 落库）
 */
import { useState } from 'react'
import {
  Save, ShoppingBag, Sparkles, Heart, Download,
} from 'lucide-react'
import MiniSockCanvas from '../../editor/MiniSockCanvas'
import SessionBar from '../../editor/SessionBar'
import PrintSheet from '../../editor/PrintSheet'
import AdjustSheet from '../../editor/AdjustSheet'
import ColorSheet from '../../editor/ColorSheet'
import PaletteSheet from '../../editor/PaletteSheet'
import OrderSheet from '../../editor/OrderSheet'
import PaymentSheet from '../../editor/PaymentSheet'
import AiExtendSheet from '../../editor/AiExtendSheet'
import FamilySheet from '../../editor/FamilySheet'
import Toast from '../../ui/Toast'
import useToast from '../../ui/useToast'
import useAssetLibrary from '../../../assets/useAssetLibrary'
import { matchaBigFlowerImageURL } from '../../../patternImage'
import {
  isHeelToeSeparable, renderSockToDataURL, compressDataURL,
} from '../../../print/sockRenderer'

const TABS = [
  { key: 'print',   label: '印花' },
  { key: 'adjust',  label: '调节' },
  { key: 'color',   label: '颜色' },
  { key: 'palette', label: '色卡' },
]

export default function BEditor({
  editor,
  canvasRef,
  currentSession,
  sessions = [],
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  onSaveDesign,
  onAddOrder,
}) {
  const [activeSheet, setActiveSheet] = useState('print')
  const [resources, setResources] = useState(null)

  const lib = useAssetLibrary()

  // 顶层弹层 sheet
  const [orderOpen, setOrderOpen] = useState(false)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [familyOpen, setFamilyOpen] = useState(false)

  const { toast, show } = useToast()

  const composeName = () => editor.printName
    ? `${editor.printName} 袜款`
    : (currentSession?.name || '未命名袜版')

  const handleModifyBg = () => {
    editor.setPrintImage(matchaBigFlowerImageURL(512))
    editor.setPrintName('大花 · 抹茶绿底')
    editor.setPaletteId(null)
  }

  const handleSave = async () => {
    const raw = canvasRef.current?.getDataURL?.() || ''
    if (!raw) { show('画布尚未就绪'); return }
    const cover = await compressDataURL(raw, 280)
    onSaveDesign?.({
      name: composeName(),
      coverImage: cover,
      printName: editor.printName,
      params: editor.params,
      colors: editor.colors,
      paletteId: editor.paletteId,
      sockTypeId: editor.sockTypeId,
    })
    show('已保存到我的设计')
  }

  const handleDownload = () => {
    canvasRef.current?.download?.()
    show('已下载到本地')
  }

  const handleOpenOrder = () => {
    if (!editor.printImage) { show('请先选择印花'); return }
    setOrderOpen(true)
  }

  const handleOrderSubmit = async (orderData) => {
    const raw = canvasRef.current?.getDataURL?.() || ''
    const cover = await compressDataURL(raw, 280)
    setPendingOrder({
      ...orderData,
      designName: orderData.designName || composeName(),
      coverImage: cover,
    })
    setOrderOpen(false)
  }

  const handlePaid = (payment) => {
    onAddOrder?.({ ...pendingOrder, payment })
    setPendingOrder(null)
    show('支付成功，订单已提交')
  }

  // 亲子套装一起保存
  const handleSaveFamilyPair = async (items) => {
    setFamilyOpen(false)
    for (const item of items) {
      const raw = item.cover || await renderSockToDataURL(
        resources, item.url, item.colors || editor.colors, item.params || editor.params,
      )
      const cover = await compressDataURL(raw, 280)
      onSaveDesign?.({
        name: item.name,
        coverImage: cover,
        printName: item.name,
        params: item.params || editor.params,
        colors: item.colors || editor.colors,
        paletteId: editor.paletteId,
        familyTag: item.tag,
      })
    }
    show('亲子套装已保存')
  }

  const separable = isHeelToeSeparable(resources)

  return (
    <div className="mp-page mp-page-editor">
      {/* 顶部会话切换 */}
      <SessionBar
        currentSession={currentSession}
        sessions={sessions}
        onSelect={onSelectSession}
        onNew={onNewSession}
        onRename={onRenameSession}
        onDelete={onDeleteSession}
      />

      {/* 上半屏：袜版预览 */}
      <div className="mp-editor-canvas-wrap">
        <MiniSockCanvas
          ref={canvasRef}
          sockTypeId={editor.sockTypeId}
          printImage={editor.finalPrintImage}
          params={editor.params}
          colors={editor.colors}
          onDropImage={editor.applyImage}
          onResourceReady={setResources}
        />
      </div>

      {/* 顶部小操作栏 */}
      <div className="mp-editor-quick">
        <button
          className="mp-quick-btn"
          onClick={() => setAiOpen(true)}
          disabled={!editor.printImage || !resources}
        >
          <Sparkles size={12} /> 款式衍生
        </button>
        <button
          className="mp-quick-btn"
          onClick={() => setFamilyOpen(true)}
          disabled={!editor.printImage}
        >
          <Heart size={12} /> 亲子袜
        </button>
        <button
          className="mp-quick-btn"
          onClick={handleDownload}
          disabled={!editor.printImage}
        >
          <Download size={12} /> 导出
        </button>
      </div>

      {/* 中段 sheet 切换 */}
      <div className="mp-sheet-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`mp-sheet-tab ${activeSheet === t.key ? 'active' : ''}`}
            onClick={() => setActiveSheet(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mp-sheet-card">
        {activeSheet === 'print' && (
          <PrintSheet
            printImage={editor.printImage}
            printName={editor.printName}
            history={editor.aiHistory}
            onHistoryAdd={editor.addAiHistory}
            publicAssets={lib.publicAssets}
            userAssets={lib.userAssets}
            onUploadUserAsset={lib.addUserAsset}
            onRemoveUserAsset={lib.removeUserAsset}
            onApplyImage={editor.applyImage}
            onClearPrint={editor.clearPrint}
            onModifyBg={handleModifyBg}
            sockTypeId={editor.sockTypeId}
            onSockTypeChange={editor.setSockTypeId}
          />
        )}
        {activeSheet === 'adjust' && (
          <AdjustSheet
            params={editor.params}
            onParamsChange={editor.setParams}
            onResetParams={editor.resetParams}
            disabled={!editor.printImage}
          />
        )}
        {activeSheet === 'color' && (
          <ColorSheet
            colors={editor.colors}
            onColorsChange={editor.setColors}
            showHeelToeSeparate={separable}
          />
        )}
        {activeSheet === 'palette' && (
          <PaletteSheet
            paletteId={editor.paletteId}
            onChange={editor.setPaletteId}
            strength={editor.paletteStrength}
            onStrengthChange={editor.setPaletteStrength}
            disabled={!editor.printImage}
          />
        )}
      </div>

      {/* 底部固定 CTA */}
      <div className="mp-editor-cta">
        <button className="mp-cta-secondary" onClick={handleSave}>
          <Save size={13} /> 保存
        </button>
        <button className="mp-cta-primary" onClick={handleOpenOrder}>
          <ShoppingBag size={13} /> 立即下单
        </button>
      </div>

      {/* 各种弹层 sheet */}
      {orderOpen && (
        <OrderSheet
          defaultDesignName={composeName()}
          onClose={() => setOrderOpen(false)}
          onSubmit={handleOrderSubmit}
        />
      )}

      {pendingOrder && (
        <PaymentSheet
          order={pendingOrder}
          onCancel={() => setPendingOrder(null)}
          onPaid={handlePaid}
        />
      )}

      {aiOpen && (
        <AiExtendSheet
          baseDesign={{
            printImage: editor.finalPrintImage,
            printName: editor.printName,
            colors: editor.colors,
            params: editor.params,
          }}
          resources={resources}
          onClose={() => setAiOpen(false)}
          onApply={(d) => { editor.applyDerivedDesign(d); setAiOpen(false) }}
        />
      )}

      {familyOpen && (
        <FamilySheet
          baseDesign={{
            printImage: editor.finalPrintImage,
            printName: editor.printName,
            colors: editor.colors,
            params: editor.params,
          }}
          resources={resources}
          onClose={() => setFamilyOpen(false)}
          onApply={(d) => { editor.applyDerivedDesign(d); setFamilyOpen(false) }}
          onSavePair={handleSaveFamilyPair}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}
