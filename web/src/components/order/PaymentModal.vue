<template>
  <BaseModal :title="modalTitle" :subtitle="subtitle" size="sm" :closable="!busy" @close="onClose">
    <!-- 选择支付方式 -->
    <template v-if="phase === 'select'">
      <div class="amount">
        <template v-if="props.order">
          <div class="amt-row"><span>{{ props.order.material }} 单价</span><span>¥ {{ unit.toFixed(2) }} / 双</span></div>
          <div v-if="fee > 0" class="amt-row"><span>{{ props.order.craft }} 加价</span><span>¥ {{ fee.toFixed(2) }} / 双</span></div>
          <div class="amt-row"><span>数量</span><span>{{ props.order.total }} 双</span></div>
        </template>
        <div class="amt-row highlight"><span>合计</span><span>¥ {{ totalAmount.toFixed(2) }}</span></div>
      </div>
      <div class="methods">
        <button
          v-for="m in payMethods"
          :key="m.value"
          type="button"
          :class="['method', { active: method === m.value }]"
          @click="method = m.value"
        >
          <span class="method-icon"><img :src="m.icon" :alt="m.label" /></span>
          <span class="method-info">
            <span class="method-name">{{ m.label }}</span>
            <span class="method-tip">{{ m.tip }}</span>
          </span>
          <span class="method-radio" :class="{ on: method === m.value }" />
        </button>
      </div>
    </template>

    <!-- 创建订单 / 下单中 -->
    <div v-else-if="phase === 'creating'" class="paying">
      <span class="paying-name">正在创建订单…</span>
      <div class="spinner" />
      <span class="paying-amt">¥ {{ totalAmount.toFixed(2) }}</span>
    </div>

    <!-- 微信扫码支付 -->
    <div v-else-if="phase === 'wxqr'" class="qr-pay">
      <span class="qr-title">微信扫码支付</span>
      <div class="qr-box">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="微信支付二维码" class="qr-img" />
        <div v-else class="spinner" />
      </div>
      <span class="qr-amt">¥ {{ totalAmount.toFixed(2) }}</span>
      <span class="qr-tip">请使用微信扫描二维码完成支付，支付后将自动跳转</span>
      <div class="poll-hint"><div class="dot-pulse" />等待支付结果…</div>
    </div>

    <!-- 支付宝跳转支付 -->
    <div v-else-if="phase === 'alipay'" class="qr-pay">
      <span class="qr-title">支付宝支付</span>
      <span class="qr-amt">¥ {{ totalAmount.toFixed(2) }}</span>
      <span class="qr-tip">已在新窗口打开支付宝收银台，请在新页面完成支付</span>
      <a v-if="alipayUrl" :href="alipayUrl" target="_blank" rel="noopener" class="cta primary alipay-link">未跳转？点此打开支付宝</a>
      <div class="poll-hint"><div class="dot-pulse" />等待支付结果…</div>
    </div>

    <!-- 对公转账（线下） -->
    <div v-else-if="phase === 'corporate'" class="corporate">
      <div class="corp-icon">¥</div>
      <span class="corp-title">订单已创建</span>
      <span class="corp-no">订单号 {{ orderNo }} · 金额 ¥{{ totalAmount.toFixed(2) }}</span>
      <p class="corp-tip">对公转账为大额订单线下结算方式，请联系客服获取对公账户信息并备注订单号，确认到账后即进入排产。</p>
    </div>

    <!-- 成功 -->
    <div v-else class="paid">
      <div class="paid-icon">✓</div>
      <span class="paid-title">支付成功</span>
      <span class="paid-amt">¥ {{ totalAmount.toFixed(2) }}</span>
      <span class="paid-tip">订单 {{ orderNo }} 已提交工厂排产</span>
    </div>

    <template v-if="phase === 'select'" #footer>
      <button class="cta secondary" @click="onClose">取消</button>
      <button class="cta primary" :disabled="totalAmount <= 0" @click="startPay">立即支付 ¥ {{ totalAmount.toFixed(2) }}</button>
    </template>
    <template v-else-if="phase === 'wxqr' || phase === 'alipay'" #footer>
      <button class="cta secondary" @click="onClose">取消支付</button>
      <button class="cta primary" @click="confirmPaidManually">我已完成支付</button>
    </template>
    <template v-else-if="phase === 'corporate'" #footer>
      <button class="cta secondary" @click="contactService">联系客服</button>
      <button class="cta primary" @click="finishCorporate">我已知晓</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue'
