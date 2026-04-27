import { useEffect, useState } from 'react'
import { X, Sparkles, Wand2 } from 'lucide-react'
import '../Modal.css'
import { AI_EXTEND_PRESETS, deriveVariants } from './imageVariants'

/**
 * AI 同款延伸 — 基于当前印花生成 4 张色调变体，用户挑一张应用回画布。
 *
 * @param {string} basePrintImage  当前印花 dataURL/URL
 * @param {string} basePrintName
 * @param {()=>void} onClose
 * @param {(url:string,name:string)=>void} onApply
 */
export default function AiExtendModal({ basePrintImage, basePrintName, onClose, onApply }) {
  const [variants, setVariants] = useState([])
  const [picked, setPicked] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const vs = await deriveVariants(basePrintImage, AI_EXTEND_PRESETS)
      if (!alive) return
      setVariants(vs)
      setPicked(vs[0]?.id ?? null)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [basePrintImage])

  const apply = () => {
    const v = variants.find((x) => x.id === picked)
    if (!v) return
    const tag = v.label.replace('延伸', '').trim()
    const newName = basePrintName ? `${basePrintName} · ${tag}` : `AI 延伸 · ${tag}`
    onApply?.(v.url, newName)
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <div className="modal-title">
              <Sparkles size={15} strokeWidth={1.6}/>
              AI 同款延伸
            </div>
            <div className="modal-sub">基于当前印花，AI 推荐 4 个设计方向</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.6}/></button>
        </header>

        <div className="ext-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <VariantCard
            url={basePrintImage}
            label="原图"
            desc="当前印花"
            disabled
            isOrigin
          />
          {(loading ? AI_EXTEND_PRESETS : variants).map((v, i) => (
            <VariantCard
              key={v.id}
              url={loading ? basePrintImage : v.url}
              label={v.label}
              desc={v.desc}
              loading={loading}
              active={picked === v.id}
              onClick={() => !loading && setPicked(v.id)}
              loadingDelay={i * 80}
            />
          ))}
        </div>

        <footer className="modal-foot">
          <button className="modal-btn ghost" onClick={onClose}>取消</button>
          <button
            className="modal-btn primary"
            disabled={loading || !picked}
            onClick={apply}
          >
            <Wand2 size={13} strokeWidth={1.8}/>
            应用到袜版
          </button>
        </footer>
      </div>
    </div>
  )
}

function VariantCard({ url, label, desc, loading, active, isOrigin, disabled, onClick, loadingDelay = 0 }) {
  return (
    <button
      className={`ext-card ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
    >
      <div className="ext-thumb">
        {url && (
          <img
            src={url}
            alt={label}
            className={loading ? 'ext-thumb-img loading' : 'ext-thumb-img'}
            style={loading ? { animationDelay: `${loadingDelay}ms` } : undefined}
          />
        )}
        {isOrigin && <span className="ext-thumb-badge">原</span>}
      </div>
      <div className="ext-card-label">{label}</div>
      <div className="ext-card-desc">{desc}</div>
    </button>
  )
}
