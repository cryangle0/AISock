<template>
  <view class="detail">
    <!-- 头部：纯棕标题栏（对齐 Figma） -->
    <NavBar :title="navTitle" show-back variant="solid" />

    <scroll-view class="detail-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
      <view class="detail-body">
        <SectionTitle :title="seriesTitle" color="#8e4f43" :line-width="72" />

        <!-- 主商品卡 -->
        <view class="hero-card">
          <view class="hero-card-img" :style="{ background: heroBg }">
            <image v-if="cover" class="cover" :src="cover" mode="aspectFill" />
          </view>
          <view class="dots">
            <view
              v-for="(d, i) in 4"
              :key="i"
              :class="['dot', { active: i === slide }]"
              @tap="slide = i"
            />
          </view>
        </view>

        <!-- 描述 + 设计展示 -->
        <view class="info-card">
          <view class="desc-box">
            <text class="desc-text">{{ description }}</text>
          </view>

          <view class="design-grid">
            <SectionTitle title="设计展示" subtitle="原创设计 · 精准织造" color="#b8895a" :line-width="52" />
            <view class="grid">
              <view class="grid-item"><image class="grid-img" :src="GRID_IMGS[0]" mode="aspectFill" /></view>
              <view class="grid-item tall"><image class="grid-img" :src="GRID_IMGS[1]" mode="aspectFill" /></view>
              <view class="grid-item"><image class="grid-img" :src="GRID_IMGS[2]" mode="aspectFill" /></view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view class="act-btn ghost" @tap="onBuy">立即购买</view>
      <view class="act-btn solid" @tap="onCustomize">定制设计</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { navigateTo } from '@aisock/common/utils'

const seriesTitle = ref('杭城袜韵')
const navTitle = ref('袜版定制 · 杭城')
const cover = ref<string | null>('/static/images/detail-hero.jpg')
const slide = ref(0)
const heroBg = 'linear-gradient(160deg,#d8c4a6 0%,#a4675a 100%)'
const description = '将杭州城市文化融入袜品设计\n舒适与美学兼具\n传递城市温度与品质生活'

const GRID_IMGS = [
  '/static/images/detail-1.jpg',
  '/static/images/detail-2.jpg',
  '/static/images/detail-3.jpg',
]

onLoad((q?: Record<string, string>) => {
  if (q?.title) {
    const t = decodeURIComponent(q.title)
    seriesTitle.value = t.replace(/系列$/, '')
    navTitle.value = t
  }
})

function onBuy() {
  // 立即购买：直接跳转到购买页面
  const productName = seriesTitle.value || '袜款'
  const productCover = cover.value ? `&cover=${encodeURIComponent(cover.value)}` : ''
  navigateTo(`/pages/purchase/index?name=${encodeURIComponent(productName)}${productCover}`)
}
function onCustomize() {
  // 定制设计：跳转到袜版选择页面（upload），再由upload进入编辑器
  navigateTo('/pages/upload/index')
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.detail {
  height: 100vh;
  background: radial-gradient(120% 60% at 50% 0%, #fdf6ea 0%, $mp-bg 60%);
  display: flex;
  flex-direction: column;
}
.detail-hero {
  position: relative;
}
.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(43, 31, 20, 0.25), transparent);
}
.detail-scroll {
  flex: 1;
  min-height: 0;
}
.detail-body {
  padding: 32rpx 32rpx calc(160rpx + env(safe-area-inset-bottom));
}

/* 主商品卡 */
.hero-card {
  margin-top: 28rpx;
  background: $mp-bg-card;
  border-radius: $mp-radius-xl;
  padding: 20rpx;
  box-shadow: $mp-shadow-card;
}
.hero-card-img {
  height: 384rpx;
  border-radius: $mp-radius-lg;
  overflow: hidden;
}
.cover {
  width: 100%;
  height: 100%;
}
.dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  margin-top: 20rpx;
}
.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: $mp-radius-pill;
  background: #e0d6c4;
  transition: all 0.2s;
}
.dot.active {
  width: 28rpx;
  background: $mp-primary;
}

/* 信息卡 */
.info-card {
  margin-top: 24rpx;
  background: $mp-bg-card;
  border-radius: $mp-radius-md;
  padding: 24rpx;
  box-shadow: $mp-shadow-sm;
}
.desc-box {
  background: $mp-bg-inset;
  border-radius: $mp-radius-md;
  padding: 28rpx;
}
.desc-text {
  display: block;
  font-size: 26rpx;
  line-height: 2;
  color: $mp-text-secondary;
  text-align: center;
  font-family: $mp-font-serif;
  white-space: pre-line;
}
.design-grid {
  margin-top: 32rpx;
}
.grid {
  margin-top: 24rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 176rpx;
  gap: 18rpx;
}
.grid-item {
  border-radius: $mp-radius-md;
  box-shadow: $mp-shadow-sm;
  overflow: hidden;
}
.grid-item.tall {
  grid-row: span 2;
}
.grid-img {
  width: 100%;
  height: 100%;
}

/* 底部操作栏 */
.action-bar {
  display: flex;
  gap: 24rpx;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: $mp-bg-card;
  box-shadow: 0 -2rpx 24rpx rgba(94, 60, 30, 0.06);
}
.act-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 48rpx;
  font-size: 28rpx;
  font-weight: 700;
  font-family: $mp-font-serif;
}
.act-btn.ghost {
  color: $mp-gold;
  border: 2rpx solid $mp-gold;
}
.act-btn.solid {
  background: $mp-primary-deep;
  color: $mp-bg;
}
</style>
