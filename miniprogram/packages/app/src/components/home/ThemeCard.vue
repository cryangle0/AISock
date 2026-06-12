<template>
  <view class="theme-card" @tap="$emit('tap', theme)">
    <!-- 色块上铺满袜版产品图（Figma：图片满铺圆角块） -->
    <view class="theme-preview" :style="{ background: theme.bg || defaultBg }">
      <image v-if="theme.cover" class="theme-img" :src="theme.cover" mode="aspectFill" />
      <template v-else>
        <view class="deco-circle" :style="{ background: deco }" />
        <view class="deco-petal" :style="{ background: deco }" />
      </template>
    </view>
    <!-- 标题 + 箭头 -->
    <view class="theme-foot">
      <text class="theme-name">{{ theme.title }}</text>
      <AppIcon name="chevron-right" :size="20" :color="'#8a8378'" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConfigItem } from '@aisock/service'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ theme: ConfigItem }>()
defineEmits<{ tap: [t: ConfigItem] }>()

const defaultBg = 'linear-gradient(135deg,#E8D5B8,#D4C09A)'
const deco = computed(() => (props.theme.decoColor as string) || '#5a8a7d')
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.theme-card {
  background: $mp-bg-card;
  border-radius: $mp-radius-md;
  padding: 14rpx;
  box-shadow: $mp-shadow-sm;
  box-sizing: border-box;
}
.theme-preview {
  position: relative;
  height: 120rpx;
  border-radius: $mp-radius-sm;
  overflow: hidden;
}
.theme-img {
  width: 100%;
  height: 100%;
}
.deco-circle {
  position: absolute;
  right: 18rpx;
  top: 14rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  opacity: 0.4;
}
.deco-petal {
  position: absolute;
  right: 8rpx;
  bottom: 6rpx;
  width: 52rpx;
  height: 52rpx;
  border-radius: 0 70% 0 70%;
  opacity: 0.5;
}
.theme-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  margin-top: 14rpx;
}
.theme-name {
  font-size: 24rpx;
  font-weight: 600;
  color: $mp-text-primary;
  font-family: $mp-font-serif;
}
</style>
