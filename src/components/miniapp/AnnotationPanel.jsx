/**
 * AnnotationPanel — 全屏模式下右侧注解栏
 * 展示当前页的 summary / 页面构成 / 业务规则 / 可跳转 chip
 */
import { PAGE_META } from './pageMeta'
import './AnnotationPanel.css'

export default function AnnotationPanel({ page, role, onNavigate }) {
  const meta = PAGE_META[page]
  if (!meta) return null

  const linkedPages = (meta.links || [])
    .map(key => PAGE_META[key])
    .filter(Boolean)

  return (
    <aside className="annot-panel" role="complementary" aria-label="页面说明">
      <header className="annot-header">
        <span className="annot-no">{meta.no} / 18</span>
        <h3 className="annot-title">{meta.title}</h3>
        {meta.isTab && <span className={`annot-tab-badge role-${role}`}>tab</span>}
      </header>

      <div className="annot-summary">{meta.summary}</div>

      <section className={`annot-block role-${role}`}>
        <div className="annot-block-label">页面构成</div>
        <ul className="annot-list">
          {(meta.modules || []).map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="annot-block blue">
        <div className="annot-block-label">业务规则</div>
        <ul className="annot-list">
          {(meta.rules || []).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>

      {linkedPages.length > 0 && (
        <footer className="annot-footer">
          <div className="annot-footer-label">可跳转到</div>
          <div className="annot-chips">
            {linkedPages.map(p => (
              <button
                key={p.key}
                className={`annot-chip role-${p.role}`}
                onClick={() => onNavigate(p.key)}
                title={p.summary}
              >
                → {p.title}
              </button>
            ))}
          </div>
        </footer>
      )}
    </aside>
  )
}
