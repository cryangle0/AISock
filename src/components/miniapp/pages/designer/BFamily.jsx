import { Download, Save, RefreshCw } from 'lucide-react'

export default function BFamily({ onNavigate }) {
  return (
    <div className="mp-page mp-page-family">
      <div className="mp-family-preview">
        <div className="mp-family-item adult">
          <svg viewBox="0 0 100 160" className="mp-sock-svg">
            <defs>
              <clipPath id="fam-adult">
                <path d="M20 10 L80 10 L80 100 Q80 115 74 122 L48 149 Q44 153 39 153 L25 153 Q20 153 20 148 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#fam-adult)">
              <rect x="20" y="10" width="60" height="143" fill="#fce8ef" />
              <rect x="20" y="10" width="60" height="25" fill="#d4376b" opacity="0.4" />
            </g>
            <path
              d="M20 10 L80 10 L80 100 Q80 115 74 122 L48 149 Q44 153 39 153 L25 153 Q20 153 20 148 Z"
              fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2"
            />
          </svg>
          <span className="mp-family-label">成人款 · 25cm</span>
        </div>

        <div className="mp-family-item child">
          <svg viewBox="0 0 100 160" className="mp-sock-svg">
            <defs>
              <clipPath id="fam-child">
                <path d="M28 30 L72 30 L72 95 Q72 107 68 112 L48 135 Q45 138 42 138 L32 138 Q28 138 28 134 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#fam-child)">
              <rect x="28" y="30" width="44" height="108" fill="#fce8ef" />
              <rect x="28" y="30" width="44" height="18" fill="#d4376b" opacity="0.4" />
            </g>
            <path
              d="M28 30 L72 30 L72 95 Q72 107 68 112 L48 135 Q45 138 42 138 L32 138 Q28 138 28 134 Z"
              fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2"
            />
          </svg>
          <span className="mp-family-label">儿童款 · 17cm</span>
        </div>
      </div>

      <div className="mp-family-controls">
        <button className="mp-action-btn">
          <RefreshCw size={12} /> 换比例
        </button>
        <button className="mp-action-btn">
          <Download size={12} /> 分别下载
        </button>
      </div>

      <div className="mp-family-note">
        💡 儿童版将自动缩放 70% 并适配花型密度，确保与成人款视觉一致
      </div>

      <div className="mp-editor-actions">
        <button className="mp-action-btn primary" onClick={() => onNavigate('b-editor')}>
          <Save size={13} /> 保存套装
        </button>
      </div>
    </div>
  )
}
