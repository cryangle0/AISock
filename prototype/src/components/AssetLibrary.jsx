/**
 * AssetLibrary（页面）— 素材库总览 + 后台管理
 *   - 公共库：内置（PATTERN_LIST，只读）+ 管理员上架（可增删改 + 上下架）
 *   - 我的：登录用户上传，可删除
 *
 * 注：当前没有独立账号体系，前端展示的"管理员"权限通过 admin 开关切换，
 * 真实环境应根据 user.role 决定。
 */
import { useMemo, useRef, useState } from 'react'
import './AssetLibrary.css'
import {
  Search, Upload, Trash2, EyeOff, Eye, Shield, ImageIcon, Plus,
} from 'lucide-react'
import { PATTERN_LIST } from './patternConstants'
import { PatternDefs } from './patterns'
import useAssetLibrary from './assets/useAssetLibrary'

const SCOPES = [
  { key: 'public', label: '公共库', desc: '所有用户可见' },
  { key: 'mine',   label: '我的',   desc: '我上传的素材' },
]

export default function AssetLibrary() {
  const [scope, setScope] = useState('public')
  const [query, setQuery] = useState('')
  const [admin, setAdmin] = useState(false)
  const lib = useAssetLibrary()
  const fileInputRef = useRef(null)

  const officialItems = useMemo(
    () => PATTERN_LIST.map((p) => ({
      id: p.id, name: p.name, source: 'official', online: true, svg: true,
    })),
    [],
  )

  const publicCombined = useMemo(
    () => [...officialItems, ...lib.publicAssets],
    [officialItems, lib.publicAssets],
  )

  const visiblePublic = publicCombined.filter((p) => {
    if (!admin && p.online === false) return false
    return !query || p.name.includes(query)
  })

  const visibleMine = lib.userAssets.filter((m) => !query || m.name.includes(query))

  const handleUpload = async (file) => {
    if (!file) return
    if (scope === 'mine') await lib.addUserAsset(file)
    else await lib.addPublicAsset(file)
  }

  const handlePick = () => fileInputRef.current?.click()
  const handleFileChange = async (e) => {
    const f = e.target.files?.[0]
    if (f) await handleUpload(f)
    e.target.value = ''
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1 className="page-title">素材库</h1>
          <p className="page-sub">
            {scope === 'public'
              ? `${publicCombined.length} 套花型 · 公共库`
              : `${lib.userAssets.length} 张 · 我的素材`}
          </p>
        </div>
        <div className="page-search">
          <Search size={13} strokeWidth={1.6} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索花型 / 标签" />
        </div>
      </header>

      <div className="lib-toolbar">
        <div className="lib-scopes" role="tablist">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={scope === s.key}
              className={`lib-scope ${scope === s.key ? 'active' : ''}`}
              onClick={() => setScope(s.key)}
            >
              <span>{s.label}</span>
              <small>{s.desc}</small>
            </button>
          ))}
        </div>

        <div className="lib-actions">
          {scope === 'public' && (
            <button
              className={`lib-admin-toggle ${admin ? 'on' : ''}`}
              onClick={() => setAdmin((v) => !v)}
              title="切换管理员视图"
            >
              <Shield size={12} strokeWidth={1.8} />
              {admin ? '管理模式' : '浏览模式'}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
          {(scope === 'mine' || admin) && (
            <button className="lib-upload-btn" onClick={handlePick}>
              <Plus size={13} strokeWidth={2} />
              {scope === 'mine' ? '上传我的素材' : '上架到公共库'}
            </button>
          )}
        </div>
      </div>

      {scope === 'public' && (
        <PublicGrid
          items={visiblePublic}
          admin={admin}
          onRemove={lib.removePublicAsset}
          onToggleOnline={lib.togglePublicOnline}
        />
      )}

      {scope === 'mine' && (
        <MineGrid
          items={visibleMine}
          onUpload={handlePick}
          onRemove={lib.removeUserAsset}
        />
      )}
    </div>
  )
}

function PublicGrid({ items, admin, onRemove, onToggleOnline }) {
  return (
    <div className="lib-grid">
      {items.map((p) => (
        <div key={p.id} className={`lib-card ${p.online === false ? 'offline' : ''}`}>
          {p.svg ? (
            <svg viewBox="0 0 80 80" className="lib-thumb">
              <PatternDefs uid={`lib-${p.id}`} />
              <rect width="80" height="80" rx="14" fill={`url(#${p.id}-lib-${p.id})`} />
            </svg>
          ) : (
            <img src={p.url} alt={p.name} className="lib-thumb-img" />
          )}
          <div className="lib-name">{p.name}</div>
          <div className="lib-tags">
            {p.source === 'official' && <span className="lib-tag">官方</span>}
            {p.source === 'admin' && <span className="lib-tag admin">管理员</span>}
            {p.online === false && <span className="lib-tag offline">已下架</span>}
            <span className="lib-tag light">免费</span>
          </div>
          {admin && p.source !== 'official' && (
            <div className="lib-card-actions">
              <button onClick={() => onToggleOnline(p.id)} title={p.online ? '下架' : '上架'}>
                {p.online ? <EyeOff size={11} /> : <Eye size={11} />}
              </button>
              <button className="danger" onClick={() => onRemove(p.id)} title="删除">
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MineGrid({ items, onUpload, onRemove }) {
  if (items.length === 0) {
    return (
      <div className="lib-mine-empty">
        <ImageIcon size={36} strokeWidth={1.2} />
        <h3>个人素材库为空</h3>
        <p>上传你喜欢的图片，让设计更随心</p>
        <button className="lib-upload-btn" onClick={onUpload}>
          <Upload size={13} strokeWidth={2} />
          上传第一张素材
        </button>
      </div>
    )
  }
  return (
    <div className="lib-grid">
      {items.map((p) => (
        <div key={p.id} className="lib-card">
          <img src={p.url} alt={p.name} className="lib-thumb-img" />
          <div className="lib-name">{p.name}</div>
          <div className="lib-tags">
            <span className="lib-tag mine">我的</span>
            <small className="lib-time">{p.createdAt}</small>
          </div>
          <div className="lib-card-actions">
            <button className="danger" onClick={() => onRemove(p.id)} title="删除">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
