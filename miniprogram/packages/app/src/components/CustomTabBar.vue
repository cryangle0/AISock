<template>
  <view class="tabbar">
    <view
      v-for="(item, i) in tabs"
      :key="item.key"
      :class="['tab', { active: current === item.key, fab: item.key === 'editor' }]"
      @tap="onTap(item)"
    >
      <template v-if="item.key === 'editor'">
        <view class="fab-circle">
          <text class="fab-icon">🧦</text>
        </view>
        <text class="fab-label">{{ item.text }}</text>
      </template>
      <template v-else>
        <text class="tab-icon">{{ item.icon }}</text>
        <text class="tab-text">{{ item.text }}</text>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { switchTab } from '@aisock/common/utils'

defineProps<{ current: string }>()

const tabs = [
  { key: 'home', text: '首页', icon: '🏠', path: '/pages/home/index' },
  { key: 'feed', text: '推荐', icon: '🧭', path: '/pages/feed/index' },
  { key: 'editor', text: 'AI 设计', icon: '✏️', path: '/pages/editor/index' },
  { key: 'cart', text: '购物车', icon: '🛒', path: '/pages/cart/index' },
  { key: 'mine', text: '我的', icon: '👤', path: '/pages/mine/index' },
]

function onTap(item: { path: string }) {
  switchTab(item.path)
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 110rpx;
  display: flex;
  background: $mp-bg-card;
  border-top: 1rpx solid $mp-border;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  position: relative;
}
.tab-icon {
  font-size: 36rpx;
}
.tab-text {
  font-size: 20rpx;
  color: $mp-text-muted;
}
.tab.active .tab-text {
  color: $mp-primary;
  font-weight: 600;
}
.fab {
  justify-content: flex-end;
}
.fab-circle {
  position: absolute;
  top: -16rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(180deg, #946d60 0%, #b99d92 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(148, 109, 96, 0.4), 0 0 0 4rpx $mp-bg-card;
}
.fab-icon {
  font-size: 40rpx;
}
.fab-label {
  font-size: 18rpx;
  color: #fff;
  background: $mp-primary;
  padding: 1rpx 10rpx;
  border-radius: 999rpx;
  position: absolute;
  top: 58rpx;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  z-index: 2;
}
</style>
