<template>
  <view class="home">
    <scroll-view
      class="home-scroll"
      scroll-y
      :enhanced="true"
      :show-scrollbar="false"
    >
      <!-- 1. 棕色品牌带：品牌行 + 敦煌梦 banner -->
      <view class="brand-band" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="brand-row">
          <image class="brand-logo" src="/static/logo.png" mode="aspectFit" />
          <text class="brand">爱花型 · 袜稿设计</text>
        </view>
        <HomeBanner @tap="goFeed" />
      </view>

      <!-- 2. 主题随心订 -->
      <view class="section">
        <view class="section-head">
          <text class="section-title">主题随心订</text>
          <text class="section-en">Select theme</text>
          <text class="section-music">♪♪♪</text>
        </view>
        <view class="themes-grid">
          <ThemeCard v-for="t in themes" :key="t.id" :theme="t" @tap="onTheme" />
        </view>
      </view>

      <!-- 3. 大画展示（3D 横滑 carousel） -->
      <view class="section">
        <view class="section-head">
          <text class="section-title">袜版设计预设</text>
          <text class="section-en">Featured</text>
        </view>
        <ShowcaseCarousel :items="featured" @select="onFeatured" />
      </view>
    </scroll-view>

    <custom-tab-bar current="home" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { switchTab, navigateTo } from '@aisock/common/utils'
import { configApi, type ConfigItem } from '@aisock/service'
import CustomTabBar from '@/components/CustomTabBar.vue'
import HomeBanner from '@/components/home/HomeBanner.vue'
import ThemeCard from '@/components/home/ThemeCard.vue'
import ShowcaseCarousel from '@/components/home/ShowcaseCarousel.vue'

// 自定义导航栏：顶部留出状态栏高度，避免品牌带被状态栏/胶囊按钮遮挡
const statusBarHeight = ref(20)
try {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
} catch {
  /* 取不到时用默认 20 */
}

// 默认配置（接口无数据时兜底，保证首屏永不空白）
const themes = ref<ConfigItem[]>([
  { id: 'jieqi', title: '二十四节气', en: 'JIE QI', bg: 'linear-gradient(135deg,#E8D5B8,#D4C09A)', decoColor: '#5a8a7d' },
  { id: 'dunhuang', title: '敦煌入梦', en: 'DUN HUANG', bg: 'linear-gradient(135deg,#C9B89A,#B5A085)', decoColor: '#8C5A3C' },
  { id: 'wenchuang', title: '文创物语', en: 'WEN CHUANG', bg: 'linear-gradient(135deg,#DEC38A,#C7A66E)', decoColor: '#3a6fa3' },
])
const featured = ref<ConfigItem[]>([
  { id: 'd1', title: '敦煌九色鹿', mainColor: '#C8B89A', accent: '#8C5A3C' },
  { id: 'd2', title: '飞天乐舞', mainColor: '#A8C4B0', accent: '#5a8a7d' },
  { id: 'd3', title: '千手观音', mainColor: '#D6A87A', accent: '#A05A3C' },
])

onShow(async () => {
  try {
    const res = await configApi.getHomeConfig()
    const { themes: t, cases: c } = res.data || {}
    if (t?.length) themes.value = t
    if (c?.length) featured.value = c
  } catch {
    /* 保留兜底 */
  }
})

const TAB_PATHS = new Set([
  '/pages/home/index', '/pages/feed/index', '/pages/editor/index', '/pages/cart/index', '/pages/mine/index',
])
function go(link?: string) {
  if (!link) return
  if (TAB_PATHS.has(link)) switchTab(link)
  else navigateTo(link)
}
const goFeed = () => switchTab('/pages/feed/index')
const onTheme = (t: ConfigItem) => go(t.link || '/pages/feed/index')
const onFeatured = (d: ConfigItem) => go((d.link as string) || '/pages/editor/index')
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.home {
  height: 100vh;
  background: $mp-bg;
}
.home-scroll {
  height: 100vh;
  box-sizing: border-box;
  padding-bottom: 160rpx;
}

/* 棕色品牌带 */
.brand-band {
  background: #946c5f;
  padding: 0 0 28rpx;
}
.brand-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 36rpx 20rpx;
}
.brand-logo {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: rgba(255, 252, 246, 0.92);
  padding: 4rpx;
  box-sizing: border-box;
  flex-shrink: 0;
}
.brand {
  font-size: 30rpx;
  font-weight: 700;
  color: #fffcf6;
  letter-spacing: 0.04em;
  font-family: $mp-font-art;
}
.section {
  padding: 28rpx 32rpx 0;
}
.section-head {
  display: flex;
  align-items: baseline;
  gap: 14rpx;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 800;
  color: $mp-text-primary;
  letter-spacing: 0.04em;
  font-family: $mp-font-art;
}
.section-en {
  font-size: 22rpx;
  font-weight: 600;
  color: $mp-text-secondary;
}
.section-music {
  margin-left: auto;
  font-size: 22rpx;
  color: $mp-text-muted;
  letter-spacing: 2rpx;
}
.themes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}
</style>
