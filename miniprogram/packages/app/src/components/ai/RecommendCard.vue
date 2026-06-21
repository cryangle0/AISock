<template>
  <view class="rec-card">
    <view class="rec-head">
      <text class="rec-title">花型推荐</text>
      <view class="rec-refresh" @tap="$emit('refresh')">
        <AppIcon name="redo" :size="22" color="#8e4f43" />
        <text class="rec-refresh-text">换一批</text>
      </view>
    </view>

    <view class="rec-visual">
      <!-- 大框：袜版预览（把选中花型渲染到袜子上）。对齐需求：大框=袜版，右侧小卡=花型 -->
      <view class="rec-main">
        <SockCanvas
          v-if="!previewHidden"
          :print-image="main.url || null"
          :pattern-id="null"
          :sock-type-id="sockTypeId || null"
          :params="previewParams"
          :colors="previewColors"
          mode="preview"
          :reserve-tag-space="!!sockName"
        />
        <!-- 抽屉打开时隐藏原生 canvas（否则会盖住抽屉），用普通 image 兜底显示花型 -->
        <image v-else-if="main.url" class="rec-fallback" :src="main.url" mode="aspectFit" />
        <view v-if="sockName && !previewHidden" class="rec-socktag">袜型 · {{ sockName }}</view>
      </view>
      <view class="rec-cands">
        <view
          v-for="c in candidates"
          :key="c.id"
          :class="['rec-cand', { active: main.id === c.id }]"
          :style="{ background: c.bg }"
          @tap="$emit('pick', c)"
        >
          <image v-if="c.url" class="cand-img" :src="c.url" mode="aspectFill" />
          <view class="cand-badge"><AppIcon name="plus" :size="16" color="#ffffff" /></view>
          <text class="cand-name">{{ c.name }}</text>
        </view>
      </view>
    </view>

    <view class="rec-actions">
      <view class="ra-tools">
        <view class="ra-tool" @tap="$emit('pickSock')">
          <AppIcon name="sock-template" :size="34" />
          <text class="ra-text">袜版选择</text>
        </view>
        <view class="ra-tool" @tap="$emit('recolor')">
          <AppIcon name="palette" :size="32" color="#5b5650" />
          <text class="ra-text">一键换色</text>
        </view>
        <view class="ra-tool" @tap="$emit('customize')">
          <AppIcon name="sparkle" :size="32" color="#5b5650" />
          <text class="ra-text">去定制</text>
        </view>
      </view>
      <view class="ra-order" @tap="$emit('order')">一键下单</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import SockCanvas from '@/components/editor/SockCanvas.vue'

export interface Candidate { id: string; name: string; bg: string; url?: string; customized?: boolean }
defineProps<{ main: Candidate; candidates: Candidate[]; sockTypeId?: string; sockName?: string; previewHidden?: boolean }>()
defineEmits<{
  refresh: []
  pick: [c: Candidate]
  recolor: []
  pickSock: []
  customize: []
  order: []
}>()

// 袜版预览使用默认配色，核心是把推荐花型真实贴合到当前袜版 geometry 上。
const previewColors = { bodyHex: null, weltHex: null, heelHex: null, toeHex: null }
const previewParams = { density: 100, rotation: 0, singleMode: false, tileDensity: 4 }
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.rec-card {
  background: #fff;
  border-radius: $mp-radius-xl;
  padding: 24rpx;
  box-shadow: $mp-shadow-md;
}
.rec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rec-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $mp-text-strong;
  font-family: $mp-font-serif;
}
.rec-refresh {
  display: flex;
  align-items: center;
  gap: 6rpx;
}
.rec-refresh-text {
  font-size: 22rpx;
  color: $mp-primary;
}
.rec-visual {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  align-items: stretch;
}
.rec-main {
  position: relative;
  flex: 1;
  height: 360rpx;
  border-radius: $mp-radius-lg;
  overflow: hidden;
  background: linear-gradient(180deg, #f6efe2 0%, #efe4cc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.rec-socktag {
  position: absolute;
  left: 16rpx;
  top: 16rpx;
  z-index: 2;
  padding: 6rpx 16rpx;
  border-radius: $mp-radius-pill;
  background-color: rgba(142, 79, 67, 0.88);
  color: #fff;
  font-size: 20rpx;
  font-family: $mp-font-serif;
}
.rec-fallback {
  width: 100%;
  height: 100%;
}
.rec-cands {
  width: 128rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.rec-cand {
  position: relative;
  flex: 1;
  border-radius: $mp-radius-xs;
  border: 2rpx solid transparent;
  overflow: hidden;
}
.rec-cand.active {
  border-color: $mp-primary;
}
.cand-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.cand-badge {
  position: absolute;
  right: 8rpx;
  top: 8rpx;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: $mp-gold;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cand-name {
  position: absolute;
  left: 10rpx;
  bottom: 8rpx;
  font-size: 18rpx;
  color: #fff;
  font-family: $mp-font-serif;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.4);
}
.rec-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
}
.ra-tools {
  display: flex;
  gap: 28rpx;
}
.ra-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.ra-text {
  font-size: 22rpx;
  color: $mp-text-body;
  font-family: $mp-font-serif;
}
.ra-order {
  height: 64rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  border-radius: $mp-radius-pill;
  border: 1rpx solid $mp-primary;
  color: $mp-primary;
  font-size: 24rpx;
  font-weight: 600;
  font-family: $mp-font-serif;
}
</style>
