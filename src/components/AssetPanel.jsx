import { useState } from 'react'
import './AssetPanel.css'
import { Sparkles, Search, MousePointerClick } from 'lucide-react'
import { PATTERN_LIST } from './patternConstants'
import { PatternDefs } from './patterns'
import { aiGenerateImage, patternToImageURL } from './patternImage'

const TABS = [
  { key: 'library', label: '花型库' },
  { key: 'ai',      label: 'AI 生成' },
  { key: 'history', label: '历史' },
]

const PRESETS = ['春日樱花', '海蓝清爽', '复古条纹', '简约几何', '金色奢华', '薄荷清新']

export default function AssetPanel({ onApplyImage }) {
  const [tab, setTab] = useState('library')
  const [query, setQuery] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [history, setHistory] = useState([
    { id: 1, prompt: '春日樱花 + 粉色调', basePid: 'p-flower-big', url: patternToImageURL('p-flower-big', 240) },
    { id: 2, prompt: '海蓝条纹 + 度假风',  basePid: 'p-blue',       url: patternToImageURL('p-blue', 240) },
    { id: 3, prompt: '简约黑白 + 几何',    basePid: 'p-mono',       url: patternToImageURL('p-mono', 240) },
  ])

  const filtered = PATTERN_LIST.filter(p => !query || p.name.includes(query))

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
    setHistory(prev => [item, ...prev].slice(0, 24))
    setGenerating(false)
    onApplyImage?.(item.url, item.prompt)
    setTab('history')
  }

  // 通用拖拽源 — 把图片 URL + 名称写到 dataTransfer
  const makeDragHandler = (url, name) => (e) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/uri-list', url)
    e.dataTransfer.setData('text/plain', url)
    e.dataTransfer.setData('application/x-aisock-pattern', url)
    e.dataTransfer.setData('application/x-aisock-name', name || '')
    // 拖动时让浏览器用一个真实的图片做拖影
    try {
      const ghost = new Image()
      ghost.src = url
      e.dataTransfer.setDragImage(ghost, 30, 30)
    } catch { /* ignore */ }
  }

  return (
    <aside className="asset-panel">
      <div className="asset-tabs">
        {TABS.map(t => (
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
        <>
          <div className="asset-search">
            <Search size={13} strokeWidth={1.6}/>
            <input
              placeholder="搜索花型"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="asset-drag-tip">
            <MousePointerClick size={11} strokeWidth={1.6}/>
            拖拽花型到袜版即可应用，双击直接贴印
          </div>
          <div className="asset-grid">
            {filtered.map(p => {
              const url = patternToImageURL(p.id, 240)
              return (
                <div
                  key={p.id}
                  className="asset-item"
                  title={`${p.name} · 拖到袜版即可应用`}
                  draggable
                  onDragStart={makeDragHandler(url, p.name)}
                  onDoubleClick={() => onApplyImage?.(url, p.name)}
                  onClick={() => onApplyImage?.(url, p.name)}
                >
                  <svg viewBox="0 0 60 60" width="100%" height="100%">
                    <PatternDefs uid={`a-${p.id}`}/>
                    <rect width="60" height="60" rx="8" fill={`url(#${p.id}-a-${p.id})`}/>
                  </svg>
                  <span className="asset-item-name">{p.name}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'ai' && (
        <div className="asset-ai">
          <div className="ai-hint">
            <Sparkles size={14} strokeWidth={1.6}/>
            描述你想要的花型，AI 会即时生成
          </div>
          <textarea
            className="ai-textarea"
            placeholder="如：春日樱花飘落，粉色为主，少量金色点缀"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
          />
          <button
            className="ai-submit"
            disabled={!aiPrompt.trim() || generating}
            onClick={handleAiGenerate}
          >
            {generating ? '生成中…' : '生成花型'}
          </button>
          <div className="ai-presets">
            {PRESETS.map(p => (
              <button key={p} className="ai-preset" onClick={() => setAiPrompt(p)}>{p}</button>
            ))}
          </div>
          <div className="asset-drag-tip soft">
            生成后会自动贴到袜版，也可以从"历史"里随时拖回画布
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="asset-history">
          {history.length === 0 && (
            <div className="history-empty">还没有生成记录，去 AI 生成试一下吧</div>
          )}
          {history.map(item => (
            <div
              key={item.id}
              className="history-item"
              draggable
              onDragStart={makeDragHandler(item.url, item.prompt)}
              title="拖动到袜版上即可应用"
            >
              <img src={item.url} alt={item.prompt} className="history-thumb-img"/>
              <div className="history-info">
                <div className="history-prompt">{item.prompt}</div>
                <div className="history-meta">可拖拽 · 双击应用</div>
              </div>
              <button
                className="history-apply"
                onClick={() => onApplyImage?.(item.url, item.prompt)}
              >
                应用
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
