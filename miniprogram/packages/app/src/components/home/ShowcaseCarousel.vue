<template>
  <view class="showcase">
    <view
      class="track"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <view
        v-for="(d, i) in items"
        :key="d.id"
        :class="['card', i === active ? 'active' : 'side']"
        :style="cardStyle(i, d)"
        @tap="onTap(i, d)"
      >
        <!-- 真实大图（有 cover 时优先；Figma 卡面为纯图，无文字）
             加载晕染：从中间向四周逐步扩散直到卡片边缘 + 轻微呼吸缩放 -->
        <image
          v-if="d.cover"
          class="card-cover"
          :class="{ revealed: i === active ? activeShown : true }"
          :src="d.cover"
          mode="aspectFill"
        />
        <!-- 晕染波前：与扩散同步的暖金涟漪（双层，错峰扩散到卡片边缘后淡出） -->
        <view v-if="d.cover && i === active" :key="`ripple-${revealTick}`" class="ripple-layer">
          <view class="ripple r1" />
          <view class="ripple r2" />
          <view class="bloom" />
        </view>
        <!-- 九色鹿剪影装饰（无图时的 CSS 兜底） -->
        <view v-else class="art">
          <view class="halo" :style="{ background: haloBg(d) }" />
          <view class="deer-body" :style="{ background: mainColor(d) }" />
          <view class="deer-head" :style="{ background: mainColor(d) }" />
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
import { onMounted, ref, watch } from 'vue'
import type { ConfigItem } from '@aisock/service'

const props = defineProps<{ items: ConfigItem[] }>()
const emit = defineEmits<{ select: [item: ConfigItem] }>()

// 默认选中中间一张（与原型一致）
const active = ref(props.items.length > 1 ? 1 : 0)

// 中心卡圆形扩散：每次轮播到某张图（成为中心卡）时，从中心重放扩散动画
const activeShown = ref(false)
// 涟漪波前重放：key 变化使节点重挂载，CSS animation 从头播放
const revealTick = ref(0)
function replayReveal() {
  activeShown.value = false // 先瞬时复位（base 态无 transition，立即收到中心）
  revealTick.value += 1
  setTimeout(() => { activeShown.value = true }, 60) // 再播放圆形扩散
}
watch(active, replayReveal)
onMounted(() => { setTimeout(() => { activeShown.value = true }, 150) })

// 触摸左右滑动切换（仅用 start/end 位移判断，不拦截 touchmove，避免影响页面竖向滚动）
let touchStartX = 0
function onTouchStart(e: any) {
  touchStartX = e.changedTouches?.[0]?.clientX ?? 0
}
function onTouchEnd(e: any) {
  const endX = e.changedTouches?.[0]?.clientX ?? touchStartX
  const dx = endX - touchStartX
  if (Math.abs(dx) < 30) return // 阈值，过滤误触
  if (dx < 0 && active.value < props.items.length - 1) active.value += 1
  else if (dx > 0 && active.value > 0) active.value -= 1
}

function cardStyle(i: number, d: ConfigItem) {
  const offset = i - active.value
  const abs = Math.abs(offset)
  const scale = 1 - 0.12 * abs
  return {
    transform: `translateX(${offset * 100}%) scale(${scale})`,
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
  height: 680rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  position: absolute;
  width: 80%;
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
.card-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* 初始：收到中心的小圆 + 半透明 + 轻微放大；无 transition → 复位瞬时完成（切卡不倒放） */
  clip-path: circle(0% at 50% 50%);
  -webkit-clip-path: circle(0% at 50% 50%);
  opacity: 0.3;
  transform: scale(1.06);
}
/* 扩散态：transition 只在此 → 切到该卡时从中心逐步晕染到卡片边缘 + 渐显 + 呼吸回正
   （不用 blur，避免真机重绘闪烁；scale 走合成层，安全） */
.card-cover.revealed {
  clip-path: circle(142% at 50% 50%);
  -webkit-clip-path: circle(142% at 50% 50%);
  opacity: 1;
  transform: scale(1);
  transition: clip-path 1.7s cubic-bezier(0.3, 0.62, 0.36, 0.99),
    -webkit-clip-path 1.7s cubic-bezier(0.3, 0.62, 0.36, 0.99),
    opacity 1.1s ease-out,
    transform 1.9s cubic-bezier(0.22, 1, 0.36, 1);
}
/* ── 晕染波前：暖金涟漪从中心荡到卡片边缘 ── */
.ripple-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}
.ripple {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 220rpx;
  height: 220rpx;
  margin: -110rpx 0 0 -110rpx;
  border-radius: 50%;
  /* 柔边光环：中空透明 → 暖金光晕 → 淡出，似矿物颜料在水中晕开 */
  background: radial-gradient(
    circle,
    transparent 52%,
    rgba(255, 236, 200, 0.5) 70%,
    rgba(206, 150, 92, 0.32) 84%,
    transparent 100%
  );
  transform: scale(0.12);
  opacity: 0;
  animation: ripple-spread 1.7s cubic-bezier(0.3, 0.62, 0.36, 0.99) forwards;
}
.ripple.r2 {
  animation-duration: 2s;
  animation-delay: 0.22s;
  background: radial-gradient(
    circle,
    transparent 58%,
    rgba(255, 244, 222, 0.32) 76%,
    transparent 100%
  );
}
@keyframes ripple-spread {
  0% {
    transform: scale(0.12);
    opacity: 0;
  }
  12% {
    opacity: 0.95;
  }
  72% {
    opacity: 0.4;
  }
  100% {
    /* 220rpx × 5.6 ≈ 1230rpx，足以越过 680rpx 高卡片的对角边缘 */
    transform: scale(5.6);
    opacity: 0;
  }
}
/* 中心微光绽放：扩散起点的一抹暖光，随波前散开而隐去 */
.bloom {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 320rpx;
  height: 320rpx;
  margin: -160rpx 0 0 -160rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 240, 210, 0.55) 0%, rgba(255, 240, 210, 0.18) 45%, transparent 70%);
  opacity: 0;
  animation: bloom-fade 1.5s ease-out forwards;
}
@keyframes bloom-fade {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  22% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.9);
  }
}
.card-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(43, 31, 20, 0.32) 0%, transparent 30%, transparent 70%, rgba(43, 31, 20, 0.32) 100%);
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
.tv-char {
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
