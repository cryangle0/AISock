<template>
  <BaseModal title="订单支付" :subtitle="subtitle" size="sm" :closable="phase !== 'paying'" @close="$emit('cancel')">
    <!-- 选择支付方式 -->
    <template v-if="phase === 'select'">
      <div class="amount">
        <div class="amt-row"><span>{{ order.material }} 单价</span><span>¥ {{ unit.toFixed(2) }} / 双</span></div>
        <div v-if="fee > 0" class="amt-row"><span>{{ order.craft }} 加价</span><span>¥ {{ fee.toFixed(2) }} / 双</span></div>
        <div class="amt-row"><span>数量</span><span>{{ order.total }} 双</span></div>
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
          <span class="method-dot" :style="{ background: m.accent }" />
          <span class="method-info">
            <span class="method-name">{{ m.label }}</span>
            <span class="method-tip">{{ m.tip }}</span>
          </span>
          <span class="method-radio" :class="{ on: method === m.value }" />
        </button>
      </div>
    </template>

    <!-- 支付中 -->
    <div v-else-if="phase === 'paying'" class="paying">
      <span class="paying-name">{{ methodLabel }} · 处理中</span>
      <div class="spinner" />
      <span class="paying-amt">¥ {{ totalAmount.toFixed(2) }}</span>
      <span class="paying-tip">正在创建订单并等待支付确认…</span>
    </div>

    <!-- 成功 -->
    <div v-else class="paid">
      <div class="paid-icon">✓</div>
      <span class="paid-title">支付成功</span>
      <span class="paid-amt">¥ {{ totalAmount.toFixed(2) }}</span>
      <span class="paid-tip">订单 {{ orderNo }} 已提交工厂排产</span>
    </div>

    <template v-if="phase === 'select'" #footer>
      <button class="cta secondary" @click="$emit('cancel')">取消</button>
      <button class="cta primary" @click="startPay">立即支付 ¥ {{ totalAmount.toFixed(2) }}</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { PAY_METHODS } from '@/data/order'
import { orderApi } from '@/api'
import type { OrderFormData } from './OrderModal.vue'

const props = defineProps<{ order: OrderFormData }>()
const emit = defineEmits<{
  cancel: []
  paid: [payment: { method: string; orderId: number; orderNo: string; amount: number }]
}>()

const payMethods = PAY_METHODS
const method = ref('wechat')
const phase = ref<'select' | 'paying' | 'paid'>('select')
const orderNo = ref('')

// 价格由服务端权威试算（与下单落库一致），前端不再本地计算金额
const unit = ref(0)
const fee = ref(0)
const totalAmount = ref(0)

watchEffect(async () => {
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
const subtitle = computed(
  () => `${props.order.designName} · ${props.order.total} 双 · ${props.order.material} · ${props.order.craft}`,
)

async function startPay() {
  phase.value = 'paying'
  try {
    // 1) 创建订单（材质/工艺传 key，金额由服务端按价目表权威计算）
    const created = await orderApi.create({
      designId: props.order.designId,
      designName: props.order.designName,
      sizes: props.order.sizes,
      quantity: props.order.total,
      material: props.order.materialValue,
      craft: props.order.craftValue,
      address: `${props.order.contact} ${props.order.phone} ${props.order.address}`,
      remark: props.order.note,
    })
    orderNo.value = created.data.orderNo
    // 2) 预下单
    const pre = await orderApi.prepay(created.data.id)
    // 3) 演示环境用 mock-paid 落库支付成功（生产走微信 JSAPI 回调）
    await orderApi.mockPaid(pre.data.outTradeNo)
    phase.value = 'paid'
    setTimeout(() => {
      emit('paid', {
        method: methodLabel.value,
        orderId: created.data.id,
        orderNo: created.data.orderNo,
        amount: totalAmount.value,
      })
    }, 1000)
  } catch (e) {
    phase.value = 'select'
    alert((e as Error).message || '支付失败，请重试')
  }
}
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
.method-dot {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  flex-shrink: 0;
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
.paid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 30px 0;
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
.paying-tip {
  font-size: 12px;
  color: var(--text-3);
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
