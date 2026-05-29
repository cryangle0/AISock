<template>
  <view class="sock-preview">
    <!-- 用纯 view 叠层模拟袜版（小程序不支持复杂 SVG clip，改用圆角块拼袜形） -->
    <view class="sock-shape">
      <view class="sock-region welt" :style="{ background: weltColor }" />
      <view class="sock-region cuff" :style="{ background: cuffColor }" />
      <view class="sock-region body" :style="{ background: bodyColor }">
        <image v-if="printImage" :src="printImage" mode="aspectFill" class="body-print" :style="printStyle" />
        <view v-else-if="patternId" class="body-pattern" :style="{ background: patternBg }">
          <view class="pattern-dot" :style="{ background: patternFg }" />
        </view>
      </view>
      <view class="sock-foot">
        <view class="sock-region heel" :style="{ background: heelColor }" />
        <view class="sock-region toe" :style="{ background: toeColor }" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PATTERN_LIST } from '@aisock/common'

const props = defineProps<{
  printImage?: string | null
  patternId?: string | null
  params: { rotation: number }
  colors: { bodyHex: string | null; weltHex: string | null; heelHex: string | null; toeHex: string | null }
}>()

const bodyColor = computed(() => props.colors.bodyHex || '#efe4cc')
const weltColor = computed(() => props.colors.weltHex || '#d9c8a8')
const cuffColor = computed(() => props.colors.weltHex || '#e3d3b3')
const heelColor = computed(() => props.colors.heelHex || '#d9c8a8')
const toeColor = computed(() => props.colors.toeHex || props.colors.heelHex || '#d9c8a8')

const patternDef = computed(() => PATTERN_LIST.find((p) => p.id === props.patternId))
const patternBg = computed(() => patternDef.value?.bg || '#fff')
const patternFg = computed(() => patternDef.value?.fg || '#d4376b')
const printStyle = computed(() => ({ transform: `rotate(${props.params.rotation}deg)` }))
</script>

<style scoped lang="scss">
.sock-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
}
.sock-shape {
  width: 300rpx;
  display: flex;
  flex-direction: column;
  border-radius: 30rpx 30rpx 0 0;
  overflow: hidden;
  box-shadow: 0 12rpx 36rpx rgba(94, 60, 30, 0.15);
}
.sock-region {
  width: 100%;
}
.welt {
  height: 40rpx;
}
.cuff {
  height: 50rpx;
}
.body {
  height: 320rpx;
  position: relative;
  overflow: hidden;
}
.body-print {
  width: 100%;
  height: 100%;
}
.body-pattern {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pattern-dot {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  opacity: 0.7;
}
.sock-foot {
  display: flex;
  height: 110rpx;
  /* 模拟脚掌：左跟右头 */
  border-radius: 0 0 60rpx 90rpx;
  overflow: hidden;
}
.heel {
  width: 40%;
  height: 100%;
}
.toe {
  width: 60%;
  height: 100%;
}
</style>
