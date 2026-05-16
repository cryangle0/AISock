/**
 * OrderEditModal — 订单详情查看 + 编辑（备注 / 附件）
 *
 * 完整对齐小程序的 BOrderDetail：
 *   - 5 步状态进度条
 *   - 设计稿大图 + 工艺参数
 *   - 尺码分布（共 N 双 + 进度条）
 *   - 订单号 / 时间 / 支付 / 收件人 / 地址 / 金额
 *   - 备注 + 附件（可在线编辑保存）
 *
 * 编辑只允许改备注和附件，金额/状态/收货等业务字段保持只读。
 */
import { useRef, useState } from 'react'
import {
  X, Save, Paperclip, Upload, Trash2, FileText, Pencil,
  Copy, CheckCircle, Clock, Truck, Package, Headphones,
} from 'lucide-react'
import '../Modal.css'
import './OrderEditModal.css'

const STATUS_FLOW = ['待生产', '生产中', '已发货', '已完成']
const STATUS_ICONS = {
  '待生产': Clock,
  '生产中': Package,
  '已发货': Truck,
  '已完成': CheckCircle,
}

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = (e) => resolve(e.target.result)
  r.onerror = reject
  r.readAsDataURL(file)
})

export default function OrderEditModal({ order, onClose, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draftNote, setDraftNote] = useState(order.note || '')
  const [draftAttachments, setDraftAttachments] = useState(order.attachments || [])
  const fileInputRef = useRef(null)

  const startEdit = () => {
    setDraftNote(order.note || '')
    setDraftAttachments(order.attachments || [])
    setEditing(true)
  }
  const cancelEdit = () => setEditing(false)
  const handleSaveEdit = () => {
    onSave?.({ note: draftNote, attachments: draftAttachments })
    setEditing(false)
  }

  const handlePickFiles = () => fileInputRef.current?.click()
  const handleFilesChange = async (e) => {
    const list = Array.from(e.target.files || [])
    if (!list.length) return
    const items = await Promise.all(list.map(async (f) => ({
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      type: f.type,
      size: f.size,
      isImage: f.type.startsWith('image/'),
      url: f.type.startsWith('image/') ? await readFileAsDataURL(f) : null,
    })))
    setDraftAttachments((prev) => [...prev, ...items])
    e.target.value = ''
  }
  const handleRemove = (id) =>
    setDraftAttachments((prev) => prev.filter((a) => a.id !== id))

  const currentIdx = STATUS_FLOW.indexOf(order.status)
  const attachments = editing ? draftAttachments : (order.attachments || [])

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-card large oem-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <div className="modal-title">
              <Package size={15} strokeWidth={1.6}/>
              订单详情 · {order.no}
            </div>
            <div className="modal-sub">{order.designName} · {order.total} 双 · {order.status}</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.6}/></button>
        </header>

        <div className="oem-body">
          <StatusSteps currentIdx={currentIdx} />

          <div className="oem-grid">
            <DesignSection order={order} />
            <SizeDistSection order={order} />
          </div>

          <PaymentSection order={order} />

          <NoteAttachSection
            order={order}
            editing={editing}
            draftNote={draftNote}
            onDraftNoteChange={setDraftNote}
            attachments={attachments}
            onPickFiles={handlePickFiles}
            onRemove={handleRemove}
            onStartEdit={startEdit}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            onChange={handleFilesChange}
            hidden
          />
        </div>

        <footer className="modal-foot">
          {!editing ? (
            <>
              <button className="modal-btn ghost">
                <Headphones size={13} strokeWidth={1.6}/> 联系客服
              </button>
              <span style={{ flex: 1 }} />
              <button className="modal-btn ghost" onClick={onClose}>关闭</button>
              <button className="modal-btn primary" onClick={startEdit}>
                <Pencil size={13} strokeWidth={1.6}/> 编辑备注 / 附件
              </button>
            </>
          ) : (
            <>
              <span style={{ flex: 1 }} />
              <button className="modal-btn ghost" onClick={cancelEdit}>取消</button>
              <button className="modal-btn primary" onClick={handleSaveEdit}>
                <Save size={13} strokeWidth={1.6}/> 保存修改
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}

/* ───────── 子区块 ───────── */

function StatusSteps({ currentIdx }) {
  return (
    <div className="oem-steps">
      {STATUS_FLOW.map((label, i) => {
        const Icon = STATUS_ICONS[label]
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div
            key={label}
            className={`oem-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}
          >
            <div className="oem-step-dot"><Icon size={14} /></div>
            <span>{label}</span>
            {i < STATUS_FLOW.length - 1 && <div className="oem-step-line" />}
          </div>
        )
      })}
    </div>
  )
}

function DesignSection({ order }) {
  return (
    <section className="oem-section">
      <div className="oem-section-title">设计稿</div>
      <div className="oem-design-card">
        <div className="oem-design-img-wrap">
          {order.coverImage
            ? <img src={order.coverImage} alt={order.designName} />
            : <div className="oem-design-empty">无预览图</div>}
        </div>
        <div className="oem-design-meta">
          <Row label="设计名称" value={order.designName} />
          <Row label="材质" value={order.material} />
          {order.craft && <Row label="工艺" value={order.craft} />}
        </div>
      </div>
    </section>
  )
}

function SizeDistSection({ order }) {
  const entries = Object.entries(order.sizes || {})
  return (
    <section className="oem-section">
      <div className="oem-section-title">尺码分布 · 共 {order.total} 双</div>
      <div className="oem-size-dist">
        {entries.map(([s, qty]) => {
          const percent = order.total ? Math.round((qty / order.total) * 100) : 0
          return (
            <div key={s} className="oem-dist-row">
              <span className="oem-dist-size">{s}</span>
              <div className="oem-dist-bar">
                <div className="oem-dist-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="oem-dist-qty">{qty} 双 · {percent}%</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PaymentSection({ order }) {
  return (
    <section className="oem-section">
      <div className="oem-section-title">支付 / 物流</div>
      <div className="oem-rows">
        <Row
          label="订单号"
          value={
            <span className="oem-mono">
              {order.no} <Copy size={11} className="oem-icon" />
            </span>
          }
        />
        <Row label="下单时间" value={order.createdAt} />
        {order.payment?.method && <Row label="支付方式" value={order.payment.method} />}
        {order.payment?.paidAt && <Row label="支付时间" value={order.payment.paidAt} />}
        {order.contact && <Row label="收件人" value={`${order.contact} ${order.phone || ''}`} />}
        {order.address && <Row label="收货地址" value={order.address} />}
        {order.payment?.amount != null && (
          <Row
            label="订单金额"
            value={<b className="oem-amount">¥ {Number(order.payment.amount).toFixed(2)}</b>}
            highlight
          />
        )}
      </div>
    </section>
  )
}

function NoteAttachSection({
  order, editing, draftNote, onDraftNoteChange,
  attachments, onPickFiles, onRemove, onStartEdit,
}) {
  return (
    <section className="oem-section">
      <div className="oem-section-title">
        <Paperclip size={13} strokeWidth={1.6} /> 备注与附件
        {!editing && (
          <button className="oem-section-action" onClick={onStartEdit}>
            <Pencil size={11} /> 编辑
          </button>
        )}
      </div>

      {editing ? (
        <div className="oem-edit-area">
          <textarea
            className="field-input textarea"
            value={draftNote}
            onChange={(e) => onDraftNoteChange(e.target.value)}
            placeholder="包装要求、加急说明、修改建议等"
            rows={3}
          />
          <button type="button" className="order-attach-btn" onClick={onPickFiles}>
            <Upload size={12} strokeWidth={1.6} />
            添加附件
          </button>
          {attachments.length > 0 && (
            <AttachList items={attachments} onRemove={onRemove} editable />
          )}
        </div>
      ) : (
        <div className="oem-view-area">
          <Row
            label="备注"
            value={order.note ? order.note : <span className="oem-muted">暂无</span>}
          />
          {attachments.length > 0 ? (
            <AttachList items={attachments} />
          ) : (
            <Row label="附件" value={<span className="oem-muted">暂无</span>} />
          )}
        </div>
      )}
    </section>
  )
}

function AttachList({ items, onRemove, editable = false }) {
  return (
    <div className="order-attach-list">
      {items.map((a) => (
        <div key={a.id} className="order-attach-item">
          {a.isImage && a.url ? (
            <img src={a.url} alt={a.name} className="order-attach-thumb" />
          ) : (
            <span className="order-attach-icon">
              <FileText size={14} strokeWidth={1.6} />
            </span>
          )}
          <span className="order-attach-name" title={a.name}>{a.name}</span>
          {a.size != null && (
            <span className="order-attach-size">{(a.size / 1024).toFixed(1)} KB</span>
          )}
          {editable && (
            <button
              type="button"
              className="order-attach-remove"
              onClick={() => onRemove?.(a.id)}
              aria-label="移除"
            >
              <Trash2 size={11} strokeWidth={1.6} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className={`oem-row ${highlight ? 'highlight' : ''}`}>
      <span className="oem-row-label">{label}</span>
      <span className="oem-row-value">{value}</span>
    </div>
  )
}
