<template>
  <view v-if="open" class="sheet-mask" @tap="onMaskTap">
    <view :class="['sheet', `sheet-${size}`]" @tap.stop>
      <view class="sheet-head">
        <view class="sheet-titles">
          <text class="sheet-title">{{ title }}</text>
          <text v-if="subtitle" class="sheet-sub">{{ subtitle }}</text>
        </view>
        <view v-if="closable" class="sheet-close" @tap="$emit('close')">✕</view>
      </view>
      <scroll-view scroll-y class="sheet-body">
        <slot />
      </scroll-view>
      <view v-if="$slots.footer" class="sheet-foot">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ open?: boolean; title?: string; subtitle?: string; size?: 'auto' | 'tall'; closable?: boolean }>(),
  { open: true, size: 'auto', closable: true },
)
const emit = defineEmits<{ close: [] }>()

function onMaskTap() {
  if (props.closable) emit('close')
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(43, 31, 20, 0.45);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: $mp-bg-card;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  animation: sheet-up 0.25s ease;
}
.sheet-tall {
  height: 85vh;
}
@keyframes sheet-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28rpx 32rpx 16rpx;
  border-bottom: 1rpx solid $mp-divider;
}
.sheet-title {
  font-size: 30rpx;
  font-weight: 700;
  color: $mp-text-primary;
}
.sheet-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $mp-text-muted;
}
.sheet-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: $mp-text-muted;
}
.sheet-body {
  flex: 1;
  width: 100%;
  padding: 24rpx 32rpx;
  min-height: 0;
  box-sizing: border-box;
}
.sheet-foot {
  padding: 16rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $mp-divider;
}
</style>
