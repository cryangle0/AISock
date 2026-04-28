import { useEffect, useState } from 'react'
import { X, Heart, Users, Wand2, Loader2 } from 'lucide-react'
import '../Modal.css'
import './AiExtendModal.css'
import { deriveVariant } from './imageVariants'
import { deriveStyleVariants, STYLE_VARIANT_COUNTS } from './styleVariants'
import { renderSockToDataURL } from './sockRenderer'

/**
 * 亲子袜套装 — 使用与"款式衍生"一致的弹框布局。
 * 每个卡片是一组亲子设计：成人款大袜子 + 儿童款小袜子。
 *
 * @param {Object} baseDesign     { printImage, printName, colors, params }
 * @param {Object} resources      useSockResources 返回值
 * @param {()=>void} onClose
 * @param {(design:Object)=>void} onApply
 * @param {(items:{url:string,name:string,tag:string}[])=>void} onSavePair
 */
export default function FamilyPairModal({
  baseDesign, resources, onClose, onApply, onSavePair,
}) {
  const [count, setCount] = useState(2)
  const [pairs, setPairs] = useState([])
  const [picked, setPicked] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      await new Promise((r) => setTimeout(r, 600))
      if (!alive) return
      const vs = await deriveFamilyPairs(baseDesign, count, resources)
      if (!alive) return
      setPairs(vs)
      setPicked(vs[0]?.id ?? null)
      setLoading(false)
    })()
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const handleApply = () => {
    const p = pairs.find((x) => x.id === picked)
    if (!p) return
    onApply?.({
      printImage: p.adult.printImage,
      printName: p.adult.name,
      colors: p.adult.colors,
      params: p.adult.params,
    })
  }

  const handleSavePair = () => {
    if (loading) return
    const p = pairs.find((x) => x.id === picked)
    if (!p) return
    onSavePair?.([
      {
        url: p.adult.printImage,
        name: p.adult.name,
        tag: '成人款',
        cover: p.adult.cover,
        colors: p.adult.colors,
        params: p.adult.params,
      },
      {
        url: p.kid.printImage,
        name: p.kid.name,
        tag: '儿童款',
        cover: p.kid.cover,
        colors: p.kid.colors,
        params: p.kid.params,
      },
    ])
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
              <Heart size={15} strokeWidth={1.6}/>
              亲子袜套装
            </div>
            <div className="modal-sub">
              基于当前完整设计，AI 推荐
              {STYLE_VARIANT_COUNTS.includes(count) ? ` ${count} ` : ' '}组亲子袜套装
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
                  {n} 组
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
            <SkeletonFamilyCards count={count}/>
          ) : (
            pairs.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`style-card family-pair-card ${picked === p.id ? 'active' : ''}`}
                onClick={() => setPicked(p.id)}
              >
                <div className="family-pair-thumb">
                  <div className="family-sock adult">
                    <img src={p.adult.cover} alt={p.adult.name}/>
                    <span>成人</span>
                  </div>
                  <div className="family-sock kid">
                    <img src={p.kid.cover} alt={p.kid.name}/>
                    <span>儿童</span>
                  </div>
                </div>
                <div className="style-card-meta">
                  <div className="style-card-name">{p.name}</div>
                  <div className="style-card-scheme">
                    <Users size={10} strokeWidth={1.8}/>
                    {p.scheme}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <footer className="modal-foot">
          {loading && (
            <span className="style-extend-progress">
              <Loader2 size={13} strokeWidth={1.8} className="rotating"/>
              AI 正在生成亲子套装…
            </span>
          )}
          <span className="style-extend-flex"/>
          <button className="modal-btn ghost" onClick={onClose}>取消</button>
          <button
            className="modal-btn ghost"
            onClick={handleSavePair}
            disabled={loading}
            title="把两款一起保存到我的设计"
          >
            保存为亲子套装
          </button>
          <button
            className="modal-btn primary"
            disabled={loading || !picked}
            onClick={handleApply}
          >
            <Wand2 size={13} strokeWidth={1.8}/>
            应用成人款到袜版
          </button>
        </footer>
      </div>
    </div>
  )
}

async function deriveFamilyPairs(baseDesign, count, resources) {
  if (!resources?.ready) return []
  const adultVariants = await deriveStyleVariants(baseDesign, count, resources)
  return Promise.all(adultVariants.map(async (v, index) => {
    const kidPrintImage = await deriveVariant(v.printImage, {
      hueShift: 4 + index * 3,
      saturate: 0.78,
      brightness: 1.14,
      contrast: 0.95,
    })
    const kidColors = softenKidColors(v.colors, index)
    const kidParams = {
      ...v.params,
      density: Math.max(55, Math.round((v.params.density || 100) * 0.82)),
      tileDensity: Math.max(2, (v.params.tileDensity || 3) + 1),
    }
    const kidCover = await renderSockToDataURL(resources, kidPrintImage, kidColors, kidParams)
    return {
      id: `family-${v.id}`,
      name: `${v.pattern}亲子套装`,
      scheme: `${v.scheme} · 成人 + 儿童`,
      adult: {
        printImage: v.printImage,
        name: `${v.printName} · 成人款`,
        colors: v.colors,
        params: v.params,
        cover: v.cover,
      },
      kid: {
        printImage: kidPrintImage,
        name: `${v.printName} · 儿童款`,
        colors: kidColors,
        params: kidParams,
        cover: kidCover,
      },
    }
  }))
}

function softenKidColors(colors, index) {
  const kidPalettes = [
    { bodyHex: '#f6f1e7', weltHex: '#a8c9e3', heelHex: '#f0b8c4', toeHex: '#f0b8c4' },
    { bodyHex: '#fff7f2', weltHex: '#a4d4b9', heelHex: '#fcd1ad', toeHex: '#fcd1ad' },
    { bodyHex: '#f4f2ff', weltHex: '#c2b3d6', heelHex: '#bfd5e8', toeHex: '#bfd5e8' },
    { bodyHex: '#f6fff7', weltHex: '#bce0c2', heelHex: '#f8e3a3', toeHex: '#f8e3a3' },
  ]
  return {
    ...colors,
    ...kidPalettes[index % kidPalettes.length],
  }
}

function SkeletonFamilyCards({ count }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="style-card skeleton" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="family-pair-thumb skeleton-family">
            <div className="family-sock adult skeleton-thumb"/>
            <div className="family-sock kid skeleton-thumb"/>
          </div>
          <div className="style-card-meta">
            <div className="skeleton-line w70"/>
            <div className="skeleton-line w40"/>
          </div>
        </div>
      ))}
    </>
  )
}
