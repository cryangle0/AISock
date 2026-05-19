/**
 * Sidebar —— 实际渲染为顶部水平导航栏
 *
 * 视觉对齐参考稿：
 *   左：品牌 logo + "爱花型 · 设计 / SOCK DESIGN" 双行
 *   中：5 个 tab 图标（首页 / 设计 / 订单管理 / 素材库 / 我的设计）
 *   右：暗色切换 + 通知 + 用户身份
 */
import { useState, useRef, useEffect } from 'react'
import './Sidebar.css'
import { Sun, Moon, LogOut, Bell, ChevronDown } from 'lucide-react'
import { BrandLogo } from './BrandLogo'

export default function Sidebar({ darkMode, onToggleDark, onLogout }) {
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef(null)

  useEffect(() => {
    if (!avatarOpen) return
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarOpen])

  return (
    <header className="topnav">
      {/* 左：品牌 */}
      <div className="topnav-brand">
        <span className="topnav-logo"><BrandLogo size={36}/></span>
        <span className="topnav-brand-text">
          <span className="topnav-brand-cn">爱花型 · 设计</span>
          <span className="topnav-brand-en">SOCK DESIGN</span>
        </span>
      </div>

      {/* 中间留空 */}
      <div className="topnav-spacer"/>

      {/* 右：操作 */}
      <div className="topnav-actions">
        <button
          className="topnav-icon-btn"
          onClick={onToggleDark}
          aria-label={darkMode ? '切换亮色' : '切换暗色'}
          title={darkMode ? '切换亮色' : '切换暗色'}
        >
          {darkMode ? <Sun size={16} strokeWidth={1.6}/> : <Moon size={16} strokeWidth={1.6}/>}
        </button>
        <button className="topnav-icon-btn" aria-label="通知" title="通知">
          <Bell size={16} strokeWidth={1.6}/>
          <span className="topnav-icon-dot" aria-hidden="true"/>
        </button>

        <div className="topnav-user-wrap" ref={avatarRef}>
          <button
            className={`topnav-user ${avatarOpen ? 'open' : ''}`}
            onClick={() => setAvatarOpen((v) => !v)}
          >
            <span className="topnav-user-avatar">花</span>
            <span className="topnav-user-name">花型设计师</span>
            <ChevronDown size={12} strokeWidth={2}/>
          </button>
          {avatarOpen && (
            <div className="topnav-popover">
              <button
                className="topnav-popover-item logout"
                onClick={() => { setAvatarOpen(false); onLogout?.() }}
              >
                <LogOut size={14} strokeWidth={1.6}/>
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
