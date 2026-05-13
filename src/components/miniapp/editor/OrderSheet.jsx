/**
 * OrderSheet — 下单填表（移动版 OrderModal）
 * 复用 web 端 MATERIALS / CRAFTS 常量，确保业务参数一致
 */
import { useMemo, useState } from 'react'
import BottomSheet from './BottomSheet'
import { MATERIALS, CRAFTS } from '../../print/printConstants'

const SIZE_LIST = ['S', 'M', 'L', 'XL']

export default function OrderSheet({ defaultDesignName, onClose, onSubmit }) {
  const [designName, setDesignName] = useState(defaultDesignName || '未命名袜版')
  const [sizes, setSizes] = useState({ S: 0, M: 50, L: 30, XL: 0 })
  const [material, setMaterial] = useState('cotton')
  const [craft, setCraft] = useState('uv')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')

  const total = useMemo(
    () => Object.values(sizes).reduce((a, b) => a + b, 0),
    [sizes],
  )
  const canSubmit = total > 0 && contact.trim() && phone.trim() && address.trim()

  const setSize = (s, v) => setSizes((p) => ({ ...p, [s]: Math.max(0, Number(v) || 0) }))
  const stepSize = (s, delta) => setSizes((p) => ({ ...p, [s]: Math.max(0, p[s] + delta) }))

  const handleSubmit = () => {
    if (!canSubmit) return
    const m = MATERIALS.find((x) => x.value === material)
    const c = CRAFTS.find((x) => x.value === craft)
    onSubmit?.({
      designName,
      sizes: Object.fromEntries(Object.entries(sizes).filter(([, v]) => v > 0)),
      total,
      material: m?.label || '棉',
      materialValue: material,
      craft: c?.label || 'UV 印花',
      craftValue: craft,
      contact, phone, address, note,
    })
  }

  return (
    <BottomSheet
      title="提交订单"
      subtitle={`${total} 双 · 5 分钟交付`}
      onClose={onClose}
      size="tall"
      footer={
        <div className="mp-sheet-footer-row">
          <button className="mp-cta-secondary" onClick={onClose}>取消</button>
          <button
            className="mp-cta-primary"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            下一步：去支付
          </button>
        </div>
      }
    >
      <div className="mp-form">
        <Field label="设计名称">
          <input
            className="mp-input"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            placeholder="给这个袜版取个名字"
          />
        </Field>

        <Field label="尺码与数量">
          {SIZE_LIST.map((s) => (
            <div key={s} className="mp-size-line">
              <span className="mp-size-tag">{s}</span>
              <button className="mp-step-btn" onClick={() => stepSize(s, -10)} disabled={sizes[s] === 0}>−</button>
              <input
                type="number"
                min="0"
                value={sizes[s]}
                onChange={(e) => setSize(s, e.target.value)}
                className="mp-size-input"
              />
              <button className="mp-step-btn" onClick={() => stepSize(s, +10)}>+</button>
              <span className="mp-size-unit">双</span>
            </div>
          ))}
          <div className="mp-size-total">
            合计 <b>{total}</b> 双
          </div>
        </Field>

        <Field label="面料材质">
          <div className="mp-chip-row">
            {MATERIALS.map((m) => (
              <button
                key={m.value}
                className={`mp-chip-card ${material === m.value ? 'active' : ''}`}
                onClick={() => setMaterial(m.value)}
              >
                <span className="mp-chip-card-name">{m.label}</span>
                <span className="mp-chip-card-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="工艺选型">
          <div className="mp-chip-row">
            {CRAFTS.map((c) => (
              <button
                key={c.value}
                className={`mp-chip-card ${craft === c.value ? 'active' : ''}`}
                onClick={() => setCraft(c.value)}
              >
                <span className="mp-chip-card-name">{c.label}</span>
                <span className="mp-chip-card-desc">{c.desc}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="收货信息">
          <div className="mp-input-row">
            <input
              className="mp-input"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="联系人"
            />
            <input
              className="mp-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="手机号"
            />
          </div>
          <input
            className="mp-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="详细地址（省/市/区/街道）"
          />
        </Field>

        <Field label="备注（选填）">
          <textarea
            className="mp-input mp-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="包装要求、加急说明等"
            rows={2}
          />
        </Field>
      </div>
    </BottomSheet>
  )
}

function Field({ label, children }) {
  return (
    <div className="mp-form-field">
      <label className="mp-form-label">{label}</label>
      <div className="mp-form-content">{children}</div>
    </div>
  )
}
