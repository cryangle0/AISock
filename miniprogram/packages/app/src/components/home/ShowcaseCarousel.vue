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
        <!-- 真实大图：加载晕染 = 模糊底 + 图中红线轮廓逐步扩展为清晰整卡 -->
        <template v-if="d.cover">
          <!-- 底层：模糊图 + 暖色蒙版（"尚未清晰"的底） -->
          <image class="cover-blur" :src="d.cover" mode="aspectFill" />
          <view class="cover-veil" />
          <!-- 顶层：清晰图，按需求图里的红线轮廓作为初始清晰区域 -->
          <view
            class="cover-reveal"
            :class="i === active ? (activeShown ? 'clear' : '') : 'done'"
          >
            <image
              class="cover-sharp"
              :src="d.cover"
              mode="aspectFill"
              @load="onCoverLoad(i)"
            />
          </view>
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
        @tap="setActive(i)"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { ConfigItem } from '@aisock/service'

const props = defineProps<{ items: ConfigItem[]; activeIndex?: number; revealReady?: boolean }>()
const emit = defineEmits<{ select: [item: ConfigItem]; activeChange: [index: number] }>()

// 默认选中中间一张（与原型一致）
const active = ref(normalizeIndex(props.activeIndex ?? (props.items.length > 1 ? 1 : 0)))

// 中心卡渐清晰：先露出需求图红线轮廓，再从这个轮廓扩展到整张卡。
const activeShown = ref(false)
const loaded = new Set<number>()

function normalizeIndex(index: number): number {
  if (!props.items.length) return 0
  if (!Number.isFinite(index)) return props.items.length > 1 ? 1 : 0
  return Math.min(Math.max(Math.round(index), 0), props.items.length - 1)
}

function setActive(index: number) {
  active.value = normalizeIndex(index)
}

function play() {
  activeShown.value = false // 先瞬时复位到中心收拢（base 态无 transition）
  setTimeout(() => { activeShown.value = true }, 60) // 再从中心向四周逐步清晰
}
function maybeReveal() {
  if (props.revealReady !== false && loaded.has(active.value)) play()
}
function onCoverLoad(i: number) {
  loaded.add(i)
  if (i === active.value) maybeReveal()
}
// 切卡：先收拢，已加载则重放
watch(active, (index) => { emit('activeChange', index); activeShown.value = false; maybeReveal() })
watch(() => props.activeIndex, (index) => {
  if (index === undefined || index === active.value) return
  setActive(index)
})
watch(
  () => props.items.map((item) => item.id).join('|'),
  () => {
    loaded.clear()
    activeShown.value = false
    setActive(0)
  },
)
// 页面就绪（冷启动启动页消失后）→ 触发当前卡渐清晰
watch(() => props.revealReady, (v) => { if (v) maybeReveal() })
// 兜底：就绪后若图迟迟未 load，最终仍展示清晰
onMounted(() => {
  setTimeout(() => { if (props.revealReady !== false && !activeShown.value) activeShown.value = true }, 2200)
})

