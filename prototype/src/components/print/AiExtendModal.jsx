import { useEffect, useState } from 'react'
import { X, Sparkles, Wand2, Loader2 } from 'lucide-react'
import '../Modal.css'
import './AiExtendModal.css'
import { deriveStyleVariants, STYLE_VARIANT_COUNTS } from './styleVariants'

/**
 * 款式衍生（AI 图生图）— 基于当前完整袜版设计（印花 + 各部位颜色 + 调节参数），
 * 生成 1/2/4 套"换花型 + 换配色 + 微调参数"的全新设计稿，每张都是完整袜版预览。
 *
 * 选中后点"应用此款"会把变体的整套设计（印花 + 颜色 + 参数）一次性应用到当前编辑器。
 *
 * @param {Object} baseDesign     { printImage, printName, colors, params }
 * @param {Object} resources      useSockResources 返回值（必须 ready）
 * @param {()=>void} onClose
 * @param {(design:Object)=>void} onApply
 */
export default function AiExtendModal({ baseDesign, resources, onClose, onApply }) {
  const [count, setCount] = useState(2)
  const [variants, setVariants] = useState([])
  const [picked, setPicked] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      // 加点节奏感，让 "AI 创作中" 有真实感
      await new Promise((r) => setTimeout(r, 600))
      if (!alive) return
      const vs = await deriveStyleVariants(baseDesign, count, resources)
      if (!alive) return
      setVariants(vs)
      setPicked(vs[0]?.id ?? null)
      setLoading(false)
    })()
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const handleApply = () => {
    const v = variants.find((x) => x.id === picked)
    if (!v) return
    onApply?.({
      printImage: v.printImage,
      printName: v.printName,
      colors: v.colors,
      params: v.params,
    })
  }

  return (
    <div className="modal-mask" onClick={loading ? undefined : onClose}>
      <div
        className="modal-card large style-extend-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <div className="modal-title">
              <Sparkles size={15} strokeWidth={1.6}/>
              款式衍生（AI 图生图）
            </div>
            <div className="modal-sub">
              基于当前完整设计（花型 + 颜色 + 排版），AI 推荐
              {STYLE_VARIANT_COUNTS.includes(count) ? ` ${count} ` : ' '}套全新款式
            </div>
          </div>
          <div className="style-extend-head-actions">
            <div className="style-extend-count">
              {STYLE_VARIANT_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`style-extend-count-btn ${count === n ? 'active' : ''}`}
                  disabled={loading}
                  onClick={() => setCount(n)}
                >
                  {n} 款
                </button>
              ))}
            </div>
            <button className="modal-close" onClick={onClose} disabled={loading}>
              <X size={16} strokeWidth={1.6}/>
            </button>
          </div>
        </header>

        <div className={`style-extend-grid count-${count}`}>
          {loading ? (
            <SkeletonCards count={count}/>
          ) : (
            variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`style-card ${picked === v.id ? 'active' : ''}`}
                onClick={() => setPicked(v.id)}
              >
                <div className="style-card-thumb">
                  {v.cover
                    ? <img src={v.cover} alt={v.label}/>
                    : <div className="style-card-placeholder"/>}
                </div>
                <div className="style-card-meta">
                  <div className="style-card-name">{v.pattern}</div>
                  <div className="style-card-scheme">{v.scheme}</div>
                </div>
              </button>
            ))
          )}
        </div>

        <footer className="modal-foot">
          {loading && (
            <span className="style-extend-progress">
              <Loader2 size={13} strokeWidth={1.8} className="rotating"/>
              AI 正在创作中…
            </span>
          )}
          <span className="style-extend-flex"/>
          <button className="modal-btn ghost" onClick={onClose} disabled={loading}>取消</button>
          <button
            className="modal-btn primary"
            disabled={loading || !picked}
            onClick={handleApply}
          >
            <Wand2 size={13} strokeWidth={1.8}/>
            应用此款到袜版
          </button>
        </footer>
      </div>
    </div>
  )
}

function SkeletonCards({ count }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="style-card skeleton" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="style-card-thumb skeleton-thumb"/>
          <div className="style-card-meta">
            <div className="skeleton-line w70"/>
            <div className="skeleton-line w40"/>
          </div>
        </div>
      ))}
    </>
  )
}
