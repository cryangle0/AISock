import { useEffect, useState } from 'react'
import { X, Wallet, CheckCircle2, Loader } from 'lucide-react'
import '../Modal.css'
import './PaymentModal.css'

const PAY_METHODS = [
  { value: 'wechat',  label: '微信支付', tip: '推荐 · 免手续费',   accent: '#1aad19' },
  { value: 'alipay',  label: '支付宝',   tip: '快捷支付',           accent: '#1677ff' },
  { value: 'bank',    label: '银行卡',   tip: '储蓄卡 / 信用卡',    accent: '#7e6cf2' },
]

const UNIT_PRICE_MAP = {
  cotton: 28,
  nylon: 32,
}

const CRAFT_FEE = {
  uv: 0,
  '3d': 6,
  jacquard: 12,
}

const calcAmount = (order) => {
  const unit = UNIT_PRICE_MAP[order?.materialValue || 'cotton'] || 28
  const fee = CRAFT_FEE[order?.craftValue || 'uv'] || 0
  const total = (order?.total || 0) * (unit + fee)
  return { unit, fee, total }
}

/**
 * 支付弹窗 — 模拟微信/支付宝/银行卡支付，含倒计时假二维码 + 支付成功动效。
 *
 * @param {Object} order 待支付订单（含 total, materialValue, craftValue 等）
 * @param {()=>void} onCancel
 * @param {(payment:{method:string,paidAt:string,amount:number})=>void} onPaid
 */
export default function PaymentModal({ order, onCancel, onPaid }) {
  const [method, setMethod] = useState('wechat')
  const [phase, setPhase] = useState('select')
  const { unit, fee, total } = calcAmount(order)

  useEffect(() => {
    if (phase !== 'paying') return
    const timer = setTimeout(() => setPhase('paid'), 1600)
    return () => clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'paid') return
    const t = setTimeout(() => {
      onPaid?.({
        method: PAY_METHODS.find((m) => m.value === method)?.label,
        paidAt: new Date().toLocaleString('zh-CN'),
        amount: total,
      })
    }, 900)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const startPay = () => setPhase('paying')
  const activeMethod = PAY_METHODS.find((m) => m.value === method)

  return (
    <div className="modal-mask" onClick={phase === 'paying' ? undefined : onCancel}>
      <div className="modal-card payment-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <div className="modal-title">
              <Wallet size={15} strokeWidth={1.6}/>
              订单支付
            </div>
            <div className="modal-sub">
              订单 {order?.designName} · {order?.total} 双 · {order?.material}
              {order?.craft && ` · ${order.craft}`}
            </div>
          </div>
          {phase !== 'paying' && (
            <button className="modal-close" onClick={onCancel}><X size={16} strokeWidth={1.6}/></button>
          )}
        </header>

        <div className="payment-body">
          {phase === 'select' && (
            <>
              <div className="pay-amount">
                <div className="pay-amount-row">
                  <span>{order?.material} 单价</span>
                  <span>¥ {unit.toFixed(2)} / 双</span>
                </div>
                {fee > 0 && (
                  <div className="pay-amount-row">
                    <span>{order?.craft || '工艺'} 加价</span>
                    <span>¥ {fee.toFixed(2)} / 双</span>
                  </div>
                )}
                <div className="pay-amount-row">
                  <span>数量</span>
                  <span>{order?.total} 双</span>
                </div>
                <div className="pay-amount-total">
                  <span>合计</span>
                  <b>¥ {total.toFixed(2)}</b>
                </div>
              </div>

              <div className="pay-methods">
                {PAY_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`pay-method ${method === m.value ? 'active' : ''}`}
                    onClick={() => setMethod(m.value)}
                    style={{ '--pay-accent': m.accent }}
                  >
                    <span className="pay-method-dot"/>
                    <div className="pay-method-info">
                      <div className="pay-method-name">{m.label}</div>
                      <div className="pay-method-tip">{m.tip}</div>
                    </div>
                    <span className="pay-method-radio">
                      {method === m.value && <span className="pay-method-radio-inner"/>}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {phase === 'paying' && (
            <div className="pay-qr-stage" style={{ '--pay-accent': activeMethod?.accent }}>
              <div className="pay-qr-card">
                <div className="pay-qr-header">{activeMethod?.label} 扫码支付</div>
                <FakeQrCode color={activeMethod?.accent || '#000'}/>
                <div className="pay-qr-amount">¥ {total.toFixed(2)}</div>
                <div className="pay-qr-tip">
                  <Loader size={12} strokeWidth={1.8} className="rotating"/>
                  正在等待支付确认（演示模式 · 自动完成）
                </div>
              </div>
            </div>
          )}

          {phase === 'paid' && (
            <div className="pay-paid-stage">
              <div className="pay-paid-icon">
                <CheckCircle2 size={48} strokeWidth={1.6}/>
              </div>
              <div className="pay-paid-title">支付成功</div>
              <div className="pay-paid-amount">¥ {total.toFixed(2)}</div>
              <div className="pay-paid-tip">订单已提交工厂排产，约 5 分钟交付</div>
            </div>
          )}
        </div>

        {phase === 'select' && (
          <footer className="modal-foot">
            <button className="modal-btn ghost" onClick={onCancel}>取消</button>
            <button className="modal-btn primary" onClick={startPay}>
              立即支付 ¥ {total.toFixed(2)}
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}

// 二维码定位锚（独立组件，避免 react-hooks/static-components 警告）
function QrAnchor({ ox, oy, cellSize, color }) {
  return (
    <g transform={`translate(${ox * cellSize} ${oy * cellSize})`}>
      <rect width={cellSize * 7} height={cellSize * 7} rx={2} fill={color}/>
      <rect x={cellSize} y={cellSize} width={cellSize * 5} height={cellSize * 5} rx={1} fill="#fff"/>
      <rect x={cellSize * 2} y={cellSize * 2} width={cellSize * 3} height={cellSize * 3} fill={color}/>
    </g>
  )
}

// 用 SVG 拼一个像样的"伪二维码" — 3 角定位锚 + 确定式伪随机点阵
function FakeQrCode({ color = '#000' }) {
  const cells = []
  const cellSize = 8
  const grid = 24
  const seed = (x, y) => ((x * 73) ^ (y * 41) ^ 137) & 1
  for (let y = 0; y < grid; y += 1) {
    for (let x = 0; x < grid; x += 1) {
      const inAnchor = (
        (x < 7 && y < 7)
        || (x >= grid - 7 && y < 7)
        || (x < 7 && y >= grid - 7)
      )
      if (inAnchor) continue
      if (seed(x, y) === 1) {
        cells.push(<rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize} height={cellSize}/>)
      }
    }
  }
  const total = grid * cellSize
  return (
    <svg className="pay-qr-svg" width="180" height="180" viewBox={`0 0 ${total} ${total}`}>
      <rect width={total} height={total} fill="#fff"/>
      <g fill={color}>{cells}</g>
      <QrAnchor ox={0} oy={0} cellSize={cellSize} color={color}/>
      <QrAnchor ox={grid - 7} oy={0} cellSize={cellSize} color={color}/>
      <QrAnchor ox={0} oy={grid - 7} cellSize={cellSize} color={color}/>
    </svg>
  )
}
