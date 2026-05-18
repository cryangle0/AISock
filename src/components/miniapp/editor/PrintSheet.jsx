/**
 * PrintSheet — 印花板块（小程序版，对齐 web AssetPanel）
 *
 * 3 个子 tab：公共库 / 我的 / 历史
 * AI 生成已上提到 dock 上的 AI 主按钮 → AiGenerateSheet 抽屉
 *
 * 状态在外部（useEditorState + useAssetLibrary）：
 *   - history：AI 生成历史
 *   - mineAssets：个人素材库（持久化）
 */
import { useState } from 'react'
import {
  Eraser, Wand2, Search, ImageIcon, Trash2,
} from 'lucide-react'
import { PATTERN_LIST } from '../../patternConstants'
import { PatternDefs } from '../../patterns'
import { patternToImageURL } from '../../patternImage'
import ImageUploadButton from './ImageUploadButton'

const TABS = [
  { key: 'library', label: '公共库' },
  { key: 'mine',    label: '我的' },
  { key: 'history', label: '历史' },
]

export default function PrintSheet({
  printImage,
  printName,
  onApplyImage,
  onClearPrint,
  onModifyBg,
  history,
  publicAssets,
  userAssets,
  onUploadUserAsset,
  onRemoveUserAsset,
}) {
  const [tab, setTab] = useState('library')
  const [query, setQuery] = useState('')
  const [bgPrompt, setBgPrompt] = useState('将底色修改成绿色')
  const [bgEditing, setBgEditing] = useState(false)

  const officialItems = PATTERN_LIST.map((p) => ({
    id: p.id, name: p.name, svg: true, source: 'official',
  }))
  const publicCombined = [
    ...officialItems,
    ...(publicAssets || []).filter((a) => a.online !== false),
  ]
  const filteredPublic = publicCombined.filter((p) => !query || p.name.includes(query))

  const fileToDataURL = (file) => new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = (e) => resolve(e.target.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })

  const handlePickPrint = async (file) => {
    if (!file?.type?.startsWith('image/')) return
    const url = await fileToDataURL(file)
    onApplyImage?.(url, file.name)
  }

  return (
    <div className="mp-sheet-body">
      <CurrentPrint
        printImage={printImage}
        printName={printName}
        onPickFile={handlePickPrint}
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
        <PublicView
          items={filteredPublic}
          query={query}
          onQueryChange={setQuery}
          onApply={onApplyImage}
        />
      )}

      {tab === 'mine' && (
        <MineView
          items={userAssets || []}
          onUpload={onUploadUserAsset}
          onRemove={onRemoveUserAsset}
          onApply={onApplyImage}
        />
      )}

      {tab === 'history' && (
        <HistoryView history={history} onApply={onApplyImage} />
      )}
    </div>
  )
}

function CurrentPrint({ printImage, printName, onPickFile, onClear }) {
  return (
    <div className="mp-print-current">
      <div className="mp-print-thumb">
        {printImage
          ? <img src={printImage} alt="当前印花" />
          : <span className="mp-print-empty">尚未设置</span>}
      </div>
      <div className="mp-print-info">
        <div className="mp-print-name">{printName || '点击下方花型 / 拍照 / 相册'}</div>
        <div className="mp-print-actions">
          <ImageUploadButton
            onPick={onPickFile}
            label={printImage ? '更换' : '上传'}
            variant="mini"
          />
          <button className="mp-mini-btn" onClick={onClear} disabled={!printImage}>
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

function PublicView({ items, query, onQueryChange, onApply }) {
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
        {items.map((p) => (
          <button
            key={p.id}
            className="mp-pattern-tile"
            onClick={() => {
              const url = p.svg ? patternToImageURL(p.id, 240) : p.url
              onApply?.(url, p.name)
            }}
            title={p.name}
          >
            {p.svg ? (
              <svg viewBox="0 0 60 60" width="100%" height="100%">
                <PatternDefs uid={`mp-${p.id}`} />
                <rect width="60" height="60" rx="6" fill={`url(#${p.id}-mp-${p.id})`} />
              </svg>
            ) : (
              <img src={p.url} alt={p.name} className="mp-pattern-tile-img" />
            )}
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function MineView({ items, onUpload, onRemove, onApply }) {
  const handleFile = async (file) => {
    if (file) await onUpload?.(file)
  }
  return (
    <div className="mp-mine-view">
      <ImageUploadButton
        onPick={handleFile}
        label="上传到我的素材库（拍照 / 相册）"
        variant="primary"
      />
      {items.length === 0 ? (
        <div className="mp-mine-empty-tip">
          <ImageIcon size={18} strokeWidth={1.4} />
          <span>个人库为空，点上方上传</span>
        </div>
      ) : (
        <div className="mp-mine-grid">
          {items.map((m) => (
            <div key={m.id} className="mp-mine-tile">
              <img
                src={m.url}
                alt={m.name}
                className="mp-mine-tile-img"
                onClick={() => onApply?.(m.url, m.name)}
              />
              <span className="mp-mine-tile-name">{m.name}</span>
              <button
                type="button"
                className="mp-mine-tile-remove"
                aria-label="删除"
                onClick={() => onRemove?.(m.id)}
              >
                <Trash2 size={10} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryView({ history, onApply }) {
  if (!history?.length) {
    return <div className="mp-history-empty">还没有生成记录，去 AI 生成试一下</div>
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
            <div className="mp-history-meta">
              {item.refUrl ? '图片延申' : '点击应用'}
            </div>
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
