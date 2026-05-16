/**
 * OrderEditModal — 编辑订单的备注 + 附件
 *
 * 一期只允许编辑非锁定字段（备注 / 附件），不动金额、状态、收货等
 * 已生产 / 已发货 / 已完成 状态下也可编辑备注和附件，方便补传修改稿
 */
import { useRef, useState } from 'react'
import { X, Save, Paperclip, Upload, Trash2, FileText } from 'lucide-react'
import '../Modal.css'

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = (e) => resolve(e.target.result)
  r.onerror = reject
  r.readAsDataURL(file)
})

export default function OrderEditModal({ order, onClose, onSave }) {
  const [note, setNote] = useState(order.note || '')
  const [attachments, setAttachments] = useState(order.attachments || [])
  const fileInputRef = useRef(null)

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
    setAttachments((prev) => [...prev, ...items])
    e.target.value = ''
  }
  const handleRemove = (id) => setAttachments((prev) => prev.filter((a) => a.id !== id))

  const handleSave = () => onSave?.({ note, attachments })

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-card medium" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <div className="modal-title">
              <Save size={15} strokeWidth={1.6}/>
              编辑订单 · {order.no}
            </div>
            <div className="modal-sub">{order.designName} · {order.total} 双 · {order.status}</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.6}/></button>
        </header>

        <div className="order-form">
          <div className="form-field">
            <label className="form-label">备注</label>
            <textarea
              className="field-input textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="包装要求、加急说明、修改建议等"
              rows={3}
            />
          </div>

          <div className="form-field">
            <label className="form-label form-label-with-icon">
              <Paperclip size={12} strokeWidth={1.6} /> 附件（文件 / 图片）
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
              onChange={handleFilesChange}
              hidden
            />
            <button
              type="button"
              className="order-attach-btn"
              onClick={handlePickFiles}
            >
              <Upload size={12} strokeWidth={1.6} />
              添加附件
            </button>
            {attachments.length > 0 && (
              <div className="order-attach-list">
                {attachments.map((a) => (
                  <div key={a.id} className="order-attach-item">
                    {a.isImage && a.url ? (
                      <img src={a.url} alt={a.name} className="order-attach-thumb" />
                    ) : (
                      <span className="order-attach-icon">
                        <FileText size={14} strokeWidth={1.6} />
                      </span>
                    )}
                    <span className="order-attach-name" title={a.name}>{a.name}</span>
                    <span className="order-attach-size">{(a.size / 1024).toFixed(1)} KB</span>
                    <button
                      type="button"
                      className="order-attach-remove"
                      onClick={() => handleRemove(a.id)}
                      aria-label="移除"
                    >
                      <Trash2 size={11} strokeWidth={1.6} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="modal-foot">
          <button className="modal-btn ghost" onClick={onClose}>取消</button>
          <button className="modal-btn primary" onClick={handleSave}>
            <Save size={13} strokeWidth={1.6}/>
            保存修改
          </button>
        </footer>
      </div>
    </div>
  )
}
