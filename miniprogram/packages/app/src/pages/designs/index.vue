<template>
  <view class="designs">
    <view v-if="list.length === 0" class="empty">
      <text class="empty-icon">📁</text>
      <text class="empty-text">还没有保存的设计</text>
      <button class="empty-btn" @tap="goEditor">去设计</button>
    </view>
    <view v-else class="grid">
      <view v-for="d in list" :key="d.id" class="card">
        <image v-if="d.cover_url" :src="d.cover_url" mode="aspectFill" class="cover" />
        <view v-else class="cover placeholder">🧦</view>
        <view class="meta">
          <text class="name">{{ d.name }}</text>
          <text class="date">{{ d.created_at?.slice(0, 10) }}</text>
        </view>
        <view class="ops">
          <text class="op" @tap="onDelete(d.id)">删除</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { designApi } from '@aisock/service'
import { switchTab } from '@aisock/common/utils'
import type { Design } from '@aisock/common/types'

const list = ref<Design[]>([])

async function fetchList() {
  try {
    const res = await designApi.listDesigns()
    list.value = res.data
  } catch {
    /* 忽略 */
  }
}

onShow(fetchList)

async function onDelete(id: number) {
  const res = await uni.showModal({ title: '提示', content: '确定删除该设计？' })
  if (!res.confirm) return
  await designApi.deleteDesign(id)
  uni.showToast({ title: '已删除', icon: 'none' })
  fetchList()
}

const goEditor = () => switchTab('/pages/editor/index')
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.designs {
  min-height: 100vh;
  padding: 24rpx 32rpx;
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
  background: $mp-primary;
  color: #fff;
  border-radius: 999rpx;
  font-size: 26rpx;
  padding: 0 48rpx;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.card {
  width: calc(50% - 10rpx);
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 20rpx;
  overflow: hidden;
}
.cover {
  width: 100%;
  height: 240rpx;
}
.cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
  background: $mp-bg;
}
.meta {
  padding: 16rpx;
}
.name {
  font-size: 26rpx;
  font-weight: 600;
  color: $mp-text-primary;
}
.date {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: $mp-text-muted;
}
.ops {
  padding: 0 16rpx 16rpx;
  text-align: right;
}
.op {
  font-size: 22rpx;
  color: $mp-pink;
}
</style>
