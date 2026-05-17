/**
 * PrintSheet — 印花板块（小程序版，对齐 web AssetPanel）
 *
 * 4 个子 tab：公共库 / 我的 / AI 生成（含图片延申） / 历史
 *
 * 状态在外部（useEditorState + useAssetLibrary）：
 *   - history：AI 生成历史
 *   - mineAssets：个人素材库（持久化）
 */
import { useState } from 'react'
import {
  Eraser, Wand2, Sparkles, Search, ImageIcon, Trash2, X,
} from 'lucide-react'
import { PATTERN_LIST } from '../../patternConstants'
import { PatternDefs } from '../../patterns'
import { patternToImageURL, aiGenerateImage } from '../../patternImage'
import ImageUploadButton from './ImageUploadButton'

const TABS = [
  { key: 'library', label: '公共库' },
  { key: 'mine',    label: '我的' },
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
  publicAssets,
  userAssets,
  onUploadUserAsset,
  onRemoveUserAsset,
  quota,
}) {
  const [tab, setTab] = useState('library')
  const [query, setQuery] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [refImage, setRefImage] = useState(null)
  const [refName, setRefName] = useState('')
  const [showMinePicker, setShowMinePicker] = useState(false)
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

  const handlePickRef = async (file) => {
    if (!file?.type?.startsWith('image/')) return
    const url = await fileToDataURL(file)
    setRefImage(url)
    setRefName(file.name?.replace(/\.[^/.]+$/, '') || '参考图')
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || generating) return
    if (quota && !quota.canUse) return   // 配额用完阻断
    setGenerating(true)
    const result = await aiGenerateImage(aiPrompt)
    const promptLabel = refImage ? `${aiPrompt.trim()} · 延申` : aiPrompt.trim()
    const item = {
      id: Date.now(),
      prompt: promptLabel,
      basePid: result.basePid,
      url: result.url,
      refUrl: refImage,
    }
    onHistoryAdd?.(item)
    onApplyImage?.(item.url, item.prompt)
    quota?.consume?.()
    setGenerating(false)
    setTab('history')
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

      {tab === 'ai' && (
        <AiView
          prompt={aiPrompt}
          onPromptChange={setAiPrompt}
          generating={generating}
          onGenerate={handleAiGenerate}
          refImage={refImage}
          refName={refName}
          onPickRefFile={handlePickRef}
          onPickRefMine={() => setShowMinePicker(true)}
          onClearRef={() => { setRefImage(null); setRefName('') }}
          mineAssets={userAssets || []}
          quota={quota}
        />
      )}

      {tab === 'history' && (
        <HistoryView history={history} onApply={onApplyImage} />
      )}

      {showMinePicker && (
        <MinePickerSheet
          items={userAssets || []}
          onPick={(asset) => {
            setRefImage(asset.url)
            setRefName(asset.name)
            setShowMinePicker(false)
          }}
          onClose={() => setShowMinePicker(false)}
        />
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

function AiView({
  prompt, onPromptChange, generating, onGenerate,
  refImage, refName, onPickRefFile, onPickRefMine, onClearRef,
  mineAssets, quota,
}) {
  const exhausted = quota && !quota.canUse
  return (
    <div className="mp-ai-view">
      {quota && (
        <div className={`mp-ai-quota ${exhausted ? 'exhausted' : ''} ${quota.isNewUser ? 'new-user' : ''}`}>
          <Sparkles size={11} strokeWidth={1.8}/>
          {quota.isNewUser && <span className="mp-ai-quota-tag">新用户</span>}
          <span className="mp-ai-quota-text">
            今日免费 AI 生图剩余 <b>{quota.remaining}</b> / {quota.perDay} 次
          </span>
        </div>
      )}

      <div className="mp-ai-hint">
        <Sparkles size={11} /> 提示词或图片延申
      </div>

      <div className="mp-ai-ref">
        <div className="mp-ai-ref-label">参考图（可选）</div>
        {refImage ? (
          <div className="mp-ai-ref-card">
            <img src={refImage} alt="参考" />
            <div className="mp-ai-ref-meta">
              <div className="mp-ai-ref-name">{refName}</div>
              <div className="mp-ai-ref-tip">基于此图生成</div>
            </div>
            <button type="button" className="mp-ai-ref-clear" onClick={onClearRef}>
              <X size={10} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="mp-ai-ref-empty">
            <ImageUploadButton
              onPick={onPickRefFile}
              label="拍照 / 相册"
              variant="mini"
            />
            <button
              className="mp-mini-btn"
              onClick={onPickRefMine}
              disabled={mineAssets.length === 0}
              title={mineAssets.length === 0 ? '个人库为空' : '从个人库选取'}
            >
              <ImageIcon size={10} /> 个人库选取
            </button>
          </div>
        )}
      </div>

      <textarea
        className="mp-input mp-textarea"
        placeholder={refImage ? '描述希望的延申方向（可选）' : '描述想要的花型'}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
      />
      <button
        className="mp-cta-primary"
        disabled={(!prompt.trim() && !refImage) || generating || exhausted}
        onClick={onGenerate}
      >
        <Sparkles size={12} />
        {exhausted
          ? '今日免费次数用完'
          : generating ? '生成中…' : refImage ? '基于参考图生成' : '生成花型'}
      </button>
      {exhausted && (
        <div className="mp-ai-quota-tip">
          明天 0 点重置；分享给好友邀请注册可解锁更多生图次数
        </div>
      )}
      <div className="mp-ai-presets">
        {PRESETS.map((p) => (
          <button key={p} className="mp-mini-btn" onClick={() => onPromptChange(p)}>
            {p}
          </button>
        ))}
      </div>
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

function MinePickerSheet({ items, onPick, onClose }) {
  return (
    <div
      className="mp-bottom-sheet-mask"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ zIndex: 60 }}
    >
      <div className="mp-bottom-sheet">
        <header className="mp-bottom-sheet-head">
          <div className="mp-bottom-sheet-titles">
            <div className="mp-bottom-sheet-title">从个人库选取参考图</div>
          </div>
          <button className="mp-bottom-sheet-close" onClick={onClose} aria-label="关闭">
            <X size={14} strokeWidth={2} />
          </button>
        </header>
        <div className="mp-bottom-sheet-body">
          {items.length === 0 ? (
            <div className="mp-empty-state">
              <p>个人库为空，先到 印花 → 我的 上传</p>
            </div>
          ) : (
            <div className="mp-mine-grid">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="mp-mine-tile"
                  onClick={() => onPick(m)}
                >
                  <img src={m.url} alt={m.name} className="mp-mine-tile-img" />
                  <span className="mp-mine-tile-name">{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
