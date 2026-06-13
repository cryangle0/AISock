<template>
  <view class="tabbar">
    <view class="tabbar-bar">
      <!-- 左侧两项 -->
      <view
        v-for="item in leftTabs"
        :key="item.key"
        :class="['tab', { active: current === item.key }]"
        @tap="onTap(item)"
      >
        <AppIcon :name="item.icon" :size="44" :color="iconColor(item.key)" />
        <text class="tab-text" :style="{ color: textColor(item.key) }">{{ item.text }}</text>
      </view>

      <!-- 中间占位（给浮起的 AI 按钮留空间） -->
      <view class="tab tab--center-slot" @tap="onTap(editorTab)">
        <text class="tab-text tab-text--center" :style="{ color: textColor('editor') }">{{ editorTab.text }}</text>
      </view>

      <!-- 右侧两项 -->
      <view
        v-for="item in rightTabs"
        :key="item.key"
        :class="['tab', { active: current === item.key }]"
        @tap="onTap(item)"
      >
        <AppIcon :name="item.icon" :size="44" :color="iconColor(item.key)" />
        <text class="tab-text" :style="{ color: textColor(item.key) }">{{ item.text }}</text>
      </view>
    </view>

    <!-- 中间浮起 AI 设计入口（吉祥物头像） -->
    <view :class="['fab', { active: current === 'editor' }]" @tap="onTap(editorTab)">
      <view class="fab-ring">
        <image class="fab-avatar" src="/static/images/mascot.png" mode="aspectFill" />
      </view>
    </view>

    <!-- iOS Home Indicator 安全区 -->
    <view class="home-indicator" />
  </view>
</template>

<script setup lang="ts">
import { switchTab } from '@aisock/common/utils'
import AppIcon from './ui/AppIcon.vue'

const props = defineProps<{ current: string }>()

interface Tab {
  key: string
  text: string
  icon: string
  path: string
}

const leftTabs: Tab[] = [
  { key: 'home', text: '首页', icon: 'home-fill', path: '/pages/home/index' },
  { key: 'feed', text: '浏览', icon: 'compass', path: '/pages/feed/index' },
]
const rightTabs: Tab[] = [
  { key: 'cart', text: '购物车', icon: 'bag', path: '/pages/cart/index' },
  { key: 'mine', text: '我的', icon: 'account', path: '/pages/mine/index' },
]
const editorTab: Tab = { key: 'editor', text: 'AI设计', icon: 'sparkle', path: '/pages/ai/index' }

const ACTIVE = '#8e4f43'
const IDLE = '#222222'

function iconColor(key: string) {
  return props.current === key ? ACTIVE : IDLE
}
function textColor(key: string) {
  return props.current === key ? ACTIVE : IDLE
}
function onTap(item: Tab) {
  if (props.current === item.key) return
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
  z-index: 100;
  background: #fff;
  box-shadow: 0 -2rpx 24rpx rgba(94, 60, 30, 0.06);
}
.tabbar-bar {
  height: 96rpx;
  display: flex;
  align-items: center;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}
.tab-text {
  font-size: 20rpx;
  font-family: $mp-font-serif;
  font-weight: 400;
}
.tab.active .tab-text {
  font-weight: 600;
}
.tab--center-slot {
  justify-content: flex-end;
  padding-bottom: 8rpx;
}
.tab-text--center {
  font-weight: 600;
}

/* 浮起 AI 头像 */
.fab {
  position: absolute;
  left: 50%;
  top: -30rpx;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.fab-ring {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: $mp-header-gradient;
  padding: 5rpx;
  box-sizing: border-box;
  box-shadow: 0 10rpx 24rpx rgba(142, 79, 67, 0.45), 0 0 0 7rpx #fff;
  transition: transform 0.2s ease;
}
.fab.active .fab-ring {
  transform: scale(1.06);
}
.fab-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
}
.home-indicator {
  height: env(safe-area-inset-bottom);
}
</style>
