<template>
  <BottomSheet title="分享设计" subtitle="把这件袜款分享给朋友，邀请一起设计" @close="$emit('close')">
    <!-- 分享卡片 -->
    <view class="share-card">
      <view class="share-cover">
        <image v-if="cover" :src="cover" mode="aspectFill" class="cover-img" />
        <view v-else class="cover-empty">🧦</view>
      </view>
      <view class="share-meta">
        <text class="share-title">{{ design.name || '我的袜版' }}</text>
        <text class="share-sub">爱花型 · AI 袜版定制</text>
        <text class="share-tag">点开即可同款再创作</text>
      </view>
    </view>

    <!-- 链接 -->
    <view class="share-link">
      <text class="link-url">{{ shareLink }}</text>
      <view class="link-copy" @tap="onCopy">{{ copied ? '已复制' : '复制' }}</view>
    </view>

    <!-- 渠道 -->
    <view class="targets">
      <button class="target" open-type="share" @tap="onShareTo('微信好友')">
        <view class="target-icon" style="background: rgba(7,193,96,0.12); color: #07c160">💬</view>
        <text class="target-label">微信好友</text>
      </button>
      <view class="target" @tap="onTimelineHint">
        <view class="target-icon" style="background: rgba(26,173,25,0.12); color: #1aad19">🌄</view>
        <text class="target-label">朋友圈</text>
      </view>
      <view class="target" @tap="onCopy">
        <view class="target-icon" style="background: rgba(58,111,176,0.12); color: #3a6fb0">🔗</view>
        <text class="target-label">复制链接</text>
      </view>
    </view>

    <view class="share-tip">点「微信好友」直接发送卡片；分享朋友圈请点右上角「···」→ 分享到朋友圈。好友通过你的卡片注册，双方各得 AI 生图次数</view>
  </BottomSheet>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'
import { SHARE_BASE_URL } from '@aisock/common/constants'

const props = defineProps<{ design: { name?: string; printName?: string }; cover?: string | null }>()
const emit = defineEmits<{ close: []; shared: [target: string] }>()

const copied = ref(false)
const shareLink = computed(() => `${SHARE_BASE_URL}/s/${encodeURIComponent((props.design.printName || props.design.name || 'design').slice(0, 16))}`)

function onCopy() {
  uni.setClipboardData({
    data: shareLink.value,
    success: () => {
      copied.value = true
      setTimeout(() => (copied.value = false), 1500)
    },
  })
}

function onShareTo(target: string) {
  // 邀请奖励改由真实邀请关系（被邀请人注册）发放，分享本身不再自助加额度
  emit('shared', target)
}

function onTimelineHint() {
  uni.showToast({ title: '点右上角 ··· 分享到朋友圈', icon: 'none', duration: 2200 })
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.share-card {
  display: flex;
  gap: 20rpx;
  background: $mp-bg;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}
.share-cover {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: $mp-bg-card;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.cover-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
}
.share-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
}
.share-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $mp-text-primary;
}
.share-sub {
  font-size: 22rpx;
  color: $mp-text-muted;
}
.share-tag {
  font-size: 20rpx;
  color: $mp-primary;
  background: $mp-primary-soft;
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  align-self: flex-start;
}
.share-link {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: $mp-bg;
  border-radius: 14rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 24rpx;
}
.link-url {
  flex: 1;
  font-size: 22rpx;
  color: $mp-text-secondary;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.link-copy {
  font-size: 22rpx;
  color: $mp-primary;
  flex-shrink: 0;
}
.targets {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24rpx;
}
.target {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  background: transparent;
  border: none;
  padding: 0;
  line-height: 1.2;
}
.target::after {
  border: none;
}
.target-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}
.target-label {
  font-size: 22rpx;
  color: $mp-text-secondary;
}
.share-tip {
  font-size: 20rpx;
  color: $mp-text-muted;
  line-height: 1.6;
  text-align: center;
}
</style>