import QRCode from 'qrcode'
import BaseModal from '@/components/ui/BaseModal.vue'
import { PAY_METHODS } from '@/data/order'
import { orderApi } from '@/api'
import { pollPaymentStatus, type PollSignal } from '@/composables/useOrderPay'
import { useServiceQr } from '@/composables/useServiceQr'
import type { OrderFormData } from './OrderModal.vue'

/** 已存在订单补付场景的入参 */
export interface ExistingOrderPay {
  id: number
  orderNo: string
  amount: number
  designName?: string
}

const props = defineProps<{
  /** 编辑器下单：根据表单创建订单后支付 */
  order?: OrderFormData
  /** 订单详情补付：对已存在订单发起支付 */
  existingOrder?: ExistingOrderPay
}>()
const emit = defineEmits<{
  cancel: []
  paid: [payment: { method: string; orderId: number; orderNo: string; amount: number; pending?: boolean }]
}>()

const { openServiceQr } = useServiceQr()

const payMethods = PAY_METHODS
const method = ref('wechat')
type Phase = 'select' | 'creating' | 'wxqr' | 'alipay' | 'corporate' | 'paid'
const phase = ref<Phase>('select')
const orderNo = ref(props.existingOrder?.orderNo || '')
const createdOrderId = ref<number | null>(props.existingOrder?.id ?? null)
const qrDataUrl = ref('')
const alipayUrl = ref('')
const currentOutTradeNo = ref('')
const pollSignal: PollSignal = { cancelled: false }

const busy = computed(() => phase.value === 'creating')
const modalTitle = computed(() => (props.existingOrder ? '继续支付' : '订单支付'))

// 价格：编辑器下单由服务端权威试算；补付直接用订单金额
const unit = ref(0)
const fee = ref(0)
const totalAmount = ref(props.existingOrder?.amount ?? 0)

watchEffect(async () => {
  if (!props.order) return
  try {
    const res = await orderApi.quote({
      material: props.order.materialValue,
      craft: props.order.craftValue,
      quantity: props.order.total,
    })
    unit.value = res.data.basePrice
    fee.value = res.data.craftFee
    totalAmount.value = res.data.total
  } catch {
    /* 试算失败留 0，下单时仍以服务端为准 */
  }
})

const methodLabel = computed(() => payMethods.find((m) => m.value === method.value)?.label || '')
const subtitle = computed(() => {
  if (props.order) return `${props.order.designName} · ${props.order.total} 双 · ${props.order.material} · ${props.order.craft}`
  return `${props.existingOrder?.designName || '袜款定制'} · 订单 ${orderNo.value}`
})

/** 确保订单存在：补付直接返回既有订单，否则按表单创建 */
async function ensureOrder(): Promise<{ id: number; orderNo: string }> {
  if (props.existingOrder) return { id: props.existingOrder.id, orderNo: props.existingOrder.orderNo }
  const o = props.order!
  const created = await orderApi.create({
    designId: o.designId,
    designName: o.designName,
    sizes: o.sizes,
    quantity: o.total,
    material: o.materialValue,
    craft: o.craftValue,
    address: `${o.contact} ${o.phone} ${o.address}`,
    remark: o.note,
  })
  return { id: created.data.id, orderNo: created.data.orderNo }
}

function emitPaid(pending = false) {
  emit('paid', {
    method: methodLabel.value,
    orderId: createdOrderId.value as number,
    orderNo: orderNo.value,
    amount: totalAmount.value,
    pending,
  })
}

async function startPay() {
  phase.value = 'creating'
  try {
    const ord = await ensureOrder()
    createdOrderId.value = ord.id
    orderNo.value = ord.orderNo

    if (method.value === 'wechat') {
      await payWechat(ord.id)
    } else if (method.value === 'alipay') {
      await payAlipay(ord.id)
    } else {
      // 对公转账：订单已创建，转线下结算
      phase.value = 'corporate'
    }
  } catch (e) {
    phase.value = 'select'
    alert((e as Error).message || '支付发起失败，请重试')
  }
}