// 触摸左右滑动切换（仅用 start/end 位移判断，不拦截 touchmove，避免影响页面竖向滚动）
let touchStartX = 0
function onTouchStart(e: any) {
  touchStartX = e.changedTouches?.[0]?.clientX ?? 0
}
function onTouchEnd(e: any) {
  const endX = e.changedTouches?.[0]?.clientX ?? touchStartX
  const dx = endX - touchStartX
  if (Math.abs(dx) < 30) return // 阈值，过滤误触
  if (dx < 0 && active.value < props.items.length - 1) setActive(active.value + 1)
  else if (dx > 0 && active.value > 0) setActive(active.value - 1)
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
  else setActive(i)
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
/* ── 加载晕染：模糊蒙版底 + 清晰层从需求图红线轮廓扩展到整卡 ── */
.cover-blur {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
/* E:\download\袜子.svg 外轮廓抽样。
   下面两个 polygon 是同一组点以卡片中心等比缩放：初始 24%，结束 480%。
   因此扩散过程中轮廓不变形，只是同一个弯板轮廓逐步变大。 */
$reveal-shape-start: polygon(
  47.75% 59.24%,
  47.03% 59.19%,
  45.66% 58.83%,
  45.04% 58.52%,
  43.93% 57.68%,
  43.47% 57.16%,
  43.07% 56.58%,
  42.51% 55.26%,
  42.37% 54.55%,
  42.32% 53.84%,
  42.5% 52.45%,
  42.72% 51.79%,
  43.41% 50.58%,
  43.87% 50.05%,
  44.4% 49.58%,
  45.02% 49.16%,
  46.77% 48.15%,
  46.81% 43.02%,
  46.91% 42.61%,
  47.07% 42.22%,
  47.56% 41.55%,
  47.88% 41.28%,
  48.62% 40.9%,
  49.03% 40.8%,
  49.47% 40.76%,
  55.36% 40.8%,
  55.78% 40.9%,
  56.17% 41.06%,
  56.83% 41.55%,
  57.1% 41.87%,
  57.49% 42.61%,
  57.59% 43.02%,
  57.63% 43.46%,
  57.68% 51.14%,
  57.66% 51.79%,
  57.38% 53.02%,
  57.14% 53.6%,
  56.83% 54.15%,
  56.03% 55.13%,
  55.54% 55.55%,
  54.96% 55.92%,
  50.45% 58.52%,
  50.2% 58.65%,
  49.68% 58.88%,
  49.42% 58.98%,
  49.15% 59.06%,
  48.6% 59.17%,
  48.32% 59.21%,
  47.75% 59.24%,
  47.75% 59.24%
);
$reveal-shape-end: polygon(
  5.05% 234.78%,
  -9.42% 233.89%,
  -36.73% 226.64%,
  -49.26% 220.49%,
  -71.39% 203.69%,
  -80.69% 193.27%,
  -88.61% 181.65%,
  -99.77% 155.23%,
  -102.65% 141.01%,
  -103.6% 126.8%,
  -99.99% 99.06%,
  -95.56% 85.87%,
  -81.81% 61.68%,
  -72.63% 51.02%,
  -61.99% 41.54%,
  -49.54% 33.16%,
  -14.57% 13.06%,
  -13.85% -89.55%,
  -11.8% -97.86%,
  -8.53% -105.6%,
  1.26% -118.95%,
  7.55% -124.35%,
  22.36% -132.02%,
  30.66% -134.07%,
  39.41% -134.78%,
  157.29% -134.07%,
  165.59% -132.02%,
  173.33% -128.74%,
  186.69% -118.95%,
  192.08% -112.67%,
  199.75% -97.86%,
  201.8% -89.55%,
  202.52% -80.8%,
  203.6% 72.86%,
  203.11% 85.71%,
  197.67% 110.44%,
  192.83% 122.09%,
  186.65% 133.09%,
  170.56% 152.65%,
  160.75% 160.96%,
  149.27% 168.48%,
  58.91% 220.4%,
  53.93% 223.1%,
  43.63% 227.67%,
  38.32% 229.54%,
  32.93% 231.13%,
  21.93% 233.46%,
  16.34% 234.2%,
  5.06% 234.78%,
  5.05% 234.78%
);

.cover-reveal {
  position: absolute;
  inset: 0;
  clip-path: $reveal-shape-start;
  -webkit-clip-path: $reveal-shape-start;
  filter: blur(10rpx);
  -webkit-filter: blur(10rpx);
  will-change: clip-path, filter;
}
.cover-reveal.done {
  clip-path: $reveal-shape-end;
  -webkit-clip-path: $reveal-shape-end;
  filter: blur(0);
  -webkit-filter: blur(0);
}
.cover-reveal.clear {
  animation: shape-reveal 1.8s cubic-bezier(0.33, 0.62, 0.36, 0.99) forwards;
}
@keyframes shape-reveal {
  0% {
    clip-path: $reveal-shape-start;
    -webkit-clip-path: $reveal-shape-start;
    filter: blur(12rpx);
    -webkit-filter: blur(12rpx);
  }
  28% {
    clip-path: $reveal-shape-start;
    -webkit-clip-path: $reveal-shape-start;
    filter: blur(6rpx);
    -webkit-filter: blur(6rpx);
  }
  100% {
    clip-path: $reveal-shape-end;
    -webkit-clip-path: $reveal-shape-end;
    filter: blur(0);
    -webkit-filter: blur(0);
  }
}
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
.cover-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(74, 48, 32, 0.34), rgba(120, 74, 54, 0.26));
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
