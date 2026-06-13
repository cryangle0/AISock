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
        <!-- 真实大图：加载晕染 = 先模糊+蒙版，清晰层从中心向四周边缘逐步清晰 -->
        <template v-if="d.cover">
          <!-- 底层：模糊图 + 暖色蒙版（"尚未清晰"的底） -->
          <image class="cover-blur" :src="d.cover" mode="aspectFill" />
          <view class="cover-veil" />
          <!-- 顶层：清晰图，用圆形 clip 从中心扩展覆盖模糊底 → 中心到四周逐步清晰 -->
          <image
            class="cover-sharp"
            :class="{ clear: i === active ? activeShown : true }"
            :src="d.cover"
            mode="aspectFill"
            @load="onCoverLoad(i)"
          />
        </template>
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

// 中心卡渐清晰：每次轮播到某张图（成为中心卡）时，清晰层从中心重放圆形扩展
const activeShown = ref(false)
function replayReveal() {
  activeShown.value = false // 先瞬时复位到「中心未清晰」（base 态无 transition，立即收圆）
  // 切卡时图片已加载，稍后即从中心向四周逐步清晰
  setTimeout(() => { activeShown.value = true }, 60)
}
watch(active, replayReveal)

// 关键：等当前中心图「加载完成」后再触发渐清晰，避免图未到位时动画空放（表现为「无效果」）
function onCoverLoad(i: number) {
  if (i === active.value) activeShown.value = true
}
// 兜底：个别图已缓存 / load 未触发时，确保最终清晰
onMounted(() => { setTimeout(() => { activeShown.value = true }, 500) })

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
/* ── 加载晕染：模糊蒙版底 + 清晰层从中心向四周逐步清晰 ── */
.cover-blur,
.cover-sharp {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
/* 底层：模糊图（放大一点遮住模糊边缘） */
.cover-blur {
  filter: blur(16rpx);
  -webkit-filter: blur(16rpx);
  transform: scale(1.08);
}
/* 暖色蒙版：盖在模糊底上，呈现「尚未清晰」的朦胧感 */
.cover-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(74, 48, 32, 0.34), rgba(120, 74, 54, 0.26));
}
/* 顶层清晰图：初始收到中心小圆（无 transition → 切卡瞬时复位，不倒放） */
.cover-sharp {
  clip-path: circle(0% at 50% 50%);
  -webkit-clip-path: circle(0% at 50% 50%);
}
/* 清晰态：圆形从中心扩展到越过卡片对角，逐步覆盖模糊底 → 中心到四周边缘渐次清晰 */
.cover-sharp.clear {
  clip-path: circle(150% at 50% 50%);
  -webkit-clip-path: circle(150% at 50% 50%);
  transition: clip-path 1.7s cubic-bezier(0.33, 0.62, 0.36, 0.99),
    -webkit-clip-path 1.7s cubic-bezier(0.33, 0.62, 0.36, 0.99);
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
