<template>
  <view class="home">
    <!-- 顶部品牌带（暖棕渐变 + 状态栏 + 品牌大字） -->
    <NavBar brand title="爱花型" variant="transparent" />

    <scroll-view
      class="home-scroll"
      scroll-y
      :enhanced="true"
      :show-scrollbar="false"
    >
      <view class="home-body">
        <!-- 1. Hero 主题大图 banner -->
        <HomeBanner :item="heroBanner" @tap="onHero" />

        <!-- 2. 主题随心订 -->
        <view class="section">
          <view class="section-head">
            <text class="section-title">主题随心订</text>
          </view>
          <view class="themes-grid">
            <ThemeCard v-for="t in themes" :key="t.id" :theme="t" @tap="onTheme" />
          </view>
        </view>

        <!-- 3. 袜版设计预设（3D 横滑，无标题，紧随主题卡） -->
        <view class="section section--carousel">
          <ShowcaseCarousel :items="featured" @select="onFeatured" />
        </view>
      </view>
    </scroll-view>

    <custom-tab-bar current="home" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { switchTab, navigateTo } from '@aisock/common/utils'
import { configApi, type ConfigItem } from '@aisock/service'
import NavBar from '@/components/ui/NavBar.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import HomeBanner from '@/components/home/HomeBanner.vue'
import ThemeCard from '@/components/home/ThemeCard.vue'
import ShowcaseCarousel from '@/components/home/ShowcaseCarousel.vue'

/**
 * 首页运营配置（主题随心订 / 案例 carousel）。
 * 后台默认数据只含标题+渐变、不含封面图；直接套用会让卡片退化成 CSS 占位。
 * 故用本地设计兜底图回填后台缺失的 cover：运营上传了用运营的，没上传保留设计真实图，
 * 内容永不退化为占位图。失败/超时保留本地兜底，首屏永不空白。
 */
const FALLBACK_THEMES: ConfigItem[] = [
  { id: 'jieqi', title: '二十四节气', en: 'JIE QI', cover: '/static/images/theme-jieqi.png', bg: 'linear-gradient(135deg,#E8D5B8,#D4C09A)', decoColor: '#5a8a7d' },
  { id: 'dunhuang', title: '敦煌入梦', en: 'DUN HUANG', cover: '/static/images/theme-dunhuang.png', bg: 'linear-gradient(135deg,#C9B89A,#B5A085)', decoColor: '#8E4F43' },
  { id: 'wenchuang', title: '文创物语', en: 'WEN CHUANG', cover: '/static/images/theme-wenchuang.png', bg: 'linear-gradient(135deg,#9BB8CC,#5F93C2)', decoColor: '#3a6fa3' },
]
const FALLBACK_CASES: ConfigItem[] = [
  { id: 'd1', title: '敦煌九色鹿', cover: '/static/images/showcase.jpg', mainColor: '#C8B89A', accent: '#8E4F43' },
  { id: 'd2', title: '飞天乐舞', cover: '/static/images/showcase.jpg', mainColor: '#A8C4B0', accent: '#5a8a7d' },
  { id: 'd3', title: '千手观音', cover: '/static/images/showcase.jpg', mainColor: '#D6A87A', accent: '#A05A3C' },
]

/** 用本地兜底封面回填后台项缺失的 cover：先按 id 匹配，再按位置，最后默认图 */
function mergeCover(items: ConfigItem[], fallbacks: ConfigItem[], defaultCover: string): ConfigItem[] {
  return items.map((it, i) => {
    if (it.cover) return it
    const match = fallbacks.find((f) => f.id === it.id) ?? fallbacks[i]
    return { ...it, cover: (match?.cover as string) || defaultCover }
  })
}

const themes = ref<ConfigItem[]>([...FALLBACK_THEMES])
const featured = ref<ConfigItem[]>([...FALLBACK_CASES])

// Hero banner：固定主视觉大图，标题随主题联动
const heroBanner = computed<ConfigItem>(() => ({
  id: 'hero',
  title: (themes.value[1]?.title as string) || '敦煌入梦',
  en: 'DUN HUANG DREAM',
  cover: '/static/images/hero-dunhuang.jpg',
}))

onShow(async () => {
  try {
    const res = await configApi.getHomeConfig()
    const { themes: t, cases: c } = res.data || {}
    if (t?.length) themes.value = mergeCover(t, FALLBACK_THEMES, '/static/images/theme-dunhuang.png')
    if (c?.length) featured.value = mergeCover(c, FALLBACK_CASES, '/static/images/showcase.jpg')
  } catch {
    /* 保留本地兜底 */
  }
})

const TAB_PATHS = new Set([
  '/pages/home/index', '/pages/feed/index', '/pages/ai/index', '/pages/cart/index', '/pages/mine/index',
])
function go(link?: string) {
  if (!link) return
  if (TAB_PATHS.has(link)) switchTab(link)
  else navigateTo(link)
}
const onHero = () => switchTab('/pages/feed/index')
const onTheme = (t: ConfigItem) => go(t.link || '/pages/feed/index')
const onFeatured = (d: ConfigItem) => go((d.link as string) || '/pages/editor/index')
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.home {
  height: 100vh;
  /* 顶部暖棕渐变向下延伸、柔和过渡到米色页底（对齐 Figma：Frame 15 ~246px 线性渐变） */
  background:
    linear-gradient(180deg, #a4675a 0%, #b07c6c 14%, rgba(176, 124, 108, 0) 470rpx),
    $mp-bg;
  display: flex;
  flex-direction: column;
}
.home-scroll {
  flex: 1;
  min-height: 0;
}
.home-body {
  padding: 24rpx 40rpx calc(180rpx + env(safe-area-inset-bottom));
}
.section {
  margin-top: 36rpx;
}
.section--carousel {
  margin-top: 16rpx;
}
.section-head {
  display: flex;
  align-items: baseline;
  gap: 14rpx;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $mp-text-primary;
  letter-spacing: 0.02em;
  font-family: $mp-font-serif;
}
.themes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}
</style>
