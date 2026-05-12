import { useState } from 'react'
import { Sparkles, Loader } from 'lucide-react'

export default function BAiExtend({ onNavigate }) {
  const [count, setCount] = useState(4)
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState([])

  const handleGenerate = () => {
    setGenerating(true)
    setResults([])
    // 模拟生成
    setTimeout(() => {
      const colors = ['#fce8ef', '#e8f0fc', '#eaf6f0', '#fff8e7']
      setResults(Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        color: colors[i % colors.length],
      })))
      setGenerating(false)
    }, 1500)
  }

  return (
    <div className="mp-page mp-page-ai">
      {/* 当前底图 */}
      <div className="mp-ai-source">
        <div className="mp-ai-source-img" />
        <div className="mp-ai-source-info">
          <span className="mp-ai-source-label">当前设计</span>
          <span className="mp-ai-source-name">春日碎花款</span>
        </div>
      </div>

      {/* 生成数量 */}
      <div className="mp-ai-count">
        <span className="mp-section-title">生成数量</span>
        <div className="mp-ai-count-btns">
          {[1, 2, 4].map(n => (
            <button
              key={n}
              className={`mp-ai-count-btn ${count === n ? 'active' : ''}`}
              onClick={() => setCount(n)}
            >
              {n} 张
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <button className="mp-cta-btn ai" onClick={handleGenerate} disabled={generating}>
        {generating ? <Loader size={14} className="mp-spin" /> : <Sparkles size={14} />}
        {generating ? '生成中...' : 'AI 生成同款变体'}
      </button>

      {/* 结果网格 */}
      <div className="mp-ai-results">
        {generating && Array.from({ length: count }).map((_, i) => (
          <div key={i} className="mp-ai-result-card loading">
            <Loader size={16} className="mp-spin" />
          </div>
        ))}
        {!generating && results.map(r => (
          <button key={r.id} className="mp-ai-result-card" onClick={() => onNavigate('b-editor')}>
            <div className="mp-ai-result-img" style={{ background: r.color }} />
            <span className="mp-ai-result-label">应用</span>
          </button>
        ))}
      </div>

      {!generating && results.length === 0 && (
        <div className="mp-ai-empty">
          <Sparkles size={24} strokeWidth={1.2} />
          <p>点击上方按钮生成同款变体</p>
        </div>
      )}
    </div>
  )
}
