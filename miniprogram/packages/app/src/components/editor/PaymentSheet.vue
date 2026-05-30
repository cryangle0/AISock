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
      <view class="spinner" />
      <text class="paying-amt">¥ {{ total.toFixed(2) }}</text>
      <text class="paying-tip">{{ payingTip }}</text>
    </view>

    <!-- 支付成功 -->
    <view v-else class="paid">
      <view class="paid-icon">✓</view>
      <text class="paid-title">支付成功</text>
      <text class="paid-amt">¥ {{ total.toFixed(2) }}</text>
      <text class="paid-tip">订单已提交工厂排产</text>
    </view>

    <template v-if="phase === 'select'" #footer>
      <view class="footer-row">
        <button class="cta secondary" @tap="$emit('cancel')">取消</button>
        <button class="cta primary" @tap="startPay">立即支付 ¥ {{ total.toFixed(2) }}</button>
      </view>
    </template>
  </BottomSheet>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'
import { PAY_METHODS, UNIT_PRICE, CRAFT_FEE } from '@aisock/common'
import { payOrder, type PayOrderInput } from './usePayment'

interface OrderProp {
  designName: string
  total: number
  material: string
  craft?: string
  materialValue: string
  craftValue: string
  sizes?: Record<string, number>
  address?: string
  note?: string
  designId?: number
  coverUrl?: string
}

const props = defineProps<{ order: OrderProp }>()
const emit = defineEmits<{
  cancel: []
  paid: [payment: { method: string; orderId: number; orderNo: string; amount: number; real: boolean }]
}>()

const payMethods = PAY_METHODS
const method = ref('wechat')
const phase = ref<'select' | 'paying' | 'paid'>('select')
const payingTip = ref('正在创建订单…')

const unit = computed(() => UNIT_PRICE[props.order.materialValue] || 28)
const fee = computed(() => CRAFT_FEE[props.order.craftValue] || 0)
const unitPrice = computed(() => +(unit.value + fee.value).toFixed(2))
const total = computed(() => props.order.total * unitPrice.value)
const subtitle = computed(
  () => `${props.order.designName} · ${props.order.total} 双 · ${props.order.material}${props.order.craft ? ' · ' + props.order.craft : ''}`,
)

async function startPay() {
  phase.value = 'paying'
  payingTip.value = '正在创建订单…'
  const input: PayOrderInput = {
    designId: props.order.designId,
    designName: props.order.designName,
    sizes: props.order.sizes,
    quantity: props.order.total,
    unitPrice: unitPrice.value,
    material: props.order.material,
    craft: props.order.craft,
    address: props.order.address,
    remark: props.order.note,
    coverUrl: props.order.coverUrl,
  }
  try {
    payingTip.value = '正在拉起微信支付…'
    const outcome = await payOrder(input, unitPrice.value)
    if (outcome.cancelled) {
      // 用户取消支付：订单已创建为待支付，回到选择态
      phase.value = 'select'
      uni.showToast({ title: '已取消支付，订单保留在待支付', icon: 'none' })
      emit('cancel')
      return
    }
    phase.value = 'paid'
    setTimeout(() => {
      emit('paid', {
        method: payMethods.find((m) => m.value === method.value)?.label || '微信支付',
        orderId: outcome.orderId,
        orderNo: outcome.orderNo,
        amount: outcome.amount,
        real: outcome.real,
      })
    }, 900)
  } catch (e: any) {
    phase.value = 'select'
    uni.showToast({ title: e?.message || '支付失败，请重试', icon: 'none' })
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
  padding: 60rpx 0;
}
.spinner {
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
