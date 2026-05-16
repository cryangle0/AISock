/**
 * BAssets — 素材库（小程序版）
 * 双 scope：公共库（内置 PATTERN_LIST + 管理员上架） + 我的（用户上传）
 *
 * 与 web AssetLibrary 共享 useAssetLibrary hook，数据通过 localStorage 同步。
 */
import { useMemo, useState } from 'react'
import { Search, Trash2, ImageIcon } from 'lucide-react'
import { PATTERN_LIST } from '../../../patternConstants'
import { PatternDefs } from '../../../patterns'
import useAssetLibrary from '../../../assets/useAssetLibrary'
import ImageUploadButton from '../../editor/ImageUploadButton'

const SCOPES = [
  { key: 'public', label: '公共库' },
  { key: 'mine',   label: '我的' },
]

export default function BAssets() {
  const [scope, setScope] = useState('public')
  const [query, setQuery] = useState('')
  const lib = useAssetLibrary()

  const officialItems = useMemo(
    () => PATTERN_LIST.map((p) => ({
      id: p.id, name: p.name, source: 'official', svg: true, online: true,
    })),
    [],
  )

  const publicCombined = useMemo(
    () => [...officialItems, ...lib.publicAssets.filter((a) => a.online !== false)],
    [officialItems, lib.publicAssets],
  )

  const items = scope === 'public' ? publicCombined : lib.userAssets
  const visible = items.filter((p) => !query || (p.name || '').includes(query))

  const handleUpload = async (file) => {
    if (file) await lib.addUserAsset(file)
  }

  return (
    <div className="mp-page mp-page-assets">
      <div className="mp-search-bar">
        <Search size={12} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索花型 / 标签"
        />
      </div>

      <div className="mp-asset-summary">
        {scope === 'public'
          ? `${publicCombined.length} 套花型 · 拖到编辑器即可应用`
          : `${lib.userAssets.length} 张 · 我上传的素材`}
      </div>

      <div className="mp-filter-tabs">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            className={`mp-filter-tab ${scope === s.key ? 'active' : ''}`}
            onClick={() => setScope(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {scope === 'mine' && lib.userAssets.length === 0 ? (
        <MineEmpty onUpload={handleUpload} />
      ) : (
        <AssetGrid items={visible} scope={scope} onRemove={lib.removeUserAsset} />
      )}

      {scope === 'mine' && lib.userAssets.length > 0 && (
        <div className="mp-asset-fab-wrap">
          <ImageUploadButton
            onPick={handleUpload}
            label="上传素材"
            variant="primary"
          />
        </div>
      )}
    </div>
  )
}

function AssetGrid({ items, scope, onRemove }) {
  if (items.length === 0) {
    return <div className="mp-empty-state"><p>没有匹配的素材</p></div>
  }
  return (
    <div className="mp-assets-grid">
      {items.map((p) => (
        <div key={p.id} className="mp-asset-card">
          {p.svg ? (
            <svg viewBox="0 0 80 80" className="mp-asset-thumb">
              <PatternDefs uid={`assets-${p.id}`} />
              <rect width="80" height="80" rx="10" fill={`url(#${p.id}-assets-${p.id})`} />
            </svg>
          ) : (
            <img src={p.url} alt={p.name} className="mp-asset-thumb-img" />
          )}
          <div className="mp-asset-name">{p.name}</div>
          <div className="mp-asset-tags">
            {p.source === 'official' && <span className="mp-asset-tag">官方</span>}
            {p.source === 'admin' && <span className="mp-asset-tag admin">管理员</span>}
            {p.source === 'user' && <span className="mp-asset-tag mine">我的</span>}
            <span className="mp-asset-tag light">免费</span>
          </div>
          {scope === 'mine' && (
            <button
              type="button"
              className="mp-asset-remove"
              aria-label="删除"
              onClick={() => onRemove(p.id)}
            >
              <Trash2 size={10} strokeWidth={1.8} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function MineEmpty({ onUpload }) {
  return (
    <div className="mp-empty-state mp-mine-empty">
      <ImageIcon size={28} strokeWidth={1.2} />
      <p>个人素材库为空</p>
      <ImageUploadButton
        onPick={onUpload}
        label="上传第一张素材"
        variant="primary"
      />
    </div>
  )
}
