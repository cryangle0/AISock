<template>
  <view class="orders">
    <view class="tabs">
      <text
        v-for="t in statusTabs"
        :key="t.key"
        :class="['tab', { active: activeStatus === t.key }]"
        @tap="onSwitch(t.key)"
      >
        {{ t.label }}
      </text>
    </view>

    <view v-if="list.length === 0" class="empty">
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无订单</text>
    </view>
    <view v-else class="list">
      <view v-for="o in list" :key="o.id" class="order-card">
        <view class="order-top">
          <text class="order-no">{{ o.order_no }}</text>
          <text class="order-status">{{ statusText(o.status) }}</text>
        </view>
        <view class="order-mid">
          <text class="order-name">{{ o.design_name || '袜款设计' }}</text>
          <text class="order-amount">¥{{ o.total_amount }}</text>
        </view>
        <view class="order-foot">
          <text class="order-qty">数量 {{ o.quantity }}</text>
          <button v-if="o.status === 'pending'" class="pay-btn" @tap="onPay(o)">去支付</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { orderApi } from '@aisock/service'
import { ORDER_STATUS_TEXT } from '@aisock/common/constants'
import type { Order } from '@aisock/common/types'

const statusTabs = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'producing', label: '生产中' },
  { key: 'done', label: '已完成' },
]

const activeStatus = ref('')
const list = ref<Order[]>([])

async function fetchList() {
  try {
    const res = await orderApi.listOrders(activeStatus.value || undefined)
    list.value = res.data
  } catch {
    /* 忽略 */
  }
}

onShow(fetchList)

function onSwitch(key: string) {
  activeStatus.value = key
  fetchList()
}

async function onPay(o: Order) {
  await orderApi.payOrder(o.id)
  uni.showToast({ title: '支付成功', icon: 'success' })
  fetchList()
}

const statusText = (s: string) => ORDER_STATUS_TEXT[s] || s
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.orders {
  min-height: 100vh;
  padding: 24rpx 32rpx;
}
.tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.tab {
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: $mp-text-secondary;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
}
.tab.active {
  background: $mp-primary;
  color: #fff;
  border-color: $mp-primary;
}
.empty {
  margin-top: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.empty-icon {
  font-size: 80rpx;
}
.empty-text {
  font-size: 26rpx;
  color: $mp-text-muted;
}
.order-card {
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.order-top {
  display: flex;
  justify-content: space-between;
}
.order-no {
  font-size: 22rpx;
  color: $mp-text-muted;
}
.order-status {
  font-size: 22rpx;
  color: $mp-primary;
}
.order-mid {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 12rpx 0;
}
.order-name {
  font-size: 28rpx;
  font-weight: 700;
  color: $mp-text-primary;
}
.order-amount {
  font-size: 30rpx;
  font-weight: 800;
  color: $mp-pink;
}
.order-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-qty {
  font-size: 22rpx;
  color: $mp-text-muted;
}
.pay-btn {
  background: $mp-primary;
  color: #fff;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 56rpx;
  height: 56rpx;
  padding: 0 32rpx;
}
</style>
