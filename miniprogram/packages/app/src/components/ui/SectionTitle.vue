<template>
  <view class="sec-title">
    <view class="sec-line" :style="lineStyle" />
    <view class="sec-mid">
      <text class="sec-text" :style="{ color }">{{ title }}</text>
      <text v-if="subtitle" class="sec-sub">{{ subtitle }}</text>
    </view>
    <view class="sec-line" :style="lineStyle" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** 标题与分隔线颜色 */
    color?: string
    /** 分隔线长度（rpx） */
    lineWidth?: number
  }>(),
  { color: '#8e4f43', lineWidth: 64 },
)

const lineStyle = computed(() => ({
  width: `${props.lineWidth}rpx`,
  background: props.color,
}))
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.sec-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}
.sec-line {
  height: 2rpx;
  flex-shrink: 0;
  opacity: 0.7;
}
.sec-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.sec-text {
  font-size: 34rpx;
  font-weight: 700;
  font-family: $mp-font-serif;
  letter-spacing: 0.04em;
}
.sec-sub {
  font-size: 20rpx;
  color: $mp-text-muted;
  letter-spacing: 0.08em;
}
</style>
