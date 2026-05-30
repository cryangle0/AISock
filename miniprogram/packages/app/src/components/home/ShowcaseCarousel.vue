<template>
  <view class="showcase">
    <view class="track">
      <view
        v-for="(d, i) in items"
        :key="d.id"
        :class="['card', i === active ? 'active' : 'side']"
        :style="cardStyle(i, d)"
        @tap="onTap(i, d)"
      >
        <!-- 九色鹿剪影装饰（纯 CSS 拼形，避免依赖外部图） -->
        <view class="art">
          <view class="halo" :style="{ background: haloBg(d) }" />
          <view class="deer-body" :style="{ background: mainColor(d) }" />
          <view class="deer-head" :style="{ background: mainColor(d) }" />
        </view>
        <view class="title-vertical">
          <text v-for="(ch, k) in titleChars(d)" :key="k">{{ ch }}</text>
        </view>
      </view>
    </view>

    <view class="dots">
      <view
        v-for="(d, i) in items"
        :key="d.id"
        :class="['dot', { active: i === active }]"
        @tap="active = i"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ConfigItem } from '@aisock/service'

const props = defineProps<{ items: ConfigItem[] }>()
const emit = defineEmits<{ select: [item: ConfigItem] }>()

// 默认选中中间一张（与原型一致）
const active = ref(props.items.length > 1 ? 1 : 0)

function cardStyle(i: number, d: ConfigItem) {
  const offset = i - active.value
  const abs = Math.abs(offset)
  const scale = 1 - 0.12 * abs
  return {
    transform: `translateX(${offset * 75}%) scale(${scale})`,
    zIndex: String(10 - abs),
    background: (d.bg as string) || `linear-gradient(180deg, ${mainColor(d)} 0%, #d4b796 100%)`,
  }
}
function mainColor(d: ConfigItem) {
  return (d.mainColor as string) || '#c8b89a'
}
function haloBg(d: ConfigItem) {
  const accent = (d.accent as string) || '#8c5a3c'
  return `radial-gradient(circle, rgba(255,255,255,0.6) 0%, ${accent}33 70%, transparent 100%)`
}
function titleChars(d: ConfigItem) {
  return (d.title || '').split('')
}
function onTap(i: number, d: ConfigItem) {
  if (i === active.value) emit('select', d)
  else active.value = i
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.showcase {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0 24rpx;
}
.track {
  position: relative;
  width: 100%;
  height: 440rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  position: absolute;
  width: 72%;
  height: 100%;
  border-radius: 36rpx;
  padding: 20rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 36rpx rgba(94, 60, 30, 0.18);
  transition: transform 0.4s cubic-bezier(0.22, 0.9, 0.35, 1.01), opacity 0.4s ease, filter 0.4s ease;
  box-sizing: border-box;
}
.card.active {
  filter: none;
  opacity: 1;
}
.card.side {
  filter: brightness(0.92);
  opacity: 0.85;
}
.art {
  position: relative;
  width: 70%;
  height: 100%;
}
.halo {
  position: absolute;
  left: 50%;
  top: 30%;
  transform: translate(-50%, -50%);
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
}
.deer-body {
  position: absolute;
  left: 50%;
  top: 56%;
  transform: translateX(-50%);
  width: 96rpx;
  height: 150rpx;
  border-radius: 50% 50% 48% 48%;
  opacity: 0.92;
}
.deer-head {
  position: absolute;
  left: 50%;
  top: 38%;
  transform: translateX(-50%);
  width: 62rpx;
  height: 80rpx;
  border-radius: 50%;
  opacity: 0.92;
}
.title-vertical {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.title-vertical text {
  font-size: 32rpx;
  font-weight: 800;
  color: #c5483c;
  font-family: $mp-font-art;
  letter-spacing: 0.04em;
  text-shadow: 1rpx 1rpx 0 rgba(255, 245, 230, 0.5);
}
.dots {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: rgba(94, 60, 30, 0.22);
  transition: all 0.2s ease;
}
.dot.active {
  width: 28rpx;
  border-radius: 6rpx;
  background: $mp-primary;
}
</style>
