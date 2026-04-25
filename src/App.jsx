import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import SockEditor from './components/SockEditor'
import MyDesigns from './components/MyDesigns'
import Orders from './components/Orders'
import AssetLibrary from './components/AssetLibrary'
import LoginPage from './components/LoginPage'
import MiniPhone from './components/MiniPhone'
import './App.css'

function App() {
  const [authed, setAuthed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aisock.authed')) === true } catch { return false }
  })
  const [activeMenu, setActiveMenu] = useState('设计')
  const [darkMode, setDarkMode] = useState(false)

  // 设计稿（本地状态模拟）
  const [designs, setDesigns] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aisock.designs')) || demoDesigns() } catch { return demoDesigns() }
  })
  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aisock.orders')) || demoOrders() } catch { return demoOrders() }
  })
  const [currentSession, setCurrentSession] = useState({ id: 1, name: '春日少女款 · 草稿' })
  const [sessions, setSessions] = useState([
    { id: 1, name: '春日少女款 · 草稿', date: '2026-04-25 修改' },
    { id: 2, name: '商务通勤款 · v2', date: '2026-04-24 修改' },
    { id: 3, name: '运动透气款', date: '2026-04-22 修改' },
  ])

  const handleLogin = () => {
    localStorage.setItem('aisock.authed', 'true')
    setAuthed(true)
  }
  const handleLogout = () => {
    localStorage.setItem('aisock.authed', 'false')
    setAuthed(false)
  }

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('aisock.designs', JSON.stringify(designs))
  }, [designs])

  useEffect(() => {
    localStorage.setItem('aisock.orders', JSON.stringify(orders))
  }, [orders])

  const handleNewSession = () => {
    const id = Date.now()
    const ns = { id, name: '未命名袜版', date: '刚刚' }
    setSessions(prev => [ns, ...prev])
    setCurrentSession(ns)
  }
  const handleRenameSession = (id, name) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, name } : s))
    if (currentSession.id === id) setCurrentSession(prev => ({ ...prev, name }))
  }
  const handleDeleteSession = (id) => {
    setSessions(prev => {
      const left = prev.filter(s => s.id !== id)
      if (currentSession.id === id && left.length) setCurrentSession(left[0])
      return left
    })
  }

  const handleSaveDesign = (design) => {
    const id = Date.now()
    const item = { id, ...design, savedAt: new Date().toLocaleString('zh-CN') }
    setDesigns(prev => [item, ...prev])
  }

  const handlePlaceOrder = (orderData) => {
    const id = Date.now()
    setOrders(prev => [{
      id,
      no: `AS${id.toString().slice(-8)}`,
      ...orderData,
      status: '待生产',
      createdAt: new Date().toLocaleString('zh-CN'),
    }, ...prev])
  }

  if (!authed) return <LoginPage onLogin={handleLogin} />

  return (
    <div className="app-layout">
      <Sidebar
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(v => !v)}
        onLogout={handleLogout}
      />
      <div className="main-area">
        {activeMenu === '设计' && (
          <>
            <TopBar
              currentSession={currentSession}
              sessions={sessions}
              onSessionSelect={setCurrentSession}
              onNewSession={handleNewSession}
              onRename={handleRenameSession}
              onDelete={handleDeleteSession}
            />
            <SockEditor
              onSaveDesign={handleSaveDesign}
              onPlaceOrder={handlePlaceOrder}
            />
          </>
        )}
        {activeMenu === '我的设计' && (
          <MyDesigns designs={designs} onDelete={(id) => setDesigns(prev => prev.filter(d => d.id !== id))}/>
        )}
        {activeMenu === '订单管理' && (
          <Orders orders={orders}/>
        )}
        {activeMenu === '素材库' && (
          <AssetLibrary/>
        )}
      </div>
      <MiniPhone activeMenu={activeMenu}/>
    </div>
  )
}

function demoDesigns() {
  return [
    { id: 101, name: '春日少女款', cover: 'p-floral', regions: { welt: 'p-stripe', cuff: 'p-floral', body: 'p-floral', toe: 'p-dots' }, savedAt: '2026-04-24' },
    { id: 102, name: '商务通勤款', cover: 'p-mono', regions: { welt: 'p-mono', cuff: 'p-mono', body: 'p-mono', toe: 'p-stripe' }, savedAt: '2026-04-22' },
    { id: 103, name: '梦幻大花款', cover: 'p-flower-big', regions: { welt: 'p-stripe', cuff: 'p-flower-big', body: 'p-flower-big', toe: 'p-checker' }, savedAt: '2026-04-20' },
    { id: 104, name: '海蓝度假款', cover: 'p-blue', regions: { welt: 'p-blue', cuff: 'p-blue', body: 'p-blue', toe: 'p-dots' }, savedAt: '2026-04-18' },
    { id: 105, name: '薄荷清新款', cover: 'p-mint', regions: { welt: 'p-mint', cuff: 'p-mint', body: 'p-mint', toe: 'p-stripe' }, savedAt: '2026-04-15' },
    { id: 106, name: '金色奢华款', cover: 'p-gold', regions: { welt: 'p-gold', cuff: 'p-gold', body: 'p-flower-big', toe: 'p-gold' }, savedAt: '2026-04-12' },
  ]
}

function demoOrders() {
  return [
    { id: 1, no: 'AS20260424001', designName: '春日少女款', sizes: { S: 30, M: 50, L: 20 }, total: 100, material: '棉混纺', address: '杭州市西湖区文一路 123 号', status: '生产中', createdAt: '2026-04-24 10:32' },
    { id: 2, no: 'AS20260422007', designName: '商务通勤款', sizes: { M: 100, L: 80 }, total: 180, material: '抗菌纤维', address: '北京市朝阳区建国路 88 号', status: '已发货', createdAt: '2026-04-22 16:18' },
    { id: 3, no: 'AS20260418014', designName: '梦幻大花款', sizes: { S: 40, M: 60 }, total: 100, material: '羊毛', address: '深圳市南山区科技园北区', status: '已完成', createdAt: '2026-04-18 09:05' },
  ]
}

export default App
