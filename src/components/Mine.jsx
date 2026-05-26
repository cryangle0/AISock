/**
 * Mine —— Web "我的" 页（与小程序 BMine 对齐）
 *
 * 区块：
 *   1) 用户卡（头像 / 手机号 / 退出）
 *   2) 数据概览（设计 / 订单 / 素材数量）
 *   3) 功能列表：我的设计 / 订单管理 / 素材库 / 设置
 */
import {
  FolderHeart, ShoppingBag, Layers, Settings, ChevronRight, LogOut, User,
} from 'lucide-react'
import './Mine.css'

export default function Mine({
  designs = [],
  orders = [],
  onJump,
  onLogout,
}) {
  return (
    <div className="mine-page">
      <header className="mine-head">
        <h1 className="mine-title">我的</h1>
        <p className="mine-sub">账户、设计与订单</p>
      </header>

      {/* 用户卡 */}
      <section className="mine-card mine-user">
        <div className="mine-avatar">
          <User size={26} strokeWidth={1.6}/>
        </div>
        <div className="mine-user-info">
          <div className="mine-user-name">花型设计师</div>
          <div className="mine-user-phone">138 **** 0000</div>
        </div>
        <button className="mine-logout" onClick={onLogout}>
          <LogOut size={14} strokeWidth={1.6}/> 退出登录
        </button>
      </section>

      {/* 数据概览 */}
      <section className="mine-stats">
        <button className="mine-stat" onClick={() => onJump?.('我的设计')}>
          <span className="mine-stat-num">{designs.length}</span>
          <span className="mine-stat-label">我的设计</span>
        </button>
        <span className="mine-stat-sep"/>
        <button className="mine-stat" onClick={() => onJump?.('购物车')}>
          <span className="mine-stat-num">{orders.length}</span>
          <span className="mine-stat-label">我的订单</span>
        </button>
        <span className="mine-stat-sep"/>
        <button className="mine-stat" onClick={() => onJump?.('素材库')}>
          <span className="mine-stat-num">∞</span>
          <span className="mine-stat-label">素材库</span>
        </button>
      </section>

      {/* 列表 */}
      <section className="mine-list">
        <ListItem
          icon={<FolderHeart size={16} strokeWidth={1.6}/>}
          label="我的设计"
          extra={`${designs.length} 个袜版`}
          onClick={() => onJump?.('我的设计')}
        />
        <ListItem
          icon={<ShoppingBag size={16} strokeWidth={1.6}/>}
          label="订单管理"
          extra={`${orders.length} 个订单`}
          onClick={() => onJump?.('购物车')}
        />
        <ListItem
          icon={<Layers size={16} strokeWidth={1.6}/>}
          label="素材库"
          extra="公共 + 个人"
          onClick={() => onJump?.('素材库')}
        />
        <ListItem
          icon={<Settings size={16} strokeWidth={1.6}/>}
          label="设置"
          extra="账号、通知"
          disabled
        />
      </section>

      <div className="mine-footer">爱花型袜业 · 2026</div>
    </div>
  )
}

function ListItem({ icon, label, extra, onClick, disabled }) {
  return (
    <button
      className={`mine-list-item ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="mine-list-icon">{icon}</span>
      <span className="mine-list-label">{label}</span>
      <span className="mine-list-extra">{extra}</span>
      <ChevronRight size={14} strokeWidth={1.6}/>
    </button>
  )
}
