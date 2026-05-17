/**
 * ShareSheet —— 分享面板
 *
 * 支持把当前袜版设计 / 当前页面分享到微信好友、朋友圈、群聊。
 * 因小程序原型为前端展示，分享走"模拟"流程：渲染分享卡片 + 弹出来源选择，点击后回调 onShared。
 */
import { useEffect, useState } from 'react'
import { Share2, MessageCircle, Users, Image as ImageIcon, Link as LinkIcon, Loader2, Copy, Check } from 'lucide-react'
import BottomSheet from './BottomSheet'

const TARGETS = [
  { key: 'wechat',  label: '微信好友', icon: MessageCircle, color: '#07c160' },
  { key: 'moments', label: '朋友圈',   icon: ImageIcon,     color: '#1aad19' },
  { key: 'group',   label: '群聊',     icon: Users,         color: '#3a6fb0' },
]

export default function ShareSheet({ design, getCover, onClose, onShared }) {
  const [cover, setCover] = useState(null)
  const [coverLoading, setCoverLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setCoverLoading(true)
      try {
        const url = await getCover?.()
        if (alive) setCover(url || null)
      } finally {
        if (alive) setCoverLoading(false)
      }
    })()
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shareLink = `https://aihuaxing.cn/s/${(design?.printName || design?.name || 'design').slice(0, 16)}`

  const handleShareTo = (target) => {
    onShared?.(target.label)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText?.(shareLink)
    } catch { /* noop */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <BottomSheet
      title={
        <span className="mp-pay-title-row">
          <Share2 size={13} /> 分享设计
        </span>
      }
      subtitle="把这件袜款分享给朋友，邀请一起设计"
      onClose={onClose}
    >
      {/* 分享卡片预览 */}
      <div className="mp-share-card">
        <div className="mp-share-card-cover">
          {coverLoading ? (
            <div className="mp-share-card-loading">
              <Loader2 size={18} className="mp-spin"/>
            </div>
          ) : cover ? (
            <img src={cover} alt={design?.name || '袜版'} />
          ) : (
            <div className="mp-share-card-empty">暂无预览</div>
          )}
        </div>
        <div className="mp-share-card-meta">
          <div className="mp-share-card-title">{design?.name || '我的袜版'}</div>
          <div className="mp-share-card-sub">爱花型 · AI 袜版定制</div>
          <div className="mp-share-card-tag">点开即可同款再创作</div>
        </div>
      </div>

      {/* 链接 */}
      <div className="mp-share-link">
        <LinkIcon size={11} strokeWidth={1.6}/>
        <span className="mp-share-link-url">{shareLink}</span>
        <button className="mp-share-link-copy" onClick={handleCopy}>
          {copied ? <><Check size={11}/> 已复制</> : <><Copy size={11}/> 复制</>}
        </button>
      </div>

      {/* 分享渠道 */}
      <div className="mp-share-targets">
        {TARGETS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              className="mp-share-target"
              onClick={() => handleShareTo(t)}
            >
              <span
                className="mp-share-target-icon"
                style={{ background: `${t.color}15`, color: t.color }}
              >
                <Icon size={18} strokeWidth={1.8}/>
              </span>
              <span className="mp-share-target-label">{t.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mp-share-tip">
        分享后好友可一键同款再创作，邀请新用户注册可获得额外 AI 生图次数
      </div>
    </BottomSheet>
  )
}
