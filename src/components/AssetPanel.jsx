import { useMemo, useRef, useState } from 'react'
import './AssetPanel.css'
import { Sparkles, Search, MousePointerClick, Upload, Trash2, X, ImageIcon } from 'lucide-react'
import { PATTERN_LIST } from './patternConstants'
import { PatternDefs } from './patterns'
import { aiGenerateImage, patternToImageURL } from './patternImage'
import useAssetLibrary from './assets/useAssetLibrary'

const TABS = [
  { key: 'library', label: '公共库' },
  { key: 'mine',    label: '我的' },
  { key: 'ai',      label: 'AI 生成' },
  { key: 'history', label: '历史' },
]

const PRESETS = ['春日樱花', '海蓝清爽', '复古条纹', '简约几何', '金色奢华', '薄荷清新']

const makeDragHandler = (url, name) => (e) => {
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('text/uri-list', url)
  e.dataTransfer.setData('text/plain', url)
  e.dataTransfer.setData('application/x-aisock-pattern', url)
  e.dataTransfer.setData('application/x-aisock-name', name || '')
  try {
    const ghost = new Image()
    ghost.src = url
    e.dataTransfer.setDragImage(ghost, 30, 30)
  } catch { /* ignore */ }
}

export default function AssetPanel({
  onApplyImage,
}) {
  const [tab, setTab] = useState('library')
  const [query, setQuery] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [refImage, setRefImage] = useState(null)   // AI 延申参考图（dataURL）
  const [refName, setRefName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [history, setHistory] = useState([])
  const refInputRef = useRef(null)

  const lib = useAssetLibrary()

  const officialItems = useMemo(
    () => PATTERN_LIST.map((p) => ({
      id: p.id,
      name: p.name,
      url: patternToImageURL(p.id, 240),
      tags: ['官方'],
      svg: true,
    })),
    [],
  )

  // 公共库 = 内置 + 管理员上架
  const publicItems = useMemo(() => {
    const adminOnline = lib.publicAssets.filter((a) => a.online !== false)
    return [...officialItems, ...adminOnline]
  }, [officialItems, lib.publicAssets])

  const filteredPublic = publicItems.filter((p) => !query || (p.name || '').includes(query))

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || generating) return
    setGenerating(true)
    const result = await aiGenerateImage(aiPrompt)
    const promptLabel = refImage ? `${aiPrompt} · 延申` : aiPrompt
    const item = {
      id: Date.now(),
      prompt: promptLabel,
      basePid: result.basePid,
      url: result.url,
      refUrl: refImage,
    }
    setHistory((prev) => [item, ...prev].slice(0, 24))
    setGenerating(false)
    onApplyImage?.(item.url, promptLabel)
    setTab('history')
  }

  const handleSetRefFromFile = async (file) => {
    if (!file?.type?.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setRefImage(e.target.result)
      setRefName(file.name?.replace(/\.[^/.]+$/, '') || '本地参考图')
    }
    reader.readAsDataURL(file)
  }

  return (
    <aside className="asset-panel">
      <div className="asset-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`asset-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'library' && (
        <PublicTab
          items={filteredPublic}
          query={query}
          onQueryChange={setQuery}
          onApplyImage={onApplyImage}
        />
      )}

      {tab === 'mine' && (
        <MineTab
          items={lib.userAssets}
          onUpload={lib.addUserAsset}
          onRemove={lib.removeUserAsset}
          onApplyImage={onApplyImage}
        />
      )}

      {tab === 'ai' && (
        <AiTab
          prompt={aiPrompt}
          onPromptChange={setAiPrompt}
          generating={generating}
          onGenerate={handleAiGenerate}
          refImage={refImage}
          refName={refName}
          onRefFromFile={handleSetRefFromFile}
          onRefFromMine={(asset) => { setRefImage(asset.url); setRefName(asset.name) }}
          onClearRef={() => { setRefImage(null); setRefName('') }}
          mineAssets={lib.userAssets}
          refInputRef={refInputRef}
        />
      )}

      {tab === 'history' && (
        <HistoryTab history={history} onApplyImage={onApplyImage} />
      )}
    </aside>
  )
}

function PublicTab({ items, query, onQueryChange, onApplyImage }) {
  return (
    <>
      <div className="asset-search">
        <Search size={13} strokeWidth={1.6} />
        <input
          placeholder="搜索花型"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <div className="asset-drag-tip">
        <MousePointerClick size={11} strokeWidth={1.6} />
        拖拽花型到袜版即可应用，双击直接贴印
      </div>
      <div className="asset-grid">
        {items.map((p) => (
          <PublicItem key={p.id} item={p} onApply={onApplyImage} />
        ))}
      </div>
    </>
  )
}

function PublicItem({ item, onApply }) {
  return (
    <div
      className="asset-item"
      title={`${item.name} · 拖到袜版即可应用`}
      draggable
      onDragStart={makeDragHandler(item.url, item.name)}
      onDoubleClick={() => onApply?.(item.url, item.name)}
      onClick={() => onApply?.(item.url, item.name)}
    >
      {item.svg ? (
        <svg viewBox="0 0 60 60" width="100%" height="100%">
          <PatternDefs uid={`a-${item.id}`} />
          <rect width="60" height="60" rx="8" fill={`url(#${item.id}-a-${item.id})`} />
        </svg>
      ) : (
        <img src={item.url} alt={item.name} className="asset-item-img" />
      )}
      <span className="asset-item-name">{item.name}</span>
    </div>
  )
}

