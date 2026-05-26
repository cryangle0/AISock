/**
 * BFeed —— 推荐 tab（占位）
 * 后续接入推荐流，目前展示一个简单提示页。
 */
import { Compass } from 'lucide-react'

export default function BFeed({ onNavigate }) {
  return (
    <div className="mp-page mp-page-feed">
      <div className="mp-feed-empty">
        <Compass size={36} strokeWidth={1.4} className="mp-feed-empty-icon"/>
        <h3>推荐</h3>
        <p>这里将展示编辑精选的袜款 / 设计师作品 / 主题专题。</p>
        <button className="mp-cta-primary" onClick={() => onNavigate?.('b-home')} style={{maxWidth: 200, margin: '0 auto'}}>
          回首页
        </button>
      </div>
    </div>
  )
}
