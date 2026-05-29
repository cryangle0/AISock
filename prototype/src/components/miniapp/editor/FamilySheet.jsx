/**
 * FamilySheet — 亲子袜套装（移动版）
 * 行为对齐 web 端 FamilyPairModal（demo 静态图 + 选择 + 提示）
 */
import { useState } from 'react'
import { Heart, Users, Wand2 } from 'lucide-react'
import BottomSheet from './BottomSheet'

const DEMO_PAIRS = [
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
]

export default function FamilySheet({ onClose }) {
  const [picked, setPicked] = useState(DEMO_PAIRS[0].id)
  const [hint, setHint] = useState('')

  const showHint = (msg) => {
    setHint(msg)
    setTimeout(() => setHint(''), 1400)
  }

  const footer = (
    <div className="mp-sheet-footer-row">
      <button className="mp-cta-secondary" onClick={onClose}>取消</button>
      <button
        className="mp-cta-secondary"
        onClick={() => showHint('演示模式：暂不支持保存')}
      >
        保存套装
      </button>
      <button
        className="mp-cta-primary"
        onClick={() => showHint('演示模式：暂不支持应用')}
      >
        <Wand2 size={12} /> 应用成人款
      </button>
    </div>
  )

  return (
    <BottomSheet
      title={
        <span className="mp-pay-title-row">
          <Heart size={13} /> 亲子袜套装
        </span>
      }
      subtitle="基于当前设计的 2 组示例"
      onClose={onClose}
      size="tall"
      footer={footer}
    >
      <div className="mp-family-grid">
        {DEMO_PAIRS.map((p) => (
          <button
            key={p.id}
            className={`mp-family-card ${picked === p.id ? 'active' : ''}`}
            onClick={() => setPicked(p.id)}
          >
            <div className="mp-family-thumb">
              <img src={p.demoImage} alt={p.name} />
            </div>
            <div className="mp-family-name">{p.name}</div>
            <div className="mp-family-scheme">
              <Users size={10} /> {p.scheme}
            </div>
          </button>
        ))}
      </div>

      {hint && <div className="mp-inline-hint">{hint}</div>}
    </BottomSheet>
  )
}
