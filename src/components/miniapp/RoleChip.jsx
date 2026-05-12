/**
 * RoleChip — 角色切换胶囊（C 端消费者 ↔ B 端设计师）
 */
import './RoleChip.css'

export default function RoleChip({ role, onChange, variant = 'light' }) {
  return (
    <div className={`role-chip role-chip-${variant}`} role="tablist" aria-label="角色切换">
      <button
        role="tab"
        aria-selected={role === 'consumer'}
        className={`role-chip-btn ${role === 'consumer' ? 'active' : ''}`}
        onClick={() => onChange('consumer')}
      >
        我要定制
      </button>
      <button
        role="tab"
        aria-selected={role === 'designer'}
        className={`role-chip-btn ${role === 'designer' ? 'active' : ''}`}
        onClick={() => onChange('designer')}
      >
        我是设计师
      </button>
    </div>
  )
}
