import { useState } from 'react'
import { MapPin } from 'lucide-react'

const SIZES = ['S', 'M', 'L', 'XL']
const MATERIALS = ['棉', '尼龙', '羊毛', '混纺']
const CRAFTS = ['针织提花', 'UV 印花', '3D 印花']

export default function BSubmit({ onNavigate }) {
  const [sizeCounts, setSizeCounts] = useState({ S: 20, M: 50, L: 30, XL: 0 })
  const [material, setMaterial] = useState('棉')
  const [craft, setCraft] = useState('UV 印花')
  const [note, setNote] = useState('')

  const total = Object.values(sizeCounts).reduce((a, b) => a + b, 0)
  const amount = total * 28

  const updateCount = (size, delta) => {
    setSizeCounts(prev => ({
      ...prev,
      [size]: Math.max(0, prev[size] + delta),
    }))
  }

  return (
    <div className="mp-page mp-page-submit">
      {/* 设计稿预览 */}
      <div className="mp-submit-preview">
        <div className="mp-submit-thumb" />
        <div className="mp-submit-name">
          <div className="mp-submit-title">春日碎花款</div>
          <div className="mp-submit-sub">4 区设计 · 已完成</div>
        </div>
      </div>

      {/* 尺码组合 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">尺码组合</div>
        <div className="mp-size-table">
          {SIZES.map(s => (
            <div key={s} className="mp-size-row">
              <span className="mp-size-label">{s}</span>
              <div className="mp-size-qty">
                <button onClick={() => updateCount(s, -10)} disabled={sizeCounts[s] === 0}>−</button>
                <span>{sizeCounts[s]}</span>
                <button onClick={() => updateCount(s, 10)}>+</button>
              </div>
            </div>
          ))}
          <div className="mp-size-total">
            共 <strong>{total}</strong> 双 · 最低起订 50 双
          </div>
        </div>
      </div>

      {/* 材质 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">材质</div>
        <div className="mp-chip-group">
          {MATERIALS.map(m => (
            <button
              key={m}
              className={`mp-chip ${material === m ? 'active' : ''}`}
              onClick={() => setMaterial(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 工艺 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">工艺</div>
        <div className="mp-chip-group">
          {CRAFTS.map(c => (
            <button
              key={c}
              className={`mp-chip ${craft === c ? 'active' : ''}`}
              onClick={() => setCraft(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 收货地址 */}
      <div className="mp-od-section">
        <div className="mp-order-address">
          <MapPin size={14} className="mp-order-icon" />
          <div className="mp-address-info">
            <div className="mp-address-name">王工厂 · 139****9999</div>
            <div className="mp-address-detail">浙江省义乌市稠州北路 88 号</div>
          </div>
          <span className="mp-address-arrow">›</span>
        </div>
      </div>

      {/* 备注 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">备注</div>
        <textarea
          className="mp-textarea"
          placeholder="可填写特殊工艺要求或联系方式"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      {/* 底部 */}
      <div className="mp-order-footer">
        <div className="mp-order-total">
          <span>总价</span>
          <span className="mp-order-total-price">¥{amount}</span>
        </div>
        <button
          className="mp-footer-btn primary"
          disabled={total < 50}
          onClick={() => onNavigate('b-orders')}
        >
          {total < 50 ? `还差 ${50 - total} 双` : '提交订单'}
        </button>
      </div>
    </div>
  )
}
