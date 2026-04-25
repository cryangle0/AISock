import { useState } from 'react'
import './AssetPanel.css'
import { Sparkles, Search } from 'lucide-react'
import { PATTERN_LIST } from './patternConstants'
import { PatternDefs } from './patterns'

const TABS = [
  { key: 'library', label: '花型库' },
  { key: 'ai',      label: 'AI 生成' },
  { key: 'history', label: '历史' },
]

const AI_HISTORY = [
  { id: 1, prompt: '春日樱花 + 粉色调', cover: 'p-flower-big' },
  { id: 2, prompt: '海蓝条纹 + 度假风',  cover: 'p-blue' },
  { id: 3, prompt: '简约黑白 + 几何',    cover: 'p-mono' },
]

export default function AssetPanel({ activePattern, onSelectPattern }) {
  const [tab, setTab] = useState('library')
  const [query, setQuery] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  const filtered = PATTERN_LIST.filter(p => !query || p.name.includes(query))

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setTab('library')
    }, 1400)
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
          <div className="asset-grid">
            {filtered.map(p => (
              <button
                key={p.id}
                className={`asset-item ${activePattern === p.id ? 'active' : ''}`}
                onClick={() => onSelectPattern(p.id)}
                title={p.name}
              >
                <svg viewBox="0 0 60 60" width="100%" height="100%">
                  <PatternDefs uid={`a-${p.id}`}/>
                  <rect width="60" height="60" rx="8" fill={`url(#${p.id}-a-${p.id})`}/>
                </svg>
                <span className="asset-item-name">{p.name}</span>
              </button>
            ))}
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
            {['春日樱花', '海蓝清爽', '复古条纹', '简约几何', '金色奢华'].map(p => (
              <button key={p} className="ai-preset" onClick={() => setAiPrompt(p)}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="asset-history">
          {AI_HISTORY.map(item => (
            <div key={item.id} className="history-item">
              <svg viewBox="0 0 60 60" width="44" height="44" className="history-thumb">
                <PatternDefs uid={`h-${item.id}`}/>
                <rect width="60" height="60" rx="8" fill={`url(#${item.cover}-h-${item.id})`}/>
              </svg>
              <div className="history-info">
                <div className="history-prompt">{item.prompt}</div>
                <div className="history-meta">2026-04-{20 + item.id}</div>
              </div>
              <button className="history-apply" onClick={() => onSelectPattern(item.cover)}>应用</button>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
