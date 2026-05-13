/**
 * PrintSheet — "印花" 板块（对齐 web AssetPanel 的三个 tab）
 *   - 花型库：内置花型横滑选择
 *   - AI 生成：输入 prompt → 调 aiGenerateImage → 加入历史 → 自动应用
 *   - 历史：曾经生成过的花型，可再次应用
 *
 * 历史记录提到 hook 之外（由 useEditorState 管理），切 tab 不丢
 */
import { useRef, useState } from 'react'
import { Upload, Eraser, Wand2, Sparkles, Search } from 'lucide-react'
import { PATTERN_LIST } from '../../patternConstants'
import { PatternDefs } from '../../patterns'
import { patternToImageURL, aiGenerateImage } from '../../patternImage'

const TABS = [
  { key: 'library', label: '花型库' },
  { key: 'ai',      label: 'AI 生成' },
  { key: 'history', label: '历史' },
]

const PRESETS = ['春日樱花', '海蓝清爽', '复古条纹', '简约几何', '金色奢华', '薄荷清新']

export default function PrintSheet({
  printImage,
  printName,
  onApplyImage,
  onClearPrint,
  onModifyBg,
  history,
  onHistoryAdd,
}) {
  const fileInputRef = useRef(null)
  const [tab, setTab] = useState('library')
  const [query, setQuery] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [bgPrompt, setBgPrompt] = useState('将底色修改成绿色')
  const [bgEditing, setBgEditing] = useState(false)

  const filtered = PATTERN_LIST.filter((p) => !query || p.name.includes(query))

  const handleUpload = () => fileInputRef.current?.click()
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type?.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => onApplyImage?.(ev.target.result, file.name)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || generating) return
    setGenerating(true)
    const result = await aiGenerateImage(aiPrompt)
    const item = {
      id: Date.now(),
      prompt: aiPrompt.trim(),
      basePid: result.basePid,
      url: result.url,
    }
    onHistoryAdd?.(item)
    onApplyImage?.(item.url, item.prompt)
    setGenerating(false)
    setTab('history')
  }

  return (
    <div className="mp-sheet-body">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        hidden
      />

      <CurrentPrint
        printImage={printImage}
        printName={printName}
        onUpload={handleUpload}
        onClear={onClearPrint}
      />

      {printImage && (
        <BgEditor
          editing={bgEditing}
          prompt={bgPrompt}
          onPromptChange={setBgPrompt}
          onToggle={() => setBgEditing((v) => !v)}
          onConfirm={() => { onModifyBg?.(bgPrompt); setBgEditing(false) }}
        />
      )}

      <div className="mp-print-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`mp-print-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'library' && (
        <LibraryView
          query={query}
          onQueryChange={setQuery}
          patterns={filtered}
          onApply={onApplyImage}
        />
      )}

      {tab === 'ai' && (
        <AiView
          prompt={aiPrompt}
          onPromptChange={setAiPrompt}
          generating={generating}
          onGenerate={handleAiGenerate}
        />
      )}

      {tab === 'history' && (
        <HistoryView history={history} onApply={onApplyImage} />
      )}
    </div>
  )
}

function CurrentPrint({ printImage, printName, onUpload, onClear }) {
  return (
    <div className="mp-print-current">
      <div className="mp-print-thumb">
        {printImage
          ? <img src={printImage} alt="当前印花" />
          : <span className="mp-print-empty">尚未设置</span>}
      </div>
      <div className="mp-print-info">
        <div className="mp-print-name">{printName || '点击下方花型或上传'}</div>
        <div className="mp-print-actions">
          <button className="mp-mini-btn" onClick={onUpload}>
            <Upload size={11} /> {printImage ? '更换' : '上传'}
          </button>
          <button
            className="mp-mini-btn"
            onClick={onClear}
            disabled={!printImage}
          >
            <Eraser size={11} /> 清除
          </button>
        </div>
      </div>
    </div>
  )
}

function BgEditor({ editing, prompt, onPromptChange, onToggle, onConfirm }) {
  if (!editing) {
    return (
      <button className="mp-bg-edit-toggle" onClick={onToggle}>
        <Wand2 size={11} /> AI 修改印花底色
      </button>
    )
  }
  return (
    <div className="mp-bg-edit-form">
      <input
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        className="mp-bg-edit-input"
        placeholder="描述想要的修改"
      />
      <div className="mp-bg-edit-actions">
        <button className="mp-mini-btn" onClick={onToggle}>取消</button>
        <button className="mp-mini-btn primary" onClick={onConfirm}>确认</button>
      </div>
    </div>
  )
}

function LibraryView({ query, onQueryChange, patterns, onApply }) {
  return (
    <>
      <div className="mp-asset-mini-search">
        <Search size={11} />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="搜索花型"
        />
      </div>
      <div className="mp-pattern-strip">
        {patterns.map((p) => (
          <button
            key={p.id}
            className="mp-pattern-tile"
            onClick={() => onApply?.(patternToImageURL(p.id, 240), p.name)}
            title={p.name}
          >
            <svg viewBox="0 0 60 60" width="100%" height="100%">
              <PatternDefs uid={`mp-${p.id}`} />
              <rect width="60" height="60" rx="6" fill={`url(#${p.id}-mp-${p.id})`} />
            </svg>
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function AiView({ prompt, onPromptChange, generating, onGenerate }) {
  return (
    <div className="mp-ai-view">
      <div className="mp-ai-hint">
        <Sparkles size={11} /> 描述你想要的花型，AI 会即时生成
      </div>
      <textarea
        className="mp-input mp-textarea"
        placeholder="如：春日樱花飘落，粉色为主，少量金色点缀"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
      />
      <button
        className="mp-cta-primary"
        disabled={!prompt.trim() || generating}
        onClick={onGenerate}
      >
        <Sparkles size={12} /> {generating ? '生成中…' : '生成花型'}
      </button>
      <div className="mp-ai-presets">
        {PRESETS.map((p) => (
          <button
            key={p}
            className="mp-mini-btn"
            onClick={() => onPromptChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

function HistoryView({ history, onApply }) {
  if (!history?.length) {
    return (
      <div className="mp-history-empty">
        还没有生成记录，去 AI 生成试一下
      </div>
    )
  }
  return (
    <div className="mp-history-list">
      {history.map((item) => (
        <div key={item.id} className="mp-history-item">
          <img
            src={item.url}
            alt={item.prompt}
            className="mp-history-thumb"
            onClick={() => onApply?.(item.url, item.prompt)}
          />
          <div className="mp-history-info">
            <div className="mp-history-prompt">{item.prompt}</div>
            <div className="mp-history-meta">点击应用</div>
          </div>
          <button
            className="mp-mini-btn primary"
            onClick={() => onApply?.(item.url, item.prompt)}
          >
            应用
          </button>
        </div>
      ))}
    </div>
  )
}
