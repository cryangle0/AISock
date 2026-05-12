import { Plus, TrendingUp, Package, Palette, Coins, ArrowUpRight } from 'lucide-react'

/**
 * 数据块 — 乐高积木 bento 布局
 * 每块定义 size（决定 grid span）+ color（主题色）
 */
const STATS = [
  {
    key: 'today',
    label: '今日订单',
    value: '12',
    delta: '+12%',
    hint: '较昨日',
    icon: Package,
    size: 'hero',      // 占 2 列 2 行
    color: 'pink',
  },
  {
    key: 'progress',
    label: '进行中',
    value: '5',
    hint: '待处理',
    icon: TrendingUp,
    size: 'tall',      // 占 1 列 2 行
    color: 'blue',
  },
  {
    key: 'stock',
    label: '库存款',
    value: '38',
    hint: '可售',
    icon: Palette,
    size: 'small',     // 占 1 列 1 行
    color: 'green',
  },
  {
    key: 'income',
    label: '本月收入',
    value: '¥28k',
    delta: '+15%',
    hint: '较上月',
    icon: Coins,
    size: 'wide',      // 占 2 列 1 行
    color: 'gold',
  },
]

const RECENT_DESIGNS = [
  { id: 1, name: '春日碎花款', time: '2 小时前', color: '#fce8ef' },
  { id: 2, name: '商务条纹款', time: '昨天', color: '#e8f0fc' },
]

export default function BWorkspace({ onNavigate }) {
  return (
    <div className="mp-page mp-page-workspace">
      {/* 乐高积木 bento 数据区 */}
      <div className="mp-bento">
        {STATS.map(s => (
          <BentoBrick key={s.key} stat={s} onClick={() => onNavigate('b-orders')} />
        ))}
      </div>

      {/* 新建 CTA */}
      <button className="mp-cta-brick" onClick={() => onNavigate('b-editor')}>
        <span className="mp-cta-studs">
          <i /><i /><i />
        </span>
        <Plus size={18} />
        <span className="mp-cta-text">新建袜版设计</span>
        <ArrowUpRight size={16} className="mp-cta-arrow" />
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

/**
 * BentoBrick — 单块积木，职责单一
 */
function BentoBrick({ stat, onClick }) {
  const Icon = stat.icon
  return (
    <button
      className={`mp-brick mp-brick-${stat.size} mp-brick-${stat.color}`}
      onClick={onClick}
      aria-label={`${stat.label} ${stat.value}`}
    >
      {/* LEGO 圆凸点装饰 */}
      <span className="mp-brick-studs" aria-hidden="true">
        <i /><i /><i /><i />
      </span>

      <span className="mp-brick-icon">
        <Icon size={16} strokeWidth={2} />
      </span>

      <div className="mp-brick-body">
        <div className="mp-brick-value">{stat.value}</div>
        <div className="mp-brick-label">{stat.label}</div>
        {stat.delta && (
          <div className="mp-brick-delta">
            <TrendingUp size={9} strokeWidth={2.5} />
            {stat.delta}
            <span className="mp-brick-hint">{stat.hint}</span>
          </div>
        )}
        {!stat.delta && stat.hint && (
          <div className="mp-brick-hint solo">{stat.hint}</div>
        )}
      </div>
    </button>
  )
}
