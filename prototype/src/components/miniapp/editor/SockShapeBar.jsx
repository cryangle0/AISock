/**
 * SockShapeBar —— 编辑器顶部袜型选择条
 *
 * 把"袜型选择"前移到流程最前，用户先选袜版形状，再印花/调节/颜色。
 * 用横向滚动 chip 形式展示所有可选袜型，当前选中高亮。
 */
import { Layers, Check } from 'lucide-react'
import { SOCK_TYPES } from '../../print/sockTypes'

export default function SockShapeBar({ sockTypeId, onChange }) {
  const current = SOCK_TYPES.find((s) => s.id === sockTypeId) || SOCK_TYPES[0]

  return (
    <div className="mp-shape-bar">
      <div className="mp-shape-bar-head">
        <span className="mp-shape-bar-step">1</span>
        <div className="mp-shape-bar-title">
          <span>选袜版</span>
          <small>当前：{current?.name}</small>
        </div>
        <Layers size={12} strokeWidth={1.6} className="mp-shape-bar-icon"/>
      </div>
      <div className="mp-shape-bar-list">
        {SOCK_TYPES.map((s) => {
          const active = s.id === sockTypeId
          return (
            <button
              key={s.id}
              className={`mp-shape-chip ${active ? 'active' : ''}`}
              onClick={() => onChange?.(s.id)}
              title={s.name}
            >
              {active && <Check size={10} strokeWidth={2.4} className="mp-shape-chip-tick"/>}
              <span className="mp-shape-chip-name">{s.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
