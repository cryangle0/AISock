<template>
  <BottomSheet
    title="订单支付"
    :subtitle="subtitle"
    size="tall"
    :closable="phase !== 'paying'"
    @close="$emit('cancel')"
  >
    <!-- 选择支付方式 -->
    <template v-if="phase === 'select'">
      <view class="amount">
        <view class="amt-row"><text>{{ order.material }} 单价</text><text>¥ {{ unit.toFixed(2) }} / 双</text></view>
        <view v-if="fee > 0" class="amt-row"><text>{{ order.craft }} 加价</text><text>¥ {{ fee.toFixed(2) }} / 双</text></view>
        <view class="amt-row"><text>数量</text><text>{{ order.total }} 双</text></view>
        <view class="amt-row highlight"><text>合计</text><text>¥ {{ total.toFixed(2) }}</text></view>
      </view>
      <view class="methods">
        <view
          v-for="m in payMethods"
          :key="m.value"
          :class="['method', { active: method === m.value }]"
          @tap="method = m.value"
        >
          <view class="method-dot" :style="{ background: m.accent }" />
          <view class="method-info">
            <text class="method-name">{{ m.label }}</text>
            <text class="method-tip">{{ m.tip }}</text>
          </view>
          <view class="method-radio" :class="{ on: method === m.value }" />
        </view>
      </view>
    </template>

    <!-- 支付中 -->
    <view v-else-if="phase === 'paying'" class="paying">
      <text class="paying-name">正在创建订单并发起支付…</text>
      <view class="loader" />
      <text class="paying-amt">¥ {{ total.toFixed(2) }}</text>
      <text class="paying-tip">请在微信支付界面完成付款</text>
    </view>

    <!-- 支付成功 -->
    <view v-else class="paid">
      <view class="paid-icon">✓</view>
      <text class="paid-title">支付成功</text>
      <text class="paid-amt">¥ {{ total.toFixed(2) }}</text>
      <text class="paid-tip">订单 {{ orderNo }} 已提交工厂排产</text>
    </view>

    <template v-if="phase === 'select'" #footer>
      <view class="footer-row">
        <button class="cta secondary" @tap="$emit('cancel')">取消</button>
        <button v-if="quoteFailed" class="cta primary" @tap="refreshQuote">价格获取失败，点击重试</button>
        <button v-else class="cta primary" :disabled="total <= 0" @tap="startPay">立即支付 ¥ {{ total.toFixed(2) }}</button>
      </view>
    </template>
  </BottomSheet>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'
import { PAY_METHODS } from '@aisock/common'
import { orderApi } from '@aisock/service'
import { createOrderAndPay } from '@/composables/usePayment'

interface OrderForm {
  designName: string
  total: number
  sizes: Record<string, number>
  material: string
  materialValue: string
  craft: string
  craftValue: string
  address: string
  note: string
  designId?: number
}

const props = defineProps<{ order: OrderForm }>()
const emit = defineEmits<{
  cancel: []
  paid: [result: { orderId: number; orderNo: string; amount: number; real: boolean }]
}>()

const payMethods = PAY_METHODS
const method = ref('wechat')
const phase = ref<'select' | 'paying' | 'paid'>('select')
const orderNo = ref('')

// 价格由服务端权威试算（与下单落库一致），前端不再本地计算金额
const unit = ref(0)
const fee = ref(0)
const total = ref(0)
const quoteFailed = ref(false)

async function refreshQuote() {
  try {
    const res = await orderApi.quotePrice({
      material: props.order.materialValue,
      craft: props.order.craftValue,
      quantity: props.order.total,
    })
    unit.value = res.data.basePrice
    fee.value = res.data.craftFee
    total.value = res.data.total
    quoteFailed.value = false
  } catch {
    // 试算失败：禁用支付按钮并提供重试，避免「合计 ¥0 仍可支付」误导用户
    quoteFailed.value = true
  }
}

watchEffect(() => {
  void refreshQuote()
})

const subtitle = computed(
  () => `${props.order.designName} · ${props.order.total} 双 · ${props.order.material}${props.order.craft ? ' · ' + props.order.craft : ''}`,
)

async function startPay() {
  phase.value = 'paying'
  try {
    const result = await createOrderAndPay({
      designId: props.order.designId,
      designName: props.order.designName,
      sizes: props.order.sizes,
      quantity: props.order.total,
      material: props.order.materialValue,
      craft: props.order.craftValue,
      address: props.order.address,
      remark: props.order.note,
    })
    if (!result.paid) {
      // 用户取消或支付失败：退回选择态
      phase.value = 'select'
      uni.showToast({ title: '支付未完成', icon: 'none' })
      return
    }
    orderNo.value = result.orderNo
    phase.value = 'paid'
    setTimeout(() => {
      emit('paid', { orderId: result.orderId, orderNo: result.orderNo, amount: total.value, real: result.real })
    }, 900)
  } catch (e: any) {
    phase.value = 'select'
    uni.showToast({ title: e?.message || '下单失败，请重试', icon: 'none' })
  }
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.amount {
  background: $mp-bg;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
}
.amt-row {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: $mp-text-secondary;
  padding: 6rpx 0;
}
.amt-row.highlight {
  border-top: 1rpx solid $mp-divider;
  margin-top: 8rpx;
  padding-top: 14rpx;
  font-weight: 700;
  color: $mp-text-primary;
}
.amt-row.highlight text:last-child {
  color: $mp-pink;
  font-size: 32rpx;
}
.methods {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}
.method {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  border: 1rpx solid $mp-border;
  border-radius: 16rpx;
}
.method.active {
  border-color: $mp-primary;
  box-shadow: 0 0 0 2rpx $mp-primary-soft;
}
.method-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 6rpx;
}
.method-info {
  flex: 1;
}
.method-name {
  font-size: 26rpx;
  font-weight: 600;
  color: $mp-text-primary;
}
.method-tip {
  display: block;
  font-size: 20rpx;
  color: $mp-text-muted;
}
.method-radio {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid $mp-border;
}
.method-radio.on {
  border-color: $mp-primary;
  background: radial-gradient(circle, $mp-primary 40%, transparent 45%);
}
.paying {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 50rpx 0;
}
.paying-name {
  font-size: 28rpx;
  font-weight: 600;
}
.loader {
  width: 72rpx;
  height: 72rpx;
  border: 8rpx solid $mp-bg;
  border-top-color: $mp-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.paying-amt {
  font-size: 40rpx;
  font-weight: 800;
  color: $mp-primary;
}
.paying-tip {
  font-size: 22rpx;
  color: $mp-text-muted;
}
.paid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 60rpx 0;
}
.paid-icon {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  background: $mp-mint;
  color: #fff;
  font-size: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.paid-title {
  font-size: 32rpx;
  font-weight: 700;
}
.paid-amt {
  font-size: 40rpx;
  font-weight: 800;
  color: $mp-primary;
}
.paid-tip {
  font-size: 22rpx;
  color: $mp-text-muted;
}
.footer-row {
  display: flex;
  gap: 16rpx;
}
.cta {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  padding: 0;
}
.cta.secondary {
  background: $mp-bg;
  color: $mp-text-secondary;
}
.cta.primary {
  background: $mp-primary;
  color: #fff;
}
</style>
