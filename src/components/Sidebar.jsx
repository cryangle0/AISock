import { useState, useRef, useEffect } from 'react'
import './Sidebar.css'
import { Brush, FolderHeart, ShoppingBag, Layers, Sun, Moon, LogOut } from 'lucide-react'

const menuItems = [
  { label: '设计', icon: Brush },
  { label: '我的设计', icon: FolderHeart },
  { label: '订单管理', icon: ShoppingBag },
  { label: '素材库', icon: Layers },
]

export default function Sidebar({ activeMenu, onMenuChange, darkMode, onToggleDark, onLogout }) {
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const avatarRef = useRef(null)

  useEffect(() => {
    if (!avatarOpen) return
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarOpen])

  const handleAvatarClick = () => {
    if (!avatarOpen && avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect()
      setPopoverPos({ top: rect.top, left: rect.right + 8 })
    }
    setAvatarOpen(v => !v)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" title="AISock">
        <div className="logo-mark">
          <svg viewBox="0 0 32 32" width="26" height="26">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d4376b"/>
                <stop offset="100%" stopColor="#e85a8a"/>
              </linearGradient>
            </defs>
            <path d="M11 3 L21 3 Q22 3 22 4 L22 15 Q22 16.5 21 17.5 L13 25.5 Q12 26.5 12 28 L12 30 Q12 31 11 31 L4 31 Q3 31 3 30 L3 25 Q3 23.5 4 22.5 L10 16.5 Q11 15.5 11 14 Z" fill="url(#lg)"/>
            <rect x="11" y="3" width="11" height="3" fill="#a82850" opacity="0.6"/>
          </svg>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeMenu === item.label
          return (
            <button
              key={item.label}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onMenuChange(item.label)}
              title={item.label}
            >
              <span className="nav-icon">
                <Icon size={17} strokeWidth={isActive ? 2 : 1.5}/>
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-dark-toggle" onClick={onToggleDark} title={darkMode ? '切换亮色' : '切换暗色'}>
          {darkMode ? <Sun size={15} strokeWidth={1.6}/> : <Moon size={15} strokeWidth={1.6}/>}
        </button>
        <div className="user-avatar-wrap" ref={avatarRef}>
          <div className="user-avatar" onClick={handleAvatarClick} title="账户">U</div>
          {avatarOpen && (
            <div className="avatar-popover" style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left }}>
              <button className="avatar-popover-item logout" onClick={() => { setAvatarOpen(false); onLogout?.() }}>
                <LogOut size={14} strokeWidth={1.6}/>
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
