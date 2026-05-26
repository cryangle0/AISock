/**
 * Feed —— Web "推荐" 页（与小程序 BFeed 对齐）
 *
 * 占位：精选灵感 + 编辑器精选作品（待接入真实推荐流）
 */
import { Compass, Sparkles, ChevronRight } from 'lucide-react'
import './Feed.css'

const FEATURED = [
  { id: 'f1', title: '敦煌九色鹿', tag: '主题',  bg: 'linear-gradient(135deg,#C9B89A,#8C5A3C)', accent: '#fff' },
  { id: 'f2', title: '飞天乐舞',   tag: '主题',  bg: 'linear-gradient(135deg,#A8C4B0,#5a8a7d)', accent: '#fff' },
  { id: 'f3', title: '千手观音',   tag: '主题',  bg: 'linear-gradient(135deg,#D6A87A,#A05A3C)', accent: '#fff' },
  { id: 'f4', title: '二十四节气', tag: '系列',  bg: 'linear-gradient(135deg,#E8D5B8,#C9B89A)', accent: '#2B1F14' },
  { id: 'f5', title: '文创物语',   tag: '系列',  bg: 'linear-gradient(135deg,#DEC38A,#C7A66E)', accent: '#2B1F14' },
  { id: 'f6', title: '色卡推荐',   tag: '工具',  bg: 'linear-gradient(135deg,#F0E4D1,#C5483C)', accent: '#fff' },
]

export default function Feed({ onJump }) {
  return (
    <div className="feed-page">
      <header className="feed-head">
        <div>
          <h1 className="feed-title">
            <Compass size={20} strokeWidth={1.6}/> 推荐
          </h1>
          <p className="feed-sub">为你精选的主题、配色与灵感库</p>
        </div>
        <button className="feed-cta" onClick={() => onJump?.('设计')}>
          <Sparkles size={14} strokeWidth={1.8}/> 直接设计 <ChevronRight size={12} strokeWidth={1.8}/>
        </button>
      </header>

      <section className="feed-section">
        <h2 className="feed-section-title">主题精选</h2>
        <div className="feed-grid">
          {FEATURED.map((f) => (
            <button key={f.id} className="feed-card" style={{ background: f.bg, color: f.accent }}>
              <span className="feed-card-tag">{f.tag}</span>
              <span className="feed-card-name">{f.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="feed-section">
        <h2 className="feed-section-title">编辑精选</h2>
        <div className="feed-empty">
          <Compass size={28} strokeWidth={1.4}/>
          <p>更多设计师作品/教程/活动即将上线</p>
          <button className="feed-cta-ghost" onClick={() => onJump?.('设计')}>先去试试 AI 设计</button>
        </div>
      </section>
    </div>
  )
}
