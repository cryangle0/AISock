/**
 * BOrderDetail — 订单详情（基于真实订单数据）
 * 状态进度条 + 设计稿大图 + 尺码分布 + 支付/物流
 */
import { useMemo, useState } from 'react'
import {
  Copy, Headphones, CheckCircle, Clock, Truck, Package,
  Paperclip, Pencil, Save, FileText, Trash2,
} from 'lucide-react'
import ImageUploadButton from '../../editor/ImageUploadButton'

const STATUS_FLOW = ['待生产', '生产中', '已发货', '已完成']

const STATUS_ICONS = {
  '待生产': Clock,
  '生产中': Package,
  '已发货': Truck,
  '已完成': CheckCircle,
}

export default function BOrderDetail({ orders = [], params = {}, onNavigate, onUpdateOrder }) {
  const order = useMemo(
    () => orders.find((o) => o.id === params.orderId) || orders[0],
    [orders, params.orderId],
  )

  const [editing, setEditing] = useState(false)
  const [draftNote, setDraftNote] = useState('')
  const [draftAttachments, setDraftAttachments] = useState([])

  // 进入编辑态时初始化草稿
  const startEdit = () => {
    setDraftNote(order?.note || '')
    setDraftAttachments(order?.attachments || [])
    setEditing(true)
  }

  const handleAddAttachment = async (file) => {
    if (!file) return
    const fileToDataURL = (f) => new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = (e) => resolve(e.target.result)
      r.onerror = reject
      r.readAsDataURL(f)
    })
    const item = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name || '附件',
      type: file.type,
      size: file.size,
      isImage: file.type?.startsWith('image/'),
      url: file.type?.startsWith('image/') ? await fileToDataURL(file) : null,
    }
    setDraftAttachments((prev) => [...prev, item])
  }
  const handleRemoveDraftAttachment = (id) =>
    setDraftAttachments((prev) => prev.filter((a) => a.id !== id))

  const handleSaveEdit = () => {
    onUpdateOrder?.(order.id, { note: draftNote, attachments: draftAttachments })
    setEditing(false)
  }

  if (!order) {
    return (
      <div className="mp-page mp-page-order-detail">
        <div className="mp-empty-state">
          <p>订单不存在</p>
          <button className="mp-cta-primary" onClick={() => onNavigate?.('b-orders')}>
            返回列表
          </button>
        </div>
      </div>
    )
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status)

  return (
    <div className="mp-page mp-page-order-detail">
      {/* 状态进度 */}
      <div className="mp-od-section">
        <div className="mp-steps-v2">
          {STATUS_FLOW.map((label, i) => {
            const Icon = STATUS_ICONS[label]
            const done = i < currentIdx
            const active = i === currentIdx
            return (
              <div
                key={label}
                className={`mp-step-v2 ${done ? 'done' : ''} ${active ? 'active' : ''}`}
              >
                <div className="mp-step-dot-v2"><Icon size={12} /></div>
                <span>{label}</span>
                {i < STATUS_FLOW.length - 1 && <div className="mp-step-line-v2" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* 设计稿 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">设计稿</div>
        <div className="mp-od-design">
          {order.coverImage
            ? <img src={order.coverImage} alt={order.designName} />
            : <div className="mp-od-design-empty">无预览图</div>}
        </div>
        <div className="mp-od-row">
          <span>设计名称</span><span>{order.designName}</span>
        </div>
        <div className="mp-od-row">
          <span>材质</span><span>{order.material}</span>
        </div>
        {order.craft && (
          <div className="mp-od-row">
            <span>工艺</span><span>{order.craft}</span>
          </div>
        )}
      </div>

      {/* 尺码分布 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">尺码分布 · 共 {order.total} 双</div>
        <div className="mp-size-dist">
          {Object.entries(order.sizes || {}).map(([s, qty]) => {
            const percent = order.total ? Math.round((qty / order.total) * 100) : 0
            return (
              <div key={s} className="mp-dist-row">
                <span className="mp-dist-size">{s}</span>
                <div className="mp-dist-bar">
                  <div className="mp-dist-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="mp-dist-qty">{qty} 双 · {percent}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 支付/物流 */}
      <div className="mp-od-section">
        <div className="mp-od-row">
          <span>订单号</span>
          <span className="mp-od-copy">{order.no} <Copy size={10} /></span>
        </div>
        <div className="mp-od-row">
          <span>下单时间</span><span>{order.createdAt}</span>
        </div>
        {order.payment?.method && (
          <div className="mp-od-row">
            <span>支付方式</span><span>{order.payment.method}</span>
          </div>
        )}
        {order.payment?.paidAt && (
          <div className="mp-od-row">
            <span>支付时间</span><span>{order.payment.paidAt}</span>
          </div>
        )}
        {order.contact && (
          <div className="mp-od-row">
            <span>收件人</span><span>{order.contact} {order.phone}</span>
          </div>
        )}
        {order.address && (
          <div className="mp-od-row">
            <span>收货地址</span><span style={{ textAlign: 'right', maxWidth: '60%' }}>{order.address}</span>
          </div>
        )}
        {order.payment?.amount != null && (
          <div className="mp-od-row total">
            <span>订单金额</span>
            <span>¥{Number(order.payment.amount).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* 备注 / 附件（可编辑） */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">
          <Paperclip size={12} /> 备注与附件
          {!editing ? (
            <button
              className="mp-mini-btn"
              style={{ marginLeft: 'auto' }}
              onClick={startEdit}
            >
              <Pencil size={10} /> 编辑
            </button>
          ) : (
            <button
              className="mp-mini-btn primary"
              style={{ marginLeft: 'auto' }}
              onClick={handleSaveEdit}
            >
              <Save size={10} /> 保存
            </button>
          )}
        </div>

        {editing ? (
          <>
            <div className="mp-od-note-edit">
              <textarea
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="包装要求、加急说明、修改建议等"
                rows={3}
              />
            </div>
            <ImageUploadButton
              onPick={handleAddAttachment}
              label="添加附件（拍照 / 相册 / 文件）"
              variant="block"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            />
            {draftAttachments.length > 0 && (
              <div className="mp-attach-list">
                {draftAttachments.map((a) => (
                  <div key={a.id} className="mp-attach-item">
                    {a.isImage && a.url ? (
                      <img src={a.url} alt={a.name} className="mp-attach-thumb" />
                    ) : (
                      <span className="mp-attach-icon">
                        <FileText size={12} strokeWidth={1.6} />
                      </span>
                    )}
                    <span className="mp-attach-name" title={a.name}>{a.name}</span>
                    <button
                      type="button"
                      className="mp-attach-remove"
                      onClick={() => handleRemoveDraftAttachment(a.id)}
                      aria-label="移除"
                    >
                      <Trash2 size={10} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {order.note ? (
              <div className="mp-od-row" style={{ alignItems: 'flex-start' }}>
                <span>备注</span>
                <span style={{ textAlign: 'right', maxWidth: '70%' }}>{order.note}</span>
              </div>
            ) : (
              <div className="mp-od-row">
                <span>备注</span><span style={{ color: '#b0b0b0' }}>暂无</span>
              </div>
            )}
            {(order.attachments?.length || 0) > 0 ? (
              <div className="mp-od-attach-grid">
                {order.attachments.map((a) => (
                  a.isImage && a.url ? (
                    <img key={a.id} src={a.url} alt={a.name} className="mp-od-attach-img" />
                  ) : (
                    <div key={a.id} className="mp-attach-item">
                      <span className="mp-attach-icon">
                        <FileText size={12} strokeWidth={1.6} />
                      </span>
                      <span className="mp-attach-name">{a.name}</span>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="mp-od-row">
                <span>附件</span><span style={{ color: '#b0b0b0' }}>暂无</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* 操作 */}
      <div className="mp-od-footer">
        <button className="mp-cta-secondary">
          <Headphones size={12} /> 联系客服
        </button>
        <button
          className="mp-cta-primary"
          onClick={() => onNavigate?.('b-orders')}
        >
          返回列表
        </button>
      </div>
    </div>
  )
}
