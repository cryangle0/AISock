<template>
  <view class="mine">
    <scroll-view class="mine-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
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
          <view class="list-icon"><AppIcon name="folder" :size="36" /></view><text class="list-label">我的设计</text><text class="list-extra">{{ overview.designs }} 个袜版</text>
          <AppIcon name="chevron-right" :size="22" color="#b8a892" />
        </view>
        <view class="list-item" @tap="goOrders">
          <view class="list-icon"><AppIcon name="bag" :size="36" /></view><text class="list-label">订单管理</text><text class="list-extra">{{ orderTotal }} 个订单</text>
          <AppIcon name="chevron-right" :size="22" color="#b8a892" />
        </view>
        <view class="list-item" @tap="goAssets">
          <view class="list-icon"><AppIcon name="palette" :size="36" /></view><text class="list-label">素材库</text><text class="list-extra">公共 + 个人</text>
          <AppIcon name="chevron-right" :size="22" color="#b8a892" />
        </view>
        <view v-if="userStore.isLogin" class="list-item" @tap="onSetPassword">
          <view class="list-icon"><AppIcon name="lock" :size="36" /></view><text class="list-label">{{ hasPassword ? '修改登录密码' : '设置登录密码' }}</text><text class="list-extra">{{ hasPassword ? '已设置' : '未设置' }}</text>
          <AppIcon name="chevron-right" :size="22" color="#b8a892" />
        </view>
        <view class="list-item" @tap="onSettings">
          <view class="list-icon"><AppIcon name="gear" :size="36" /></view><text class="list-label">设置</text><text class="list-extra">账号、通知</text>
          <AppIcon name="chevron-right" :size="22" color="#b8a892" />
        </view>
      </view>

      <text class="footer">爱花型袜业 · 2026</text>
    </scroll-view>
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
import AppIcon from '@/components/ui/AppIcon.vue'

const userStore = useUserStore()
const overview = reactive<{ designs: number; orders: Record<string, number> }>({ designs: 0, orders: {} })

const avatarText = computed(() => (userStore.userInfo?.nickname || '客').charAt(0))
const phoneText = computed(() => maskPhone(userStore.userInfo?.phone))
const orderTotal = computed(() => overview.orders.total ?? 0)
const hasPassword = computed(() => !!userStore.userInfo?.hasPassword)

onShow(async () => {
  if (!userStore.isLogin) return
  try {
    const res = await userApi.getOverview()
    overview.designs = res.data.designs
    overview.orders = res.data.orders
  } catch {
    /* 忽略 */
  }
  // 刷新资料以拿到 hasPassword（设置密码入口文案随之更新）
  try {
    await userStore.refreshProfile()
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
const onSetPassword = () => requireLogin(() => navigateTo('/pages/set-password/index'))

function onSettings() {
  uni.showActionSheet({
    itemList: ['清除缓存', '关于爱花型'],
    success: (r) => {
      if (r.tapIndex === 0) {
        try { uni.clearStorageSync() } catch { /* 忽略 */ }
        uni.showToast({ title: '缓存已清除', icon: 'none' })
      } else if (r.tapIndex === 1) {
        uni.showModal({ title: '关于爱花型', content: '爱花型 · AI 袜版定制\n版本 1.0.0', showCancel: false })
      }
    },
  })
}

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
  height: 100vh;
}
.mine-scroll {
  height: 100vh;
  box-sizing: border-box;
  padding: 32rpx 32rpx 140rpx;
}
.user-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background:
    radial-gradient(240rpx 160rpx at 90% 0%, $mp-coral-soft, transparent 70%),
    $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 28rpx;
  padding: 28rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: $mp-header-gradient;
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
  font-family: $mp-font-serif;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-info {
  flex: 1;
}
.user-name {
  font-size: 32rpx;
  font-weight: 700;
  color: $mp-text-primary;
  font-family: $mp-font-serif;
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
  font-family: $mp-font-serif;
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
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid $mp-divider;
}
.list-item:last-child {
  border-bottom: none;
}
.list-item.disabled {
  opacity: 0.5;
}
.list-icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 14rpx;
  background: $mp-coral-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  flex-shrink: 0;
}
.list-label {
  flex: 1;
  font-size: 28rpx;
  color: $mp-text-primary;
}
.list-extra {
  font-size: 22rpx;
  color: $mp-text-muted;
  margin-right: 8rpx;
}
.arrow {
  color: $mp-text-tertiary;
}
.footer {
  display: block;
  text-align: center;
  margin-top: 40rpx;
  font-size: 20rpx;
  color: $mp-text-muted;
}
</style>
