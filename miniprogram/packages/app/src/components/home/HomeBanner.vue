<template>
  <view class="banner" @tap="$emit('tap')">
    <image v-if="cover" class="banner-img" :src="cover" mode="aspectFill" />
    <!-- 无图兜底：暖棕渐变 + 标题 -->
    <template v-else>
      <view class="banner-fallback" />
      <text class="banner-cn">{{ title }}</text>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConfigItem } from '@aisock/service'

const props = defineProps<{ item?: ConfigItem }>()
defineEmits<{ tap: [] }>()

// Figma 的 hero 文案/装饰已烘焙进图片，直接整图展示即可
const cover = computed(() => (props.item?.cover as string) || '/static/images/hero-dunhuang.jpg')
const title = computed(() => props.item?.title || '敦煌入梦')
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.banner {
  position: relative;
  height: 300rpx;
  border-radius: $mp-radius-lg;
  overflow: hidden;
  background: #f3ece0;
  box-shadow: $mp-shadow-card;
}
.banner-img {
  width: 100%;
  height: 100%;
}
.banner-fallback {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #c9b89a 0%, #a4675a 100%);
}
.banner-cn {
  position: absolute;
  left: 40rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 52rpx;
  font-weight: 900;
  color: #fffaf0;
  letter-spacing: 0.1em;
  font-family: $mp-font-art;
}
</style>
