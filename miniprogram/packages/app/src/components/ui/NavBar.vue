<template>
  <view class="nav" :class="[`nav--${variant}`]" :style="navStyle">
    <!-- 状态栏占位 -->
    <view class="nav-status" :style="{ height: statusBarHeight + 'px' }" />
    <!-- 标题栏 -->
    <view class="nav-bar">
      <view v-if="showBack" class="nav-back" @tap="onBack">
        <AppIcon name="chevron-left" :size="40" :color="iconColor" />
      </view>
      <text class="nav-title" :class="{ 'nav-title--brand': brand }" :style="titleSize ? { fontSize: titleSize } : {}">{{ title }}</text>
      <view class="nav-right"><slot name="right" /></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { navigateBack } from '@aisock/common/utils'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    /** 品牌大字（白色衬线 48rpx），用于一级页 */
    brand?: boolean
    showBack?: boolean
    /** solid=暖棕渐变实底；transparent=透明（叠在图片/自定义背景上） */
    variant?: 'solid' | 'transparent'
    /** 文字/图标颜色（默认白） */
    color?: string
    /** 标题字号（覆盖默认 36rpx，如 '42rpx'；brand 模式不受影响） */
    titleSize?: string
  }>(),
  { title: '爱花型', brand: false, showBack: false, variant: 'solid', color: '#ffffff' },
)

const statusBarHeight = ref(20)
try {
  // 优先用新版 getWindowInfo（getSystemInfoSync 已废弃），取不到再回退
  const info: any = (uni as any).getWindowInfo ? (uni as any).getWindowInfo() : uni.getSystemInfoSync()
  statusBarHeight.value = info.statusBarHeight || 20
} catch {
  /* 取不到用默认 */
}

const iconColor = computed(() => props.color)
const navStyle = computed(() => ({ color: props.color }))

function onBack() {
  navigateBack()
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.nav {
  position: relative;
  width: 100%;
}
.nav--solid {
  background: $mp-header-gradient;
}
.nav--transparent {
  background: transparent;
}
.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  position: relative;
}
.nav-back {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  margin-left: -12rpx;
}
.nav-title {
  font-size: 36rpx;
  font-weight: 700;
  color: inherit;
  font-family: $mp-font-serif;
  letter-spacing: 0.02em;
}
.nav-title--brand {
  font-size: 44rpx;
  font-weight: 900;
  font-family: $mp-font-art;
  letter-spacing: 0.04em;
}
.nav-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}
</style>
