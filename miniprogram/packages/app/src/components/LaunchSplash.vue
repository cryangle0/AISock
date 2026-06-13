<template>
  <view v-if="show" class="splash" :class="{ leaving }" @tap="dismiss">
    <!-- 矿物柔光（静态，似洞窟烛照，不做缩放动画避免真机抖动） -->
    <view class="glow" />

    <!-- 浮金尘：缓慢上浮、柔和不闪灭 -->
    <view class="dust">
      <view v-for="n in 6" :key="n" class="mote" :style="moteStyle(n)" />
    </view>

    <!-- 中央品牌 -->
    <view class="brand">
      <!-- 印玺光环 + 莲花九瓣 -->
      <view class="seal">
        <view class="halo" />
        <view class="lotus">
          <view v-for="n in 9" :key="n" class="petal" :style="petalStyle(n)" />
          <view class="core" />
        </view>
      </view>

      <text class="name">爱花型</text>
      <view class="ornament">
        <view class="line" />
        <view class="diamond" />
        <view class="line" />
      </view>
      <text class="en">AISOCK · 袜版定制</text>
      <text class="poem">一缕花线起，脚尖生诗意</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{ duration?: number }>()
const emit = defineEmits<{ done: [] }>()

const show = ref(true)
const leaving = ref(false)

function dismiss() {
  if (leaving.value) return
  leaving.value = true // 触发淡出 + 上浮
  setTimeout(() => {
    show.value = false
    emit('done')
  }, 640)
}

onMounted(() => {
  setTimeout(dismiss, props.duration ?? 2000)
})

// 浮金尘：错落分布，各自缓慢上浮（长时长 + 稳定不透明，避免闪灭）
function moteStyle(n: number) {
  const left = (n * 61) % 84 + 8
  const top = (n * 43) % 64 + 18
  const size = 5 + (n % 3) * 3
  const delay = (n % 3) * 0.5
  const dur = 6 + (n % 3) * 1.5
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}rpx`,
    height: `${size}rpx`,
    animationDelay: `${delay}s`,
    animationDuration: `${dur}s`,
  }
}

// 莲花九瓣：环形均布
function petalStyle(n: number) {
  return { transform: `rotate(${(n - 1) * 40}deg) translateY(-46rpx)` }
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

/* 根元素自带不透明晨光底色 → 首帧即铺满，不依赖子元素、不露出底层页面（杜绝闪烁） */
.splash {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(180deg, #f3dcae 0%, #d9a777 32%, #a4675a 64%, #6f4334 100%);
  transition: opacity 0.64s ease, transform 0.64s ease;
}
.splash.leaving {
  opacity: 0;
  transform: translateY(-20rpx);
}

/* 静态柔光（无缩放动画） */
.glow {
  position: absolute;
  left: 50%;
  top: 40%;
  width: 680rpx;
  height: 680rpx;
  margin: -340rpx 0 0 -340rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 244, 214, 0.78) 0%, rgba(247, 222, 170, 0.28) 42%, transparent 70%);
}

/* 浮金尘：缓慢上浮，opacity 维持柔和区间（不归零、不闪烁） */
.dust { position: absolute; inset: 0; }
.mote {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 248, 224, 0.9) 0%, rgba(222, 195, 138, 0.45) 60%, transparent 100%);
  opacity: 0.5;
  animation-name: mote-drift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes mote-drift {
  0% { transform: translateY(10rpx); opacity: 0.32; }
  50% { transform: translateY(-14rpx); opacity: 0.62; }
  100% { transform: translateY(10rpx); opacity: 0.32; }
}

/* 中央品牌：入场一次性上浮淡入 */
.brand {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: brand-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes brand-rise {
  from { opacity: 0; transform: translateY(30rpx) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 印玺 + 莲花 */
.seal {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 36rpx;
}
.halo {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 245, 224, 0.5) 0%, rgba(255, 245, 224, 0.08) 55%, transparent 72%);
  /* 仅 opacity 轻微呼吸（无缩放），柔和不抖 */
  animation: halo-breathe 3.4s ease-in-out infinite;
}
@keyframes halo-breathe {
  0%, 100% { opacity: 0.75; }
  50% { opacity: 1; }
}
.lotus {
  position: relative;
  width: 120rpx;
  height: 120rpx;
}
.petal {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 26rpx;
  height: 62rpx;
  margin: -31rpx 0 0 -13rpx;
  border-radius: 50% 50% 50% 50% / 64% 64% 36% 36%;
  background: linear-gradient(180deg, rgba(255, 248, 232, 0.95) 0%, rgba(222, 195, 138, 0.85) 100%);
  transform-origin: 50% 100%;
  box-shadow: 0 0 8rpx rgba(142, 79, 67, 0.18);
}
.core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 44rpx;
  height: 44rpx;
  margin: -22rpx 0 0 -22rpx;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, #fff4dc 0%, #d9a777 60%, #a4675a 100%);
  box-shadow: 0 0 16rpx rgba(255, 240, 210, 0.7);
}

.name {
  font-size: 76rpx;
  font-weight: 700;
  color: #fff8ee;
  font-family: $mp-font-art;
  letter-spacing: 0.14em;
  text-shadow: 0 4rpx 18rpx rgba(86, 44, 30, 0.42);
}
.ornament {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin: 22rpx 0 18rpx;
}
.line {
  width: 64rpx;
  height: 2rpx;
  background: rgba(255, 244, 222, 0.8);
}
.diamond {
  width: 14rpx;
  height: 14rpx;
  border: 2rpx solid rgba(255, 244, 222, 0.9);
  transform: rotate(45deg);
}
.en {
  font-size: 24rpx;
  color: rgba(255, 244, 222, 0.86);
  font-family: $mp-font-serif;
  letter-spacing: 0.28em;
}
.poem {
  margin-top: 30rpx;
  font-size: 28rpx;
  color: #fff3e0;
  font-family: $mp-font-serif;
  letter-spacing: 0.12em;
  opacity: 0;
  animation: poem-in 1s ease 0.5s forwards;
}
@keyframes poem-in {
  from { opacity: 0; transform: translateY(12rpx); }
  to { opacity: 0.96; transform: translateY(0); }
}
</style>
