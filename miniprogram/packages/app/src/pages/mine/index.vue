<template>
  <view class="mine">
    <view class="user-card">
      <view class="avatar">{{ avatarText }}</view>
      <view class="user-info">
        <text class="user-name">{{ userStore.userInfo?.nickname || '未登录' }}</text>
        <text class="user-phone">{{ phoneText }}</text>
      </view>
      <button v-if="userStore.isLogin" class="logout" @tap="onLogout">退出</button>
      <button v-else class="logout login" @tap="goLogin">登录</button>
    </view>

    <view class="stats">
      <view class="stat" @tap="goDesigns">
        <text class="stat-num">{{ overview.designs }}</text>
        <text class="stat-label">我的设计</text>
      </view>
      <view class="stat-sep" />
      <view class="stat" @tap="goOrders">
        <text class="stat-num">{{ orderTotal }}</text>
        <text class="stat-label">我的订单</text>
      </view>
    </view>

    <view class="list">
      <view class="list-item" @tap="goDesigns">
        <text class="list-icon">📁</text><text class="list-label">我的设计</text><text class="arrow">›</text>
      </view>
      <view class="list-item" @tap="goOrders">
        <text class="list-icon">📦</text><text class="list-label">订单管理</text><text class="arrow">›</text>
      </view>
      <view class="list-item" @tap="goAssets">
        <text class="list-icon">🎨</text><text class="list-label">素材库</text><text class="arrow">›</text>
      </view>
      <view class="list-item disabled">
        <text class="list-icon">⚙️</text><text class="list-label">设置</text><text class="arrow">›</text>
      </view>
    </view>

    <text class="footer">爱花型袜业 · 2026</text>
    <custom-tab-bar current="mine" />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@aisock/composition'
import { userApi } from '@aisock/service'
import { maskPhone, navigateTo, reLaunch } from '@aisock/common/utils'
import CustomTabBar from '@/components/CustomTabBar.vue'

const userStore = useUserStore()
const overview = reactive<{ designs: number; orders: Record<string, number> }>({ designs: 0, orders: {} })

const avatarText = computed(() => (userStore.userInfo?.nickname || '客').charAt(0))
const phoneText = computed(() => maskPhone(userStore.userInfo?.phone))
const orderTotal = computed(() => overview.orders.total ?? 0)

onShow(async () => {
  if (!userStore.isLogin) return
  try {
    const res = await userApi.getOverview()
    overview.designs = res.data.designs
    overview.orders = res.data.orders
  } catch {
    /* 忽略 */
  }
})

function requireLogin(cb: () => void) {
  if (!userStore.isLogin) {
    goLogin()
    return
  }
  cb()
}

const goLogin = () => reLaunch('/pages/login/index')
const goDesigns = () => requireLogin(() => navigateTo('/pages/designs/index'))
const goOrders = () => requireLogin(() => navigateTo('/pages/orders/index'))
const goAssets = () => navigateTo('/pages/assets/index')

async function onLogout() {
  await userStore.logout()
  uni.showToast({ title: '已退出', icon: 'none' })
  overview.designs = 0
  overview.orders = {}
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.mine {
  min-height: 100vh;
  padding: 32rpx 32rpx 140rpx;
}
.user-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 24rpx;
  padding: 28rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #a06d36, #8c5a3c);
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-info {
  flex: 1;
}
.user-name {
  font-size: 30rpx;
  font-weight: 700;
  color: $mp-text-primary;
}
.user-phone {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $mp-text-muted;
}
.logout {
  font-size: 22rpx;
  color: $mp-text-secondary;
  background: transparent;
  border: 1rpx solid $mp-border;
  border-radius: 999rpx;
  padding: 0 24rpx;
  line-height: 56rpx;
  height: 56rpx;
}
.logout.login {
  color: #fff;
  background: $mp-primary;
  border-color: $mp-primary;
}
.stats {
  display: flex;
  align-items: center;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-top: 24rpx;
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.stat-num {
  font-size: 40rpx;
  font-weight: 800;
  color: $mp-primary;
}
.stat-label {
  font-size: 22rpx;
  color: $mp-text-muted;
}
.stat-sep {
  width: 1rpx;
  height: 48rpx;
  background: $mp-border;
}
.list {
  margin-top: 24rpx;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 20rpx;
  overflow: hidden;
}
.list-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx;
  border-bottom: 1rpx solid $mp-border;
}
.list-item:last-child {
  border-bottom: none;
}
.list-item.disabled {
  opacity: 0.5;
}
.list-icon {
  font-size: 32rpx;
}
.list-label {
  flex: 1;
  font-size: 28rpx;
  color: $mp-text-primary;
}
.arrow {
  color: $mp-text-muted;
}
.footer {
  display: block;
  text-align: center;
  margin-top: 40rpx;
  font-size: 20rpx;
  color: $mp-text-muted;
}
</style>
