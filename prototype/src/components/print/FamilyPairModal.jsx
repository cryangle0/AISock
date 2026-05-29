import { useState } from 'react'
import { X, Heart, Users, Wand2 } from 'lucide-react'
import '../Modal.css'
import './AiExtendModal.css'

/**
 * 亲子袜套装 — 使用与"款式衍生"一致的弹框布局。
 * 每个卡片是一组亲子设计：成人款大袜子 + 儿童款小袜子。
 *
 * 当前为 demo 模式：仅展示 2 组静态示例图片，应用/保存暂为提示。
 */
export default function FamilyPairModal({ onClose }) {
  const [pairs] = useState(() => [
    {
      id: 'demo-1',
      name: '亲子套装示例 1',
      scheme: '温馨配色 · 成人 + 儿童',
      demoImage: `${import.meta.env.BASE_URL}family-demo1.webp`,
    },
    {
      id: 'demo-2',
      name: '亲子套装示例 2',
      scheme: '活力配色 · 成人 + 儿童',
      demoImage: `${import.meta.env.BASE_URL}family-demo2.webp`,
    },
  ])
  const [picked, setPicked] = useState(pairs[0]?.id ?? null)
  const count = 2

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
