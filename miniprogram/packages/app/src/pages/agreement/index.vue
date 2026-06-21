<template>
  <view class="agreement-page">
    <NavBar :title="title" show-back variant="solid" />
    <scroll-view class="ag-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
      <view class="ag-body">
        <text class="ag-title">{{ title }}</text>
        <text class="ag-meta">运营方：{{ COMPANY }}　|　生效日期：{{ EFFECTIVE_DATE }}</text>

        <view v-for="(sec, i) in sections" :key="i" class="ag-section">
          <text v-if="sec.h" class="ag-h">{{ sec.h }}</text>
          <text v-for="(p, j) in sec.items" :key="j" class="ag-p">{{ p }}</text>
        </view>

        <text class="ag-foot">如对本{{ shortName }}有任何疑问，可通过小程序内「我的 - 联系客服」或客服电话 {{ SUPPORT_PHONE }} 与我们联系。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { SUPPORT_PHONE } from '@aisock/common/constants'
import NavBar from '@/components/ui/NavBar.vue'
import { USER_AGREEMENT, PRIVACY_POLICY } from './content'

const COMPANY = '浙江阿大互联科技有限公司'
const EFFECTIVE_DATE = '2026年6月15日'

const type = ref<'user' | 'privacy'>('user')
const title = computed(() => (type.value === 'privacy' ? '隐私政策' : '用户协议'))
const shortName = computed(() => (type.value === 'privacy' ? '政策' : '协议'))
const sections = computed(() => (type.value === 'privacy' ? PRIVACY_POLICY : USER_AGREEMENT))

onLoad((q?: Record<string, string>) => {
  if (q?.type === 'privacy') type.value = 'privacy'
})
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.agreement-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $mp-bg;
}
.ag-scroll {
  flex: 1;
  min-height: 0;
}
.ag-body {
  padding: 32rpx 40rpx calc(48rpx + env(safe-area-inset-bottom));
}
.ag-title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
  color: $mp-text-strong;
  font-family: $mp-font-serif;
  text-align: center;
}
.ag-meta {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: $mp-text-muted;
  text-align: center;
}
.ag-section {
  margin-top: 28rpx;
}
.ag-h {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $mp-primary;
  font-family: $mp-font-serif;
  margin-bottom: 10rpx;
}
.ag-p {
  display: block;
  font-size: 26rpx;
  line-height: 1.85;
  color: $mp-text-secondary;
  margin-bottom: 8rpx;
}
.ag-foot {
  display: block;
  margin-top: 40rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid $mp-divider;
  font-size: 24rpx;
  line-height: 1.8;
  color: $mp-text-muted;
}
</style>