function MineTab({ items, onUpload, onRemove, onApplyImage }) {
  const inputRef = useRef(null)
  const handlePick = () => inputRef.current?.click()
  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) await onUpload(file)
    e.target.value = ''
  }

  return (
    <div className="asset-mine">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} hidden />
      <button className="mine-upload-btn" onClick={handlePick} type="button">
        <Upload size={13} strokeWidth={1.6} />
        上传到我的素材库
      </button>
      <div className="asset-drag-tip soft">
        上传后可在这里随时拖到袜版，也可作为 AI 延申的参考图
      </div>

      {items.length === 0 ? (
        <div className="mine-empty">
          <ImageIcon size={26} strokeWidth={1.2} />
          <p>个人素材库为空</p>
          <small>上传你喜欢的图片，让设计更随心</small>
        </div>
      ) : (
        <div className="asset-grid">
          {items.map((it) => (
            <div
              key={it.id}
              className="asset-item asset-item-removable"
              draggable
              onDragStart={makeDragHandler(it.url, it.name)}
              onDoubleClick={() => onApplyImage?.(it.url, it.name)}
              onClick={() => onApplyImage?.(it.url, it.name)}
              title={`${it.name} · 双击应用 / 拖拽到袜版`}
            >
              <img src={it.url} alt={it.name} className="asset-item-img" />
              <span className="asset-item-name">{it.name}</span>
              <button
                type="button"
                className="asset-item-remove"
                aria-label="删除"
                onClick={(e) => { e.stopPropagation(); onRemove(it.id) }}
              >
                <Trash2 size={11} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AiTab({
  prompt, onPromptChange,
  generating, onGenerate,
  refImage, refName,
  onRefFromFile, onClearRef,
  onRefFromMine,
  mineAssets,
  refInputRef,
}) {
  const [picker, setPicker] = useState(null)  // null | 'mine'
  const handlePickFile = () => refInputRef.current?.click()
  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) onRefFromFile(f)
    e.target.value = ''
  }

  return (
    <div className="asset-ai">
      <input ref={refInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />

      <div className="ai-hint">
        <Sparkles size={14} strokeWidth={1.6} />
        描述想要的花型，可选上传 / 选取参考图做"图片延申"
      </div>

      <div className="ai-ref">
        <div className="ai-ref-label">参考图（可选）</div>
        {refImage ? (
          <div className="ai-ref-card">
            <img src={refImage} alt="参考" />
            <div className="ai-ref-meta">
              <div className="ai-ref-name">{refName}</div>
              <div className="ai-ref-tip">基于此图生成同款变体</div>
            </div>
            <button
              type="button"
              className="ai-ref-clear"
              onClick={onClearRef}
              aria-label="清除参考图"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="ai-ref-empty">
            <button type="button" className="ai-ref-btn" onClick={handlePickFile}>
              <Upload size={11} /> 本地上传
            </button>
            <button
              type="button"
              className="ai-ref-btn"
              onClick={() => setPicker('mine')}
              disabled={mineAssets.length === 0}
              title={mineAssets.length === 0 ? '个人库为空，先到"我的"上传' : '从我的素材库选取'}
            >
              <ImageIcon size={11} /> 个人库选取
            </button>
          </div>
        )}
      </div>

      <textarea
        className="ai-textarea"
        placeholder="如：春日樱花飘落，粉色为主，少量金色点缀"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
      />
      <button
        className="ai-submit"
        disabled={!prompt.trim() || generating}
        onClick={onGenerate}
      >
        {generating ? '生成中…' : refImage ? '基于参考图生成' : '生成花型'}
      </button>
      <div className="ai-presets">
        {PRESETS.map((p) => (
          <button key={p} className="ai-preset" onClick={() => onPromptChange(p)}>{p}</button>
        ))}
      </div>

      {picker === 'mine' && (
        <MinePickerModal
          items={mineAssets}
          onPick={(asset) => { onRefFromMine(asset); setPicker(null) }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}

function MinePickerModal({ items, onPick, onClose }) {
  return (
    <div className="mine-picker-mask" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mine-picker">
        <header>
          <span>从个人库选取参考图</span>
          <button type="button" onClick={onClose} aria-label="关闭"><X size={14} /></button>
        </header>
        <div className="mine-picker-grid">
          {items.map((it) => (
            <button key={it.id} type="button" className="mine-picker-item" onClick={() => onPick(it)}>
              <img src={it.url} alt={it.name} />
              <span>{it.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function HistoryTab({ history, onApplyImage }) {
  if (history.length === 0) {
    return <div className="history-empty">还没有生成记录，去 AI 生成试一下吧</div>
  }
  return (
    <div className="asset-history">
      {history.map((item) => (
        <div
          key={item.id}
          className="history-item"
          draggable
          onDragStart={makeDragHandler(item.url, item.prompt)}
          title="拖动到袜版上即可应用"
        >
          <img src={item.url} alt={item.prompt} className="history-thumb-img" />
          <div className="history-info">
            <div className="history-prompt">{item.prompt}</div>
            <div className="history-meta">
              {item.refUrl ? '图片延申' : '可拖拽 · 双击应用'}
            </div>
          </div>
          <button
            type="button"
            className="history-apply"
            onClick={() => onApplyImage?.(item.url, item.prompt)}
          >
            应用
          </button>
        </div>
      ))}
    </div>
  )
}
