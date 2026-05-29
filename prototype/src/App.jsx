import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Home from './components/Home'
import Feed from './components/Feed'
import Mine from './components/Mine'
import SockEditor from './components/SockEditor'
import MyDesigns from './components/MyDesigns'
import Orders from './components/Orders'
import AssetLibrary from './components/AssetLibrary'
import LoginPage from './components/LoginPage'
import MiniAppPrototype from './components/miniapp/MiniAppPrototype'
import PaymentModal from './components/order/PaymentModal'
import './App.css'

function App() {
  const [authed, setAuthed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aisock.authed')) === true } catch { return false }
  })
  const [activeMenu, setActiveMenu] = useState('首页')
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
  const [pendingOrder, setPendingOrder] = useState(null) // 待支付的订单

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
    try { localStorage.setItem('aisock.designs', JSON.stringify(designs)) }
    catch (e) { console.warn('saveLocal designs failed:', e?.message) }
  }, [designs])

  useEffect(() => {
    try { localStorage.setItem('aisock.orders', JSON.stringify(orders)) }
    catch (e) { console.warn('saveLocal orders failed:', e?.message) }
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
    setPendingOrder(orderData)
  }

  const handlePaymentDone = (payment) => {
    if (!pendingOrder) return
    const id = Date.now()
    setOrders(prev => [{
      id,
      no: `AS${id.toString().slice(-8)}`,
      ...pendingOrder,
      payment,
      status: '待生产',
      createdAt: new Date().toLocaleString('zh-CN'),
    }, ...prev])
    setPendingOrder(null)
    setActiveMenu('购物车')
  }

  const handlePaymentCancel = () => setPendingOrder(null)

  // 小程序内部完整处理"下单 + 支付"，最后直接落库
  const handleAddOrder = (order) => {
    const id = Date.now()
    setOrders(prev => [{
      id,
      no: `AS${id.toString().slice(-8)}`,
      status: '待生产',
      createdAt: new Date().toLocaleString('zh-CN'),
      ...order,
    }, ...prev])
  }

  // 编辑订单（仅备注 / 附件，其他字段不动）
  const handleUpdateOrder = (id, patch) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))
  }

  // 应用预设到"我的设计"，并跳到我的设计 tab，方便用户继续创作
  const handleApplyPreset = (preset) => {
    const id = Date.now()
    const item = {
      id,
      name: preset.name,
      regions: preset.regions,
      cover: preset.regions?.body,
      savedAt: new Date().toLocaleString('zh-CN'),
      fromPreset: true,
    }
    setDesigns(prev => [item, ...prev])
    setActiveMenu('我的设计')
  }

  if (!authed) return <LoginPage onLogin={handleLogin} />

  return (
    <div className={`app-layout ${activeMenu === '首页' ? 'is-home' : ''}`}>
      {/* 顶部水平导航 */}
      <Sidebar
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(v => !v)}
        onLogout={handleLogout}
      />

      {/* 顶导下方主体 */}
      <div className="app-body">
        {/* 左侧垂直菜单（仅首页显示） */}
        {activeMenu === '首页' && (
          <aside className="home-sidebar">
            <nav className="home-sidebar-nav">
              {[
                { key: '首页',     label: '首页',    icon: '🏠' },
                { key: '推荐',     label: '推荐',    icon: '🧭' },
                { key: '设计',     label: 'AI 设计', icon: '✏️' },
                { key: '购物车',   label: '购物车',  icon: '🛒' },
                { key: '我的',     label: '我的',    icon: '👤' },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`home-sidebar-item ${activeMenu === item.key ? 'active' : ''}`}
                  onClick={() => setActiveMenu(item.key)}
                >
                  <span className="home-sidebar-icon">{item.icon}</span>
                  <span className="home-sidebar-label">{item.label}</span>
                </button>
              ))}
            </nav>
            {/* 底部装饰：分散排布的袜版/花型 SVG —— 敦煌矿物色 */}
            <div className="home-sidebar-deco" aria-hidden="true">
              <svg className="home-sidebar-deco-sock" viewBox="0 0 80 120" width="52" height="78" style={{top:'20%',left:'10%',opacity:0.4,transform:'rotate(-12deg)'}}>
                <path d="M20 10 L60 10 L60 70 Q60 85 50 92 L35 105 Q28 110 22 108 L18 106 Q14 104 14 98 L14 70 Z" fill="none" stroke="#8C5A3C" strokeWidth="2"/>
                <rect x="20" y="10" width="40" height="12" rx="2" fill="#DEC38A" opacity="0.6"/>
              </svg>
              <svg className="home-sidebar-deco-pattern" viewBox="0 0 40 40" width="32" height="32" style={{top:'55%',left:'60%',opacity:0.3,transform:'rotate(8deg)'}}>
                <circle cx="10" cy="10" r="3" fill="#C5483C"/>
                <circle cx="30" cy="10" r="3" fill="#C5483C"/>
                <circle cx="10" cy="30" r="3" fill="#C5483C"/>
                <circle cx="30" cy="30" r="3" fill="#C5483C"/>
                <circle cx="20" cy="20" r="3" fill="#C5483C"/>
              </svg>
              <svg className="home-sidebar-deco-sock" viewBox="0 0 80 120" width="44" height="66" style={{top:'70%',left:'20%',opacity:0.32,transform:'rotate(6deg)'}}>
                <path d="M20 10 L60 10 L60 70 Q60 85 50 92 L35 105 Q28 110 22 108 L18 106 Q14 104 14 98 L14 70 Z" fill="none" stroke="#5a8a7d" strokeWidth="2"/>
                <line x1="20" y1="20" x2="60" y2="20" stroke="#5a8a7d" strokeWidth="1.5" opacity="0.5"/>
                <line x1="20" y1="28" x2="60" y2="28" stroke="#5a8a7d" strokeWidth="1.5" opacity="0.5"/>
              </svg>
              <svg className="home-sidebar-deco-pattern" viewBox="0 0 40 40" width="28" height="28" style={{top:'40%',left:'5%',opacity:0.22,transform:'rotate(-20deg)'}}>
                <rect x="5" y="5" width="12" height="12" fill="#3a6fa3" rx="2"/>
                <rect x="23" y="5" width="12" height="12" fill="#3a6fa3" rx="2"/>
                <rect x="5" y="23" width="12" height="12" fill="#3a6fa3" rx="2"/>
                <rect x="23" y="23" width="12" height="12" fill="#3a6fa3" rx="2"/>
              </svg>
              <svg className="home-sidebar-deco-pattern" viewBox="0 0 50 50" width="36" height="36" style={{top:'85%',left:'55%',opacity:0.24,transform:'rotate(15deg)'}}>
                <path d="M25 5 L30 20 L45 20 L33 30 L37 45 L25 36 L13 45 L17 30 L5 20 L20 20 Z" fill="none" stroke="#8C5A3C" strokeWidth="1.5"/>
              </svg>
            </div>
          </aside>
        )}

        {/* 中间主区 */}
        <div className="main-area">
          {activeMenu === '首页' && (
            <Home
              designs={designs}
              orders={orders}
              onJump={setActiveMenu}
              onApplyPreset={handleApplyPreset}
            />
          )}
          {activeMenu === '推荐' && (
            <Feed onJump={setActiveMenu}/>
          )}
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
          {activeMenu === '购物车' && (
            <Orders orders={orders} onUpdateOrder={handleUpdateOrder}/>
          )}
          {activeMenu === '我的' && (
            <Mine
              designs={designs}
              orders={orders}
              onJump={setActiveMenu}
              onLogout={handleLogout}
            />
          )}
          {activeMenu === '我的设计' && (
            <MyDesigns designs={designs} onDelete={(id) => setDesigns(prev => prev.filter(d => d.id !== id))}/>
          )}
          {activeMenu === '订单管理' && (
            <Orders orders={orders} onUpdateOrder={handleUpdateOrder}/>
          )}
          {activeMenu === '素材库' && (
            <AssetLibrary/>
          )}
        </div>

        {/* 右侧栏（仅首页显示） */}
        {activeMenu === '首页' && (
          <aside className="home-right-panel">
            {/* 资讯中心 */}
            <div className="home-rp-card">
              <div className="home-rp-head">
                <h3 className="home-rp-title">资讯中心</h3>
                <button className="home-rp-more">查看更多 ›</button>
              </div>
              <div className="home-rp-news">
                <div className="home-rp-news-item">
                  <span className="home-rp-news-icon" style={{background:'rgba(222, 195, 138, 0.4)'}}>🌸</span>
                  <div className="home-rp-news-text">
                    <div className="home-rp-news-title">2024 春夏趋势花型发布</div>
                    <div className="home-rp-news-meta">最新花型趋势已上线，快来获取灵感！</div>
                    <div className="home-rp-news-date">2024-06-20</div>
                  </div>
                </div>
                <div className="home-rp-news-item">
                  <span className="home-rp-news-icon" style={{background:'rgba(197, 72, 60, 0.18)'}}>🏆</span>
                  <div className="home-rp-news-text">
                    <div className="home-rp-news-title">设计大赛开启报名</div>
                    <div className="home-rp-news-meta">参与赢取丰厚奖励，展示你的创意！</div>
                    <div className="home-rp-news-date">2024-06-15</div>
                  </div>
                </div>
                <div className="home-rp-news-item">
                  <span className="home-rp-news-icon" style={{background:'rgba(90, 138, 125, 0.20)'}}>⚙️</span>
                  <div className="home-rp-news-text">
                    <div className="home-rp-news-title">系统升级维护通知</div>
                    <div className="home-rp-news-meta">9月25日 02:00~04:00 系统升级维护</div>
                    <div className="home-rp-news-date">2024-05-15</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 我的订单 */}
            <div className="home-rp-card">
              <div className="home-rp-head">
                <h3 className="home-rp-title">我的订单</h3>
                <button className="home-rp-more">查看更多 ›</button>
              </div>
              <div className="home-rp-orders">
                <div className="home-rp-stat">
                  <span className="home-rp-stat-num">{orders.length}</span>
                  <span className="home-rp-stat-label">订单总数</span>
                </div>
                <div className="home-rp-stat">
                  <span className="home-rp-stat-num">{orders.filter(o => o.status === '待生产').length}</span>
                  <span className="home-rp-stat-label">待确认</span>
                </div>
                <div className="home-rp-stat">
                  <span className="home-rp-stat-num">{orders.filter(o => o.status === '生产中').length}</span>
                  <span className="home-rp-stat-label">生产中</span>
                </div>
                <div className="home-rp-stat">
                  <span className="home-rp-stat-num">{orders.filter(o => o.status === '已完成').length}</span>
                  <span className="home-rp-stat-label">已完成</span>
                </div>
              </div>
            </div>

            {/* 常见问题 */}
            <div className="home-rp-card home-rp-faq">
              <div className="home-rp-faq-icon">🧦</div>
              <div className="home-rp-faq-text">
                <h3 className="home-rp-title">常见问题</h3>
                <p className="home-rp-faq-desc">快速查看使用说明</p>
              </div>
              <button className="home-rp-faq-btn">查看详情</button>
            </div>

            {/* 设计灵感 */}
            <div className="home-rp-card">
              <div className="home-rp-head">
                <h3 className="home-rp-title">设计灵感</h3>
              </div>
              <div className="home-rp-tips">
                <div className="home-rp-tip-item">
                  <span className="home-rp-tip-num">01</span>
                  <span className="home-rp-tip-text">尝试用 AI 延展生成同款变体</span>
                </div>
                <div className="home-rp-tip-item">
                  <span className="home-rp-tip-num">02</span>
                  <span className="home-rp-tip-text">搭配色卡映射快速换季配色</span>
                </div>
                <div className="home-rp-tip-item">
                  <span className="home-rp-tip-num">03</span>
                  <span className="home-rp-tip-text">亲子袜一键生成成人+儿童款</span>
                </div>
              </div>
            </div>

            {/* 最近活动 */}
            <div className="home-rp-card">
              <div className="home-rp-head">
                <h3 className="home-rp-title">最近活动</h3>
              </div>
              <div className="home-rp-activity">
                <div className="home-rp-activity-item">
                  <span className="home-rp-activity-dot"/>
                  <span className="home-rp-activity-text">保存了「经典条纹袜」设计</span>
                  <span className="home-rp-activity-time">2 小时前</span>
                </div>
                <div className="home-rp-activity-item">
                  <span className="home-rp-activity-dot"/>
                  <span className="home-rp-activity-text">提交了订单 AS20260524</span>
                  <span className="home-rp-activity-time">昨天</span>
                </div>
                <div className="home-rp-activity-item">
                  <span className="home-rp-activity-dot"/>
                  <span className="home-rp-activity-text">上传了 3 张新素材</span>
                  <span className="home-rp-activity-time">3 天前</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <MiniAppPrototype
        designs={designs}
        orders={orders}
        sessions={sessions}
        currentSession={currentSession}
        pendingOrder={pendingOrder}
        onSaveDesign={handleSaveDesign}
        onPlaceOrder={handlePlaceOrder}
        onAddOrder={handleAddOrder}
        onUpdateOrder={handleUpdateOrder}
        onPaymentDone={handlePaymentDone}
        onPaymentCancel={handlePaymentCancel}
        onDeleteDesign={(id) => setDesigns(prev => prev.filter(d => d.id !== id))}
        onSelectSession={setCurrentSession}
        onNewSession={handleNewSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onLogout={handleLogout}
      />

      {pendingOrder && (
        <PaymentModal
          order={pendingOrder}
          onCancel={handlePaymentCancel}
          onPaid={handlePaymentDone}
        />
      )}
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
    {
      id: 1, no: 'AS20260424001', designName: '春日少女款',
      sizes: { S: 30, M: 50, L: 20 }, total: 100,
      material: '棉', craft: 'UV 印花',
      address: '杭州市西湖区文一路 123 号', status: '生产中', createdAt: '2026-04-24 10:32',
      payment: { method: '微信支付', paidAt: '2026-04-24 10:33', amount: 2800 },
    },
    {
      id: 2, no: 'AS20260422007', designName: '商务通勤款',
      sizes: { M: 100, L: 80 }, total: 180,
      material: '尼龙', craft: '针织提花',
      address: '北京市朝阳区建国路 88 号', status: '已发货', createdAt: '2026-04-22 16:18',
      payment: { method: '支付宝', paidAt: '2026-04-22 16:19', amount: 7920 },
    },
    {
      id: 3, no: 'AS20260418014', designName: '梦幻大花款',
      sizes: { S: 40, M: 60 }, total: 100,
      material: '棉', craft: '3D 印花',
      address: '深圳市南山区科技园北区', status: '已完成', createdAt: '2026-04-18 09:05',
      payment: { method: '银行卡', paidAt: '2026-04-18 09:06', amount: 3400 },
    },
  ]
}

export default App
