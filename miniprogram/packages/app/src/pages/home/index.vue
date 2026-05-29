<template>
  <view class="home">
    <!-- 棕色顶部带：品牌 + 敦煌梦 banner -->
    <view class="band">
      <view class="brand">爱花型 · 袜稿设计</view>
      <view class="banner" @tap="goFeed">
        <view class="banner-left">
          <view class="banner-cn">敦<br />煌<br />梦</view>
          <view class="banner-en">DUN HUANG DREAM</view>
        </view>
        <view class="banner-tag">千年壁画艺术之旅</view>
      </view>
    </view>

    <!-- 主题随心订 -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">主题随心订</text>
        <text class="section-en">Select theme</text>
      </view>
      <view class="theme-grid">
        <view v-for="t in themes" :key="t.id" class="theme-card" :style="{ background: t.bg }" @tap="goFeed">
          <text class="theme-cn">{{ t.title }}</text>
          <text class="theme-en">{{ t.en }}</text>
        </view>
      </view>
    </view>

    <!-- 大画 carousel -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">袜版设计预设</text>
      </view>
      <scroll-view scroll-x class="showcase">
        <view
          v-for="d in featured"
          :key="d.id"
          class="showcase-card"
          :style="{ background: d.bg }"
          @tap="goEditor"
        >
          <text class="showcase-title">{{ d.title }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 快捷入口 -->
    <view class="section quick">
      <view class="quick-item" @tap="goEditor">
        <text class="quick-icon">✏️</text><text>开始设计</text>
      </view>
      <view class="quick-item" @tap="goCart">
        <text class="quick-icon">🛒</text><text>购物车</text>
      </view>
      <view class="quick-item" @tap="goDesigns">
        <text class="quick-icon">📁</text><text>我的设计</text>
      </view>
    </view>

    <custom-tab-bar current="home" />
  </view>
</template>

<script setup lang="ts">
import { switchTab, navigateTo } from '@aisock/common/utils'
import CustomTabBar from '@/components/CustomTabBar.vue'

const themes = [
  { id: 'jieqi', title: '二十四节气', en: 'JIE QI', bg: 'linear-gradient(135deg,#E8D5B8,#D4C09A)' },
  { id: 'dunhuang', title: '敦煌入梦', en: 'DUN HUANG', bg: 'linear-gradient(135deg,#C9B89A,#B5A085)' },
  { id: 'wenchuang', title: '文创物语', en: 'WEN CHUANG', bg: 'linear-gradient(135deg,#DEC38A,#C7A66E)' },
]

const featured = [
  { id: 'd1', title: '敦煌九色鹿', bg: 'linear-gradient(180deg,#C8B89A,#d4b796)' },
  { id: 'd2', title: '飞天乐舞', bg: 'linear-gradient(180deg,#A8C4B0,#d4b796)' },
  { id: 'd3', title: '千手观音', bg: 'linear-gradient(180deg,#D6A87A,#d4b796)' },
]

const goFeed = () => switchTab('/pages/feed/index')
const goEditor = () => switchTab('/pages/editor/index')
const goCart = () => switchTab('/pages/cart/index')
const goDesigns = () => navigateTo('/pages/designs/index')
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.home {
  min-height: 100vh;
  padding-bottom: 140rpx;
}
.band {
  background: #946c5f;
  padding-bottom: 28rpx;
}
.brand {
  padding: 28rpx 36rpx 20rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #fffcf6;
}
.banner {
  margin: 0 32rpx;
  height: 200rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #f5ebd7, #e5d4b5);
  position: relative;
  box-shadow: 0 8rpx 24rpx rgba(43, 31, 20, 0.15);
  overflow: hidden;
}
.banner-left {
  padding: 24rpx 28rpx;
}
.banner-cn {
  font-size: 40rpx;
  font-weight: 800;
  color: #2b1f14;
  line-height: 1.1;
  letter-spacing: 6rpx;
}
.banner-en {
  margin-top: 8rpx;
  font-size: 16rpx;
  color: rgba(43, 31, 20, 0.55);
  letter-spacing: 4rpx;
}
.banner-tag {
  position: absolute;
  top: 28rpx;
  left: 150rpx;
  font-size: 20rpx;
  color: rgba(43, 31, 20, 0.7);
}
.section {
  padding: 24rpx 32rpx 0;
}
.section-head {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 800;
  color: $mp-text-primary;
}
.section-en {
  font-size: 20rpx;
  color: $mp-text-secondary;
}
.theme-grid {
  display: flex;
  gap: 16rpx;
}
.theme-card {
  flex: 1;
  height: 150rpx;
  border-radius: 20rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}
.theme-cn {
  font-size: 26rpx;
  font-weight: 800;
  color: #2b1f14;
}
.theme-en {
  margin-top: 8rpx;
  font-size: 16rpx;
  color: rgba(43, 31, 20, 0.5);
  letter-spacing: 3rpx;
}
.showcase {
  white-space: nowrap;
}
.showcase-card {
  display: inline-flex;
  align-items: flex-start;
  justify-content: flex-end;
  width: 320rpx;
  height: 420rpx;
  margin-right: 20rpx;
  border-radius: 32rpx;
  box-shadow: 0 12rpx 36rpx rgba(94, 60, 30, 0.18);
}
.showcase-title {
  writing-mode: vertical-rl;
  margin: 24rpx;
  font-size: 36rpx;
  font-weight: 800;
  color: #c5483c;
}
.quick {
  display: flex;
  gap: 16rpx;
}
.quick-item {
  flex: 1;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 20rpx;
  padding: 24rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: $mp-text-secondary;
}
.quick-icon {
  font-size: 40rpx;
}
</style>
