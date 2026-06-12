<template>
  <view class="gift-grid">
    <view
      v-for="g in items"
      :key="g.id"
      :class="['gift-card', { active: active === g.id }]"
      @tap="$emit('select', g)"
    >
      <view class="gift-ico" :style="{ background: g.bg }">
        <image v-if="g.img" class="gift-img" :src="g.img" mode="aspectFill" />
      </view>
      <view class="gift-text">
        <text class="gift-title">{{ g.title }}</text>
        <text class="gift-desc">{{ g.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface GiftItem { id: string; title: string; desc: string; bg: string; img?: string }

defineProps<{ items: GiftItem[]; active?: string }>()
defineEmits<{ select: [g: GiftItem] }>()
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.gift-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}
.gift-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: $mp-bg-card;
  border-radius: $mp-radius-md;
  padding: 18rpx;
  border: 2rpx solid transparent;
  box-shadow: $mp-shadow-sm;
}
.gift-card.active {
  border-color: $mp-primary;
}
.gift-ico {
  width: 64rpx;
  height: 64rpx;
  border-radius: $mp-radius-xs;
  flex-shrink: 0;
  overflow: hidden;
}
.gift-img {
  width: 100%;
  height: 100%;
}
.gift-text {
  flex: 1;
  min-width: 0;
}
.gift-title {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  color: $mp-text-strong;
  font-family: $mp-font-serif;
}
.gift-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: $mp-text-muted;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
