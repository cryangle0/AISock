<template>
  <view class="banner" @tap="$emit('tap')">
    <view class="banner-left">
      <view class="banner-cn">敦<text class="banner-br" />煌<text class="banner-br" />梦</view>
      <view class="banner-en">DUN HUANG DREAM</view>
    </view>
    <text class="banner-tag">千年壁画艺术之旅</text>
    <!-- 飞天/飘带 装饰 -->
    <view class="banner-art">
      <view class="art-glow" />
      <view class="art-ribbon" />
      <view class="art-dot" />
    </view>
    <text class="banner-stamp">岁岁年年</text>
  </view>
</template>

<script setup lang="ts">
defineEmits<{ tap: [] }>()
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.banner {
  position: relative;
  margin: 0 32rpx;
  height: 220rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #f5ebd7 0%, #e5d4b5 100%);
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(43, 31, 20, 0.15);
}
.banner-left {
  position: relative;
  z-index: 2;
  padding: 28rpx 32rpx;
}
.banner-cn {
  font-size: 48rpx;
  font-weight: 800;
  color: #2b1f14;
  letter-spacing: 0.12em;
  line-height: 1.08;
  font-family: $mp-font-art;
}
.banner-br {
  display: block;
  height: 0;
}
.banner-en {
  margin-top: 10rpx;
  font-size: 16rpx;
  font-weight: 600;
  color: rgba(43, 31, 20, 0.55);
  letter-spacing: 0.18em;
}
.banner-tag {
  position: absolute;
  top: 32rpx;
  left: 170rpx;
  font-size: 20rpx;
  color: rgba(43, 31, 20, 0.7);
  letter-spacing: 0.06em;
  z-index: 2;
}
.banner-art {
  position: absolute;
  right: 0;
  top: 0;
  width: 70%;
  height: 100%;
  z-index: 1;
}
.art-glow {
  position: absolute;
  right: 40rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 220rpx;
  height: 180rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(168, 196, 176, 0.55) 0%, rgba(90, 138, 125, 0.28) 55%, transparent 100%);
}
.art-ribbon {
  position: absolute;
  right: 60rpx;
  top: 60rpx;
  width: 160rpx;
  height: 120rpx;
  border: 3rpx solid rgba(140, 90, 60, 0.45);
  border-radius: 0 80rpx 0 80rpx;
  transform: rotate(-12deg);
}
.art-dot {
  position: absolute;
  right: 130rpx;
  top: 78rpx;
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: rgba(90, 138, 125, 0.6);
}
.banner-stamp {
  position: absolute;
  bottom: 16rpx;
  right: 28rpx;
  font-size: 18rpx;
  color: #c5483c;
  font-weight: 600;
  letter-spacing: 0.1em;
  background: rgba(255, 245, 230, 0.5);
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
  z-index: 2;
}
</style>
