import { useState } from 'react'
import { X, ShoppingBag } from 'lucide-react'
import './Modal.css'

const SIZE_LIST = ['S', 'M', 'L', 'XL']
const MATERIALS = [
  { value: 'cotton',   label: '棉混纺' },
  { value: 'antibac',  label: '抗菌纤维' },
  { value: 'wool',     label: '羊毛' },
  { value: 'bamboo',   label: '竹纤维' },
]

export default function OrderModal({ onClose, onSubmit }) {
  const [designName, setDesignName] = useState('未命名袜版')
  const [sizes, setSizes] = useState({ S: 0, M: 50, L: 30, XL: 0 })
  const [material, setMaterial] = useState('cotton')
  const [address, setAddress] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')

  const total = Object.values(sizes).reduce((a, b) => a + b, 0)
  const canSubmit = total > 0 && address.trim() && contact.trim() && phone.trim()

  const setSize = (s, v) => setSizes(prev => ({ ...prev, [s]: Math.max(0, Number(v) || 0) }))

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-card medium" onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <div className="modal-title">
              <ShoppingBag size={15} strokeWidth={1.6}/>
              提交订单
            </div>
            <div className="modal-sub">订单将提交到爱花型工厂，约 7-10 天交付</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.6}/></button>
        </header>

        <div className="order-form">
          <Field label="设计名称">
            <input
              className="field-input"
              value={designName}
              onChange={e => setDesignName(e.target.value)}
              placeholder="给这个袜版取个名字"
            />
          </Field>

          <Field label="尺码与数量">
            <div className="size-grid">
              {SIZE_LIST.map(s => (
                <div key={s} className="size-row">
                  <span className="size-label">{s}</span>
                  <input
                    type="number"
                    min="0"
                    value={sizes[s]}
                    onChange={e => setSize(s, e.target.value)}
                    className="field-input small"
                  />
                  <span className="size-unit">双</span>
                </div>
              ))}
            </div>
            <div className="size-total">合计：<b>{total}</b> 双</div>
          </Field>

          <Field label="材质">
            <div className="material-grid">
              {MATERIALS.map(m => (
                <button
                  key={m.value}
                  className={`material-chip ${material === m.value ? 'active' : ''}`}
                  onClick={() => setMaterial(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="收货信息">
            <div className="contact-grid">
              <input className="field-input" value={contact} onChange={e => setContact(e.target.value)} placeholder="联系人姓名"/>
              <input className="field-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="手机号"/>
            </div>
            <input
              className="field-input"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="详细地址（省/市/区/街道）"
              style={{ marginTop: 8 }}
            />
          </Field>

          <Field label="备注（选填）">
            <textarea
              className="field-input textarea"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="包装要求、加急说明等"
              rows={2}
            />
          </Field>
        </div>

        <footer className="modal-foot">
          <button className="modal-btn ghost" onClick={onClose}>取消</button>
          <button
            className="modal-btn primary"
            disabled={!canSubmit}
            onClick={() => onSubmit({
              designName,
              sizes: Object.fromEntries(Object.entries(sizes).filter(([, v]) => v > 0)),
              total,
              material: MATERIALS.find(m => m.value === material).label,
              address,
              contact,
              phone,
              note,
            })}
          >
            提交订单（{total} 双）
          </button>
        </footer>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}
