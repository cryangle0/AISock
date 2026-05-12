import { Plus, TrendingUp, Package, Palette, DollarSign } from 'lucide-react'

const STATS = [
  { label: '今日订单', value: '12', icon: Package, color: '#d4376b' },
  { label: '进行中', value: '5', icon: TrendingUp, color: '#3a6fb0' },
  { label: '库存款', value: '38', icon: Palette, color: '#5fb18a' },
  { label: '本月收入', value: '¥28k', icon: DollarSign, color: '#b8893a' },
]

const RECENT_DESIGNS = [
  { id: 1, name: '春日碎花款', time: '2 小时前', color: '#fce8ef' },
  { id: 2, name: '商务条纹款', time: '昨天', color: '#e8f0fc' },
]

export default function BWorkspace({ onNavigate }) {
  return (
    <div className="mp-page mp-page-workspace">
      {/* 数据卡 */}
      <div className="mp-stats-grid">
        {STATS.map(s => (
          <div key={s.label} className="mp-stat-card">
            <s.icon size={16} style={{ color: s.color }} />
            <div className="mp-stat-value">{s.value}</div>
            <div className="mp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 新建 CTA */}
      <button className="mp-cta-btn" onClick={() => onNavigate('b-editor')}>
        <Plus size={16} /> 新建袜版设计
      </button>

      {/* 最近设计 */}
      <div className="mp-section-header">
        <span className="mp-section-title">最近设计</span>
        <button className="mp-section-more" onClick={() => onNavigate('b-designs')}>全部 →</button>
      </div>
      <div className="mp-recent-list">
        {RECENT_DESIGNS.map(d => (
          <button key={d.id} className="mp-recent-item" onClick={() => onNavigate('b-editor')}>
            <div className="mp-recent-thumb" style={{ background: d.color }} />
            <div className="mp-recent-info">
              <span className="mp-recent-name">{d.name}</span>
              <span className="mp-recent-time">{d.time}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 待办订单 */}
      <div className="mp-section-header">
        <span className="mp-section-title">待办订单</span>
        <button className="mp-section-more" onClick={() => onNavigate('b-orders')}>全部 →</button>
      </div>
      <div className="mp-todo-list">
        <div className="mp-todo-item">
          <span className="mp-todo-badge urgent">急</span>
          <span className="mp-todo-text">AS20260510003 待确认生产</span>
        </div>
        <div className="mp-todo-item">
          <span className="mp-todo-badge">新</span>
          <span className="mp-todo-text">AS20260511001 新订单待处理</span>
        </div>
      </div>
    </div>
  )
}