async function payWechat(orderId: number) {
  const res = await orderApi.payNative(orderId)
  currentOutTradeNo.value = res.data.outTradeNo
  if (res.data.real && res.data.codeUrl) {
    qrDataUrl.value = await QRCode.toDataURL(res.data.codeUrl, { width: 220, margin: 1 })
    phase.value = 'wxqr'
    waitForPaid()
  } else {
    // 演示模式：mock 落库
    await orderApi.mockPaid(res.data.outTradeNo)
    phase.value = 'paid'
    finishPaid()
  }
}

async function payAlipay(orderId: number) {
  const res = await orderApi.payAlipay(orderId)
  currentOutTradeNo.value = res.data.outTradeNo
  if (res.data.real && res.data.payUrl) {
    alipayUrl.value = res.data.payUrl
    window.open(res.data.payUrl, '_blank', 'noopener')
    phase.value = 'alipay'
    waitForPaid()
  } else {
    await orderApi.mockPaid(res.data.outTradeNo)
    phase.value = 'paid'
    finishPaid()
  }
}

/** 后台轮询支付结果（扫码/跳转支付的异步回调落库后确认） */
async function waitForPaid() {
  const ok = await pollPaymentStatus(currentOutTradeNo.value, { signal: pollSignal })
  if (ok && phase.value !== 'paid') {
    phase.value = 'paid'
    finishPaid()
  }
}

/** 用户点「我已完成支付」：主动查一次，确认则成功，否则提示稍候 */
async function confirmPaidManually() {
  try {
    const res = await orderApi.payStatus(currentOutTradeNo.value)
    if (res.data.status === 'success') {
      phase.value = 'paid'
      finishPaid()
      return
    }
  } catch {
    /* 忽略 */
  }
  alert('尚未收到支付结果，如已付款请稍候片刻自动确认')
}

function finishPaid() {
  pollSignal.cancelled = true
  setTimeout(() => emitPaid(false), 1000)
}

function finishCorporate() {
  emitPaid(true)
}

function contactService() {
  openServiceQr()
}

function onClose() {
  pollSignal.cancelled = true
  emit('cancel')
}

onBeforeUnmount(() => {
  pollSignal.cancelled = true
})
</script>

<style scoped>
.amount {
  background: var(--bg);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}
.amt-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-2);
  padding: 4px 0;
}
.amt-row.highlight {
  border-top: 1px solid var(--border);
  margin-top: 6px;
  padding-top: 10px;
  font-weight: 700;
  color: var(--text);
}
.amt-row.highlight span:last-child {
  color: var(--pink, #d4376b);
  font-size: 18px;
}
.methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.method {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-card);
  cursor: pointer;
  text-align: left;
}
.method.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-soft);
}
.method-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.method-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.method-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.method-name {
  font-size: 14px;
  font-weight: 600;
}
.method-tip {
  font-size: 11px;
  color: var(--text-3);
}
.method-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--border);
  flex-shrink: 0;
}
.method-radio.on {
  border-color: var(--primary);
  background: radial-gradient(circle, var(--primary) 40%, transparent 45%);
}
.paying,
.paid,
.qr-pay,
.corporate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 24px 0;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.paying-name {
  font-size: 14px;
  font-weight: 600;
}
.paying-amt {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
}
/* 扫码 / 跳转支付 */
.qr-title {
  font-size: 15px;
  font-weight: 700;
}
.qr-box {
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
}
.qr-img {
  width: 200px;
  height: 200px;
}
.qr-amt {
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
}
.qr-tip {
  font-size: 12px;
  color: var(--text-3);
  text-align: center;
  max-width: 280px;
}
.alipay-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 20px;
  text-decoration: none;
  border-radius: 999px;
}
.poll-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-2);
}
.dot-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
/* 对公转账 */
.corp-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-soft, #f3e8ec);
  color: var(--primary);
  font-size: 28px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.corp-title {
  font-size: 17px;
  font-weight: 700;
}
.corp-no {
  font-size: 12px;
  color: var(--text-3);
}
.corp-tip {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  text-align: center;
  max-width: 300px;
  margin: 0;
}
.paid-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--mint, #5fb18a);
  color: #fff;
  font-size: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.paid-title {
  font-size: 18px;
  font-weight: 700;
}
.paid-amt {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
}
.paid-tip {
  font-size: 12px;
  color: var(--text-3);
}
.cta {
  flex: 1;
  height: 44px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.cta.secondary {
  background: var(--bg-hover);
  color: var(--text-2);
}
.cta.primary {
  background: var(--primary);
  color: #fff;
}
</style>
