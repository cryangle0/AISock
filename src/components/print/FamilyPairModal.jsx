import { useState, useEffect } from 'react'
import { X, Heart, Users, Wand2 } from 'lucide-react'
import '../Modal.css'
import './AiExtendModal.css'

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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 直接使用静态demo图片
    const demoPairs = [
      {
        id: 'demo-1',
        name: '亲子套装示例 1',
        scheme: '温馨配色 · 成人 + 儿童',
        demoImage: '/family-demo1.webp',
      },
      {
        id: 'demo-2',
        name: '亲子套装示例 2',
        scheme: '活力配色 · 成人 + 儿童',
        demoImage: '/family-demo2.webp',
      },
    ]
    setPairs(demoPairs)
    setPicked(demoPairs[0]?.id ?? null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApply = () => {
    // Demo模式下不执行应用操作
    alert('这是演示图片，暂不支持应用到袜版')
  }

  const handleSavePair = () => {
    // Demo模式下不执行保存操作
    alert('这是演示图片，暂不支持保存')
  }

  return (
    <div className="modal-mask" onClick={onClose}>
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
              基于当前完整设计，展示 2 组亲子袜套装示例
            </div>
          </div>
          <div className="style-extend-head-actions">
            <button className="modal-close" onClick={onClose}>
              <X size={16} strokeWidth={1.6}/>
            </button>
          </div>
        </header>

        <div className={`style-extend-grid count-${count}`}>
          {pairs.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`style-card family-pair-card ${picked === p.id ? 'active' : ''}`}
              onClick={() => setPicked(p.id)}
            >
              <div className="family-pair-demo-image">
                <img src={p.demoImage} alt={p.name}/>
              </div>
              <div className="style-card-meta">
                <div className="style-card-name">{p.name}</div>
                <div className="style-card-scheme">
                  <Users size={10} strokeWidth={1.8}/>
                  {p.scheme}
                </div>
              </div>
            </button>
          ))}
        </div>

        <footer className="modal-foot">
          <span className="style-extend-flex"/>
          <button className="modal-btn ghost" onClick={onClose}>取消</button>
          <button
            className="modal-btn ghost"
            onClick={handleSavePair}
            title="把两款一起保存到我的设计"
          >
            保存为亲子套装
          </button>
          <button
            className="modal-btn primary"
            disabled={!picked}
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
