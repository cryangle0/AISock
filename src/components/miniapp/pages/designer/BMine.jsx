/**
 * BMine —— 小程序"我的"页
 *
 * 结构：
 *   1) 用户信息卡（头像 / 手机号 / 退出登录）
 *   2) 数据概览（设计 / 订单 数量）
 *   3) 功能列表：我的设计 / 订单管理 / 素材库 / 设置
 */
import {
  FolderHeart, ShoppingBag, Layers, Settings, ChevronRight, LogOut, User,
} from 'lucide-react'

export default function BMine({
  userPhone,
  designs = [],
  orders = [],
  onNavigate,
  onLogout,
}) {
  return (
    <div className="mp-page mp-page-mine">
      {/* —— 用户信息 —— */}
      <section className="mp-mine-card">
        <div className="mp-mine-avatar">
          <User size={20} strokeWidth={1.6}/>
        </div>
        <div className="mp-mine-info">
          <div className="mp-mine-name">爱花型用户</div>
          <div className="mp-mine-phone">{maskPhone(userPhone)}</div>
        </div>
        <button className="mp-mine-logout" onClick={onLogout}>
          <LogOut size={12} strokeWidth={1.6}/> 退出
        </button>
      </section>

      {/* —— 数据概览 —— */}
      <section className="mp-mine-stats">
        <button className="mp-mine-stat" onClick={() => onNavigate?.('b-designs')}>
          <span className="mp-mine-stat-num">{designs.length}</span>
          <span className="mp-mine-stat-label">我的设计</span>
        </button>
        <span className="mp-mine-stat-sep"/>
        <button className="mp-mine-stat" onClick={() => onNavigate?.('b-orders')}>
          <span className="mp-mine-stat-num">{orders.length}</span>
          <span className="mp-mine-stat-label">我的订单</span>
        </button>
      </section>

      {/* —— 功能列表 —— */}
      <section className="mp-mine-list">
        <ListItem
          icon={<FolderHeart size={14} strokeWidth={1.6}/>}
          label="我的设计"
          extra={`${designs.length} 个袜版`}
          onClick={() => onNavigate?.('b-designs')}
        />
        <ListItem
          icon={<ShoppingBag size={14} strokeWidth={1.6}/>}
          label="订单管理"
          extra={`${orders.length} 个订单`}
          onClick={() => onNavigate?.('b-orders')}
        />
        <ListItem
          icon={<Layers size={14} strokeWidth={1.6}/>}
          label="素材库"
          extra="公共 + 个人"
          onClick={() => onNavigate?.('b-assets')}
        />
        <ListItem
          icon={<Settings size={14} strokeWidth={1.6}/>}
          label="设置"
          extra="账号、通知"
          disabled
        />
      </section>

      <div className="mp-mine-footer">
        爱花型袜业 · 2026
      </div>
    </div>
  )
}

function ListItem({ icon, label, extra, onClick, disabled }) {
  return (
    <button
      className={`mp-mine-list-item ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="mp-mine-list-icon">{icon}</span>
      <span className="mp-mine-list-label">{label}</span>
      <span className="mp-mine-list-extra">{extra}</span>
      <ChevronRight size={12} strokeWidth={1.6}/>
    </button>
  )
}

function maskPhone(phone) {
  if (!phone) return '未登录'
  const s = String(phone)
  if (s.length < 7) return s
  return `${s.slice(0, 3)} **** ${s.slice(-4)}`
}
