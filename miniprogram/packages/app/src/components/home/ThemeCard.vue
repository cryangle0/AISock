<template>
  <view class="theme-card" :style="{ background: theme.bg }" @tap="$emit('tap', theme)">
    <view class="theme-text">
      <text class="theme-cn">{{ titleTop }}</text>
      <text v-if="titleBottom" class="theme-cn">{{ titleBottom }}</text>
      <text class="theme-en">{{ theme.en }}</text>
    </view>
    <!-- 矿物质感装饰圆 -->
    <view class="theme-deco">
      <view class="deco-circle" :style="{ background: deco }" />
      <view class="deco-petal" :style="{ background: deco }" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConfigItem } from '@aisock/service'

const props = defineProps<{ theme: ConfigItem }>()
defineEmits<{ tap: [t: ConfigItem] }>()

// 标题超过 3 字时拆两行（与原型"二十四/节气"一致）
const titleTop = computed(() => {
  const t = props.theme.title || ''
  return t.length > 3 ? t.slice(0, 3) : t
})
const titleBottom = computed(() => {
  const t = props.theme.title || ''
  return t.length > 3 ? t.slice(3) : ''
})
const deco = computed(() => (props.theme.decoColor as string) || '#5a8a7d')
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.theme-card {
  position: relative;
  border-radius: 20rpx;
  padding: 20rpx;
  height: 150rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(94, 60, 30, 0.08);
  box-sizing: border-box;
}
.theme-text {
  position: relative;
  z-index: 1;
}
.theme-cn {
  display: block;
  font-size: 26rpx;
  font-weight: 800;
  color: #2b1f14;
  line-height: 1.12;
  letter-spacing: 0.04em;
  font-family: $mp-font-art;
}
.theme-en {
  display: block;
  margin-top: 6rpx;
  font-size: 14rpx;
  font-weight: 600;
  color: rgba(43, 31, 20, 0.5);
  letter-spacing: 0.16em;
}
.theme-deco {
  position: absolute;
  right: -8rpx;
  bottom: -8rpx;
  width: 70%;
  height: 75%;
}
.deco-circle {
  position: absolute;
  right: 24rpx;
  top: 18rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  opacity: 0.45;
}
.deco-petal {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  width: 56rpx;
  height: 56rpx;
  border-radius: 0 70% 0 70%;
  opacity: 0.55;
}
</style>
