/**
 * AiExtendSheet — 款式衍生（AI 图生图）
 * 直接复用 web 端 deriveStyleVariants（含 1/2/4 套生成 + 完整袜版预览）
 */
import { useEffect, useState } from 'react'
import { Sparkles, Loader2, Wand2 } from 'lucide-react'
import BottomSheet from './BottomSheet'
import { deriveStyleVariants, STYLE_VARIANT_COUNTS } from '../../print/styleVariants'

export default function AiExtendSheet({ baseDesign, resources, onClose, onApply }) {
  const [count, setCount] = useState(2)
  const [variants, setVariants] = useState([])
  const [picked, setPicked] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      await new Promise((r) => setTimeout(r, 500))
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

  const footer = (
    <div className="mp-sheet-footer-row">
      <button
        className="mp-cta-secondary"
        onClick={onClose}
        disabled={loading}
      >取消</button>
      <button
        className="mp-cta-primary"
        disabled={loading || !picked}
        onClick={handleApply}
      >
        <Wand2 size={12} /> 应用此款
      </button>
    </div>
  )

  return (
    <BottomSheet
      title={
        <span className="mp-pay-title-row">
          <Sparkles size={13} /> 款式衍生
        </span>
      }
      subtitle="基于当前设计 AI 推荐变体"
      onClose={loading ? undefined : onClose}
      closable={!loading}
      size="tall"
      footer={footer}
    >
      <div className="mp-ai-count-row">
        {STYLE_VARIANT_COUNTS.map((n) => (
          <button
            key={n}
            className={`mp-ai-count ${count === n ? 'active' : ''}`}
            disabled={loading}
            onClick={() => setCount(n)}
          >
            {n} 款
          </button>
        ))}
      </div>

      <div className={`mp-variant-grid count-${count}`}>
        {loading
          ? Array.from({ length: count }).map((_, i) => (
              <div key={i} className="mp-variant-card skeleton">
                <div className="mp-variant-thumb" />
                <div className="mp-variant-line" />
                <div className="mp-variant-line short" />
              </div>
            ))
          : variants.map((v) => (
              <button
                key={v.id}
                className={`mp-variant-card ${picked === v.id ? 'active' : ''}`}
                onClick={() => setPicked(v.id)}
              >
                <div className="mp-variant-thumb">
                  {v.cover && <img src={v.cover} alt={v.label} />}
                </div>
                <div className="mp-variant-name">{v.pattern}</div>
                <div className="mp-variant-scheme">{v.scheme}</div>
              </button>
            ))}
      </div>

      {loading && (
        <div className="mp-loading-tip">
          <Loader2 size={12} className="mp-spin" />
          AI 正在创作中…
        </div>
      )}
    </BottomSheet>
  )
}
