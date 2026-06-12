<template>
  <view class="cart">
    <scroll-view class="cart-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
      <view v-if="!userStore.isLogin" class="empty">
        <text class="empty-icon">🛒</text>
        <text class="empty-text">登录后查看购物车与订单</text>
        <button class="empty-btn" @tap="goLogin">去登录</button>
      </view>
      <template v-else>
        <view v-if="orders.length === 0" class="empty">
          <text class="empty-icon">🛒</text>
          <text class="empty-text">还没有订单，去设计一双吧</text>
          <button class="empty-btn" @tap="goEditor">开始设计</button>
        </view>
        <view v-else class="list">
          <view v-for="o in orders" :key="o.id" class="order-card" @tap="goOrders">
            <view class="order-top">
              <text class="order-no">{{ o.order_no }}</text>
              <text class="order-status">{{ statusText(o.status) }}</text>
            </view>
            <view class="order-mid">
              <text class="order-name">{{ o.design_name || '袜款设计' }}</text>
              <text class="order-amount">¥{{ o.total_amount }}</text>
            </view>
            <text class="order-qty">数量 {{ o.quantity }} · {{ o.created_at }}</text>
          </view>
        </view>
      </template>
    </scroll-view>
    <custom-tab-bar current="cart" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@aisock/composition'
import { orderApi } from '@aisock/service'
import { ORDER_STATUS_TEXT } from '@aisock/common/constants'
import { switchTab, navigateTo, reLaunch } from '@aisock/common/utils'
import type { Order } from '@aisock/common/types'
import CustomTabBar from '@/components/CustomTabBar.vue'
const userStore = useUserStore()
const orders = ref<Order[]>([])

onShow(async () => {
  if (!userStore.isLogin) return
  try {
    const res = await orderApi.listOrders()
    orders.value = res.data
  } catch {
    /* 忽略 */
  }
})

const statusText = (s: string) => ORDER_STATUS_TEXT[s] || s
const goLogin = () => reLaunch('/pages/login/index')
const goEditor = () => switchTab('/pages/ai/index')
const goOrders = () => navigateTo('/pages/orders/index')
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.cart {
  height: 100vh;
}
.cart-scroll {
  height: 100vh;
  box-sizing: border-box;
  padding: 32rpx 32rpx 140rpx;
}
.empty {
  margin-top: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}
.empty-icon {
  font-size: 80rpx;
}
.empty-text {
  font-size: 26rpx;
  color: $mp-text-secondary;
}
.empty-btn {
  margin-top: 12rpx;
  background: $mp-primary;
  color: #fff;
  border-radius: 999rpx;
  font-size: 26rpx;
  padding: 0 48rpx;
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
.order-qty {
  font-size: 22rpx;
  color: $mp-text-muted;
}
</style>
