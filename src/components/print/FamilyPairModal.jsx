import { useEffect, useState } from 'react'
import { X, Heart, Users, Wand2 } from 'lucide-react'
import '../Modal.css'
import './AiExtendModal.css'
import { FAMILY_PAIR_PRESETS, deriveVariants } from './imageVariants'

/**
 * 亲子袜套装 — 基于当前印花同时输出"成人"+"儿童"两个版本。
 * 用户可以：
 *   - 单独选择一款应用回当前画布
 *   - 或者一键"保存为亲子套装"，把两款都加入"我的设计"
 *
 * @param {string} basePrintImage
 * @param {string} basePrintName
 * @param {()=>void} onClose
 * @param {(url:string,name:string)=>void} onApply              单选应用
 * @param {(items:{url:string,name:string,tag:string}[])=>void} onSavePair  保存套装
 */
export default function FamilyPairModal({
  basePrintImage, basePrintName, onClose, onApply, onSavePair,
}) {
  const [variants, setVariants] = useState([])
  const [picked, setPicked] = useState('kid')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const vs = await deriveVariants(basePrintImage, FAMILY_PAIR_PRESETS)
      if (!alive) return
      setVariants(vs)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [basePrintImage])

  const handleApply = () => {
    const v = variants.find((x) => x.id === picked)
    if (!v) return
    const tag = v.label
    const newName = basePrintName ? `${basePrintName} · ${tag}` : `亲子袜 · ${tag}`
    onApply?.(v.url, newName)
  }

  const handleSavePair = () => {
    if (loading || variants.length < 2) return
    const baseName = basePrintName || '亲子袜'
    onSavePair?.(variants.map((v) => ({
      url: v.url,
      name: `${baseName} · ${v.label}`,
      tag: v.label,
    })))
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-card" style={{ width: 'min(640px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <div className="modal-title">
              <Heart size={15} strokeWidth={1.6}/>
              亲子袜套装
            </div>
            <div className="modal-sub">基于当前印花，AI 生成成人款 + 儿童款两件套</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.6}/></button>
        </header>

        <div className="family-grid">
          {(loading ? FAMILY_PAIR_PRESETS : variants).map((v) => (
            <button
              key={v.id}
              type="button"
              className={`family-card ${v.id} ${picked === v.id ? 'active' : ''}`}
              onClick={() => !loading && setPicked(v.id)}
              disabled={loading}
            >
              <div className="family-thumb">
                <img
                  src={loading ? basePrintImage : v.url}
                  alt={v.label}
                  style={loading ? { filter: 'blur(6px) saturate(0.5)' } : undefined}
                />
              </div>
              <div className="family-info">
                <span className="family-tag">
                  <Users size={11} strokeWidth={1.8}/>
                  {v.label}
                </span>
                <div className="family-name">{v.id === 'adult' ? '原始花型' : '柔和儿童版'}</div>
                <div className="family-desc">{v.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <footer className="modal-foot">
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
            应用此款到袜版
          </button>
        </footer>
      </div>
    </div>
  )
}
