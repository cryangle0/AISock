<template>
  <view v-if="show" class="splash" :class="{ leaving }" @tap="dismiss">
    <!-- 敦煌晨光底：暖棕夜色向沙金天光过渡 -->
    <view class="sky" />
    <!-- 矿物光晕（似洞窟烛照） -->
    <view class="glow" />

    <!-- 浮金尘（敦煌壁画的剥落金箔感） -->
    <view class="dust">
      <view v-for="n in 9" :key="n" class="mote" :style="moteStyle(n)" />
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
  }, 620)
}

onMounted(() => {
  setTimeout(dismiss, props.duration ?? 1900)
})

// 浮金尘：错落分布、各自飘浮
function moteStyle(n: number) {
  const left = (n * 37) % 92 + 4
  const top = (n * 53) % 80 + 8
  const size = 4 + (n % 3) * 3
  const delay = (n % 5) * 0.4
  const dur = 3.4 + (n % 4) * 0.7
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

.splash {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.splash.leaving {
  opacity: 0;
  transform: translateY(-24rpx);
}

/* 晨光天幕：上沙金、下暖棕，模拟敦煌日出 */
.sky {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, #f3dcae 0%, #d9a777 32%, #a4675a 64%, #6f4334 100%);
}
.glow {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 760rpx;
  height: 760rpx;
  margin: -380rpx 0 0 -380rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 244, 214, 0.85) 0%, rgba(247, 222, 170, 0.32) 40%, transparent 70%);
  animation: glow-breathe 3.2s ease-in-out infinite;
}
@keyframes glow-breathe {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

/* 浮金尘 */
.dust { position: absolute; inset: 0; }
.mote {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 248, 224, 0.95) 0%, rgba(222, 195, 138, 0.5) 60%, transparent 100%);
  opacity: 0;
  animation-name: mote-float;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes mote-float {
  0% { opacity: 0; transform: translateY(16rpx); }
  30% { opacity: 0.9; }
  70% { opacity: 0.7; }
  100% { opacity: 0; transform: translateY(-40rpx); }
}

/* 中央品牌 */
.brand {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: brand-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes brand-rise {
  from { opacity: 0; transform: translateY(32rpx) scale(0.96); }
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
  background: radial-gradient(circle, rgba(255, 245, 224, 0.55) 0%, rgba(255, 245, 224, 0.08) 55%, transparent 72%);
  box-shadow: 0 0 60rpx rgba(255, 240, 210, 0.6);
  animation: glow-breathe 3.2s ease-in-out infinite;
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
