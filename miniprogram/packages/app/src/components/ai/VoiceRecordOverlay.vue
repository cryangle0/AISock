<template>
  <view v-if="visible" class="vro" :class="{ canceling: willCancel }">
    <view class="vro-backdrop" />

    <view class="vro-stage">
      <!-- 声纹法相：同心涟漪 + 暖金核心（敦煌矿物光晕） -->
      <view class="orb-wrap">
        <view class="ring ring1" />
        <view class="ring ring2" />
        <view class="ring ring3" />
        <view class="orb">
          <!-- 录音态：麦克风 / 取消态：✕ -->
          <view v-if="!willCancel" class="mic">
            <view class="mic-cap" />
            <view class="mic-stem" />
            <view class="mic-base" />
          </view>
          <text v-else class="cancel-x">✕</text>
        </view>
      </view>

      <!-- 声波律动 -->
      <view class="wave" :class="{ dim: willCancel }">
        <view v-for="n in 15" :key="n" class="bar" :style="{ animationDelay: barDelay(n) }" />
      </view>

      <!-- 状态文案 + 计时 -->
      <text class="status">{{ willCancel ? '松开手指 · 取消输入' : '正在聆听你的心意…' }}</text>
      <text class="timer">{{ timeText }}</text>
    </view>

    <!-- 底部提示胶囊 -->
    <view class="vro-hint">
      <text>{{ willCancel ? '手指上滑已进入取消区' : '松开发送 · 上滑取消' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  /** 已录制秒数 */
  elapsed?: number
  /** 是否处于「上滑取消」态 */
  willCancel?: boolean
}>()

const timeText = computed(() => {
  const s = Math.max(0, Math.floor(props.elapsed || 0))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

// 声波各柱错峰，营造自然起伏
function barDelay(n: number) {
  return `${((n * 97) % 11) * 0.06}s`
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.vro {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: vro-in 0.22s ease;
}
@keyframes vro-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.vro-backdrop {
  position: absolute;
  inset: 0;
  /* 暖棕夜色 + 中心微亮（似洞窟壁画前的烛照） */
  background:
    radial-gradient(120% 80% at 50% 38%, rgba(120, 74, 54, 0.42) 0%, rgba(36, 26, 20, 0.82) 62%, rgba(28, 20, 15, 0.92) 100%);
  backdrop-filter: blur(2px);
}

.vro-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── 声纹法相 ── */
.orb-wrap {
  position: relative;
  width: 360rpx;
  height: 360rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 160rpx;
  height: 160rpx;
  margin: -80rpx 0 0 -80rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(222, 195, 138, 0.55);
  opacity: 0;
  animation: ring-spread 2.4s ease-out infinite;
}
.ring2 { animation-delay: 0.8s; }
.ring3 { animation-delay: 1.6s; }
@keyframes ring-spread {
  0% { transform: scale(0.5); opacity: 0; }
  18% { opacity: 0.85; }
  100% { transform: scale(2.1); opacity: 0; }
}
.orb {
  position: relative;
  width: 168rpx;
  height: 168rpx;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, #f1d9a8 0%, #c89a5e 46%, #8e4f43 100%);
  box-shadow:
    0 0 48rpx rgba(222, 195, 138, 0.6),
    inset 0 4rpx 16rpx rgba(255, 245, 224, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: orb-breath 2s ease-in-out infinite;
}
@keyframes orb-breath {
  0%, 100% { transform: scale(1); box-shadow: 0 0 40rpx rgba(222, 195, 138, 0.5), inset 0 4rpx 16rpx rgba(255, 245, 224, 0.4); }
  50% { transform: scale(1.06); box-shadow: 0 0 64rpx rgba(222, 195, 138, 0.78), inset 0 4rpx 16rpx rgba(255, 245, 224, 0.5); }
}
.canceling .orb {
  background: radial-gradient(circle at 50% 38%, #e7a99c 0%, #c5483c 55%, #8e3327 100%);
  box-shadow: 0 0 48rpx rgba(197, 72, 60, 0.6);
  animation: none;
}
.canceling .ring { animation: none; opacity: 0; }

/* CSS 麦克风 */
.mic {
  position: relative;
  width: 64rpx;
  height: 92rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mic-cap {
  width: 40rpx;
  height: 58rpx;
  border-radius: 20rpx;
  background: #fff8ee;
}
.mic-stem {
  width: 6rpx;
  height: 16rpx;
  background: #fff8ee;
  margin-top: 4rpx;
}
.mic-base {
  width: 40rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: #fff8ee;
}
.cancel-x {
  font-size: 64rpx;
  color: #fff5ef;
  font-weight: 300;
  line-height: 1;
}

/* ── 声波律动 ── */
.wave {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  height: 88rpx;
  margin-top: 56rpx;
  transition: opacity 0.2s ease;
}
.wave.dim { opacity: 0.25; }
.bar {
  width: 8rpx;
  height: 24rpx;
  border-radius: 6rpx;
  background: linear-gradient(180deg, #f1d9a8 0%, #c89a5e 100%);
  animation: wave-beat 0.9s ease-in-out infinite;
}
@keyframes wave-beat {
  0%, 100% { transform: scaleY(0.35); opacity: 0.65; }
  50% { transform: scaleY(1.8); opacity: 1; }
}

.status {
  margin-top: 40rpx;
  font-size: 30rpx;
  color: #fdf3e2;
  font-family: $mp-font-serif;
  letter-spacing: 0.04em;
}
.canceling .status { color: #ffd9d2; }
.timer {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: rgba(253, 243, 226, 0.72);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

/* ── 底部提示 ── */
.vro-hint {
  position: absolute;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  padding: 14rpx 36rpx;
  border-radius: $mp-radius-pill;
  background: rgba(253, 243, 226, 0.14);
  border: 1rpx solid rgba(222, 195, 138, 0.32);
}
.vro-hint text {
  font-size: 24rpx;
  color: #fdf3e2;
  font-family: $mp-font-serif;
}
.canceling .vro-hint {
  background: rgba(197, 72, 60, 0.22);
  border-color: rgba(231, 169, 156, 0.5);
}
</style>
