<template>
  <view class="feed">
    <view class="head">
      <text class="title">推荐</text>
      <text class="sub">精选主题 · 设计师作品 · 灵感库</text>
    </view>
    <view class="grid">
      <view v-for="f in featured" :key="f.id" class="card" :style="{ background: f.bg }" @tap="goEditor">
        <text class="tag">{{ f.tag }}</text>
        <text class="name">{{ f.title }}</text>
      </view>
    </view>
    <custom-tab-bar current="feed" />
  </view>
</template>

<script setup lang="ts">
import { switchTab } from '@aisock/common/utils'
import CustomTabBar from '@/components/CustomTabBar.vue'

const featured = [
  { id: 'f1', title: '敦煌九色鹿', tag: '主题', bg: 'linear-gradient(135deg,#C9B89A,#8C5A3C)' },
  { id: 'f2', title: '飞天乐舞', tag: '主题', bg: 'linear-gradient(135deg,#A8C4B0,#5a8a7d)' },
  { id: 'f3', title: '千手观音', tag: '主题', bg: 'linear-gradient(135deg,#D6A87A,#A05A3C)' },
  { id: 'f4', title: '二十四节气', tag: '系列', bg: 'linear-gradient(135deg,#E8D5B8,#C9B89A)' },
  { id: 'f5', title: '文创物语', tag: '系列', bg: 'linear-gradient(135deg,#DEC38A,#C7A66E)' },
  { id: 'f6', title: '色卡推荐', tag: '工具', bg: 'linear-gradient(135deg,#F0E4D1,#C5483C)' },
]

const goEditor = () => switchTab('/pages/editor/index')
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.feed {
  min-height: 100vh;
  padding: 32rpx 32rpx 140rpx;
}
.head {
  margin-bottom: 24rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 800;
  color: $mp-text-primary;
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $mp-text-secondary;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.card {
  width: calc(50% - 10rpx);
  height: 280rpx;
  border-radius: 24rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 8rpx 24rpx rgba(94, 60, 30, 0.12);
}
.tag {
  align-self: flex-start;
  font-size: 18rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.3);
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
}
.name {
  font-size: 36rpx;
  font-weight: 800;
  color: #fff;
}
</style>
