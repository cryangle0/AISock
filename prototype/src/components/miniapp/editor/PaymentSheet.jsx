/**
 * PaymentSheet — 移动端支付（复刻 web PaymentModal 的 phase 流转）
 */
import { useEffect, useState } from 'react'
import { Wallet, CheckCircle2, Loader } from 'lucide-react'
import BottomSheet from './BottomSheet'
import FakeQrCode from './FakeQrCode'

const PAY_METHODS = [
  { value: 'wechat', label: '微信支付', tip: '推荐 · 免手续费', accent: '#1aad19' },
  { value: 'alipay', label: '支付宝',   tip: '快捷支付',         accent: '#1677ff' },
  { value: 'bank',   label: '银行卡',   tip: '储蓄卡 / 信用卡',  accent: '#7e6cf2' },
]

const UNIT_PRICE = { cotton: 28, nylon: 32 }
const CRAFT_FEE  = { uv: 0, '3d': 6, jacquard: 12 }

const calcAmount = (order) => {
  const unit  = UNIT_PRICE[order?.materialValue || 'cotton'] || 28
  const fee   = CRAFT_FEE[order?.craftValue || 'uv'] || 0
  const total = (order?.total || 0) * (unit + fee)
  return { unit, fee, total }
}

export default function PaymentSheet({ order, onCancel, onPaid }) {
  const [method, setMethod] = useState('wechat')
  const [phase, setPhase] = useState('select')  // select | paying | paid
  const { unit, fee, total } = calcAmount(order)

  useEffect(() => {
    if (phase !== 'paying') return
    const t = setTimeout(() => setPhase('paid'), 1600)
    return () => clearTimeout(t)
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

  const footer = phase === 'select' ? (
    <div className="mp-sheet-footer-row">
      <button className="mp-cta-secondary" onClick={onCancel}>取消</button>
      <button className="mp-cta-primary" onClick={startPay}>
        立即支付 ¥ {total.toFixed(2)}
      </button>
    </div>
  ) : null

  return (
    <BottomSheet
      title={
        <span className="mp-pay-title-row">
          <Wallet size={13} /> 订单支付
        </span>
      }
      subtitle={`${order?.designName} · ${order?.total} 双 · ${order?.material}${order?.craft ? ' · ' + order.craft : ''}`}
      onClose={phase === 'paying' ? undefined : onCancel}
      closable={phase !== 'paying'}
      size="tall"
      footer={footer}
    >
      {phase === 'select' && (
        <SelectStage
          method={method}
          onMethodChange={setMethod}
          unit={unit}
          fee={fee}
          total={total}
          order={order}
        />
      )}
      {phase === 'paying' && <PayingStage total={total} method={method} />}
      {phase === 'paid' && <PaidStage total={total} />}
    </BottomSheet>
  )
}

function SelectStage({ method, onMethodChange, unit, fee, total, order }) {
  return (
    <>
      <div className="mp-pay-amount">
        <Row label={`${order?.material} 单价`} value={`¥ ${unit.toFixed(2)} / 双`} />
        {fee > 0 && <Row label={`${order?.craft} 加价`} value={`¥ ${fee.toFixed(2)} / 双`} />}
        <Row label="数量" value={`${order?.total} 双`} />
        <Row label="合计" value={`¥ ${total.toFixed(2)}`} highlight />
      </div>

      <div className="mp-pay-methods">
        {PAY_METHODS.map((m) => (
          <button
            key={m.value}
            className={`mp-pay-method ${method === m.value ? 'active' : ''}`}
            onClick={() => onMethodChange(m.value)}
            style={{ '--pay-accent': m.accent }}
          >
            <span className="mp-pay-method-dot" />
            <div className="mp-pay-method-info">
              <div className="mp-pay-method-name">{m.label}</div>
              <div className="mp-pay-method-tip">{m.tip}</div>
            </div>
            <span className="mp-pay-method-radio">
              {method === m.value && <span />}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function PayingStage({ total, method }) {
  const m = PAY_METHODS.find((x) => x.value === method)
  return (
    <div className="mp-pay-stage" style={{ '--pay-accent': m?.accent }}>
      <div className="mp-pay-method-name-big">{m?.label} 扫码支付</div>
      <FakeQrCode color={m?.accent || '#000'} size={140} />
      <div className="mp-pay-amount-big">¥ {total.toFixed(2)}</div>
      <div className="mp-pay-tip">
        <Loader size={12} className="mp-spin" />
        正在等待支付确认（演示模式 · 自动完成）
      </div>
    </div>
  )
}

function PaidStage({ total }) {
  return (
    <div className="mp-pay-paid">
      <div className="mp-pay-paid-icon">
        <CheckCircle2 size={48} strokeWidth={1.6} />
      </div>
      <div className="mp-pay-paid-title">支付成功</div>
      <div className="mp-pay-paid-amount">¥ {total.toFixed(2)}</div>
      <div className="mp-pay-paid-tip">订单已提交工厂排产</div>
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className={`mp-pay-amount-row ${highlight ? 'highlight' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
