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
        <!-- 1. Banner：后台「Banner 管理」可配多张轮播；未配置回退固定主视觉 -->
        <swiper
          v-if="banners.length"
          class="banner-swiper"
          :circular="true"
          :autoplay="true"
          :interval="4000"
          :duration="500"
          indicator-dots
          indicator-active-color="#8e4f43"
          indicator-color="rgba(255,255,255,0.45)"
        >
          <swiper-item v-for="b in banners" :key="b.id" @tap="onBanner(b)">
            <image class="banner-img" :src="b.image_url" mode="aspectFill" />
          </swiper-item>
        </swiper>
        <HomeBanner v-else :item="heroBanner" @tap="onHero" />

        <!-- 3. 主题随心订 -->
        <view class="section">
          <view class="section-head">
            <text class="section-title">主题随心订</text>
          </view>
          <view class="themes-grid">
            <ThemeCard v-for="t in themes" :key="t.id" :theme="t" @tap="onTheme" />
          </view>
        </view>

        <!-- 4. 袜版设计预设（3D 横滑，主题卡可联动切换到对应案例） -->
        <view class="section section--carousel">
          <ShowcaseCarousel
            v-if="featured.length"
            :items="featured"
            :active-index="activeCaseIndex"
            :reveal-ready="carouselReady"
            @active-change="activeCaseIndex = $event"
            @select="onFeatured"
          />
          <view v-else class="carousel-empty">当前主题暂无轮播图，请在后台「小程序配置」添加对应轮播图</view>
        </view>

        <!-- 5. 资讯中心：已按需求下线（首页不再展示咨询/资讯中心） -->
      </view>
    </scroll-view>

    <custom-tab-bar current="home" />

    <!-- 诗意启动页（冷启动仅首次，敦煌晨光主题，自动淡出） -->
    <LaunchSplash v-if="showSplash" @done="showSplash = false" />
  </view>
</template>

<script lang="ts">
// 模块级标记：整个小程序进程仅冷启动首次展示启动页（tab 切换/返回首页不再重现）
let splashShown = false
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { switchTab, navigateTo } from '@aisock/common/utils'
import { catalogApi, type ConfigItem, type Banner } from '@aisock/service'
import { stashCaseDetail } from '@/domain/catalog'
import NavBar from '@/components/ui/NavBar.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import LaunchSplash from '@/components/LaunchSplash.vue'
import HomeBanner from '@/components/home/HomeBanner.vue'
import ThemeCard from '@/components/home/ThemeCard.vue'
import ShowcaseCarousel from '@/components/home/ShowcaseCarousel.vue'
import { cdnImg } from '@/config/cdn'

// 启动页仅本次小程序进程冷启动展示一次：模块级标记，tab 来回切换不再重现
const showSplash = ref(!splashShown)
splashShown = true

// 轮播渐清晰特效：等启动页消失（首页真正可见）后再播，避免加载/启动页期间空放看不到
const carouselReady = computed(() => !showSplash.value)

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
  { id: 'd1', title: '敦煌九色鹿', cover: cdnImg('/static/images/showcase.webp'), link: '/pkg/detail/index', themeKey: 'dunhuang', mainColor: '#C8B89A', accent: '#8E4F43' },
  { id: 'd2', title: '飞天乐舞', cover: cdnImg('/static/images/showcase.webp'), link: '/pkg/detail/index', themeKey: 'wenchuang', mainColor: '#A8C4B0', accent: '#5a8a7d' },
  { id: 'd3', title: '千手观音', cover: cdnImg('/static/images/showcase.webp'), link: '/pkg/detail/index', themeKey: 'jieqi', mainColor: '#D6A87A', accent: '#A05A3C' },
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
const showcasePool = ref<ConfigItem[]>([...FALLBACK_CASES])
const fallbackCases = ref<ConfigItem[]>([...FALLBACK_CASES])
const activeThemeId = ref('')
const activeCaseIndex = ref(featured.value.length > 1 ? 1 : 0)
const defaultCaseCover = cdnImg('/static/images/showcase.webp')
// 后台可配（空则隐藏/回退）：Banner 轮播
const banners = ref<Banner[]>([])
let themeInitialized = false

function normalizeKey(value: unknown): string {
  return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function themeKeys(theme?: ConfigItem | null): string[] {
  if (!theme) return []
  return [theme.id, theme.title, theme.en, theme.themeKey]
    .map(normalizeKey)
    .filter(Boolean)
}

function showcaseKeys(item: ConfigItem): string[] {
  return [item.themeKey, item.themeId, item.themeName, item.themeCode, item.title]
    .map(normalizeKey)
    .filter(Boolean)
}

function matchesTheme(item: ConfigItem, theme: ConfigItem): boolean {
  const keys = themeKeys(theme)
  if (!keys.length) return false
  const itemKeys = showcaseKeys(item)
  return keys.some((key) => itemKeys.includes(key))
}

function activeTheme(): ConfigItem | null {
  return themes.value.find((item) => normalizeKey(item.id) === normalizeKey(activeThemeId.value)) || themes.value[0] || null
}

function applyThemeShowcases(theme: ConfigItem | null) {
  const source = showcasePool.value.length ? showcasePool.value : fallbackCases.value
  featured.value = theme ? source.filter((item) => matchesTheme(item, theme)) : []
  activeCaseIndex.value = 0
}

// Hero banner：固定主视觉大图，标题随主题联动
const heroBanner = computed<ConfigItem>(() => ({
  id: 'hero',
  title: (themes.value[1]?.title as string) || '敦煌入梦',
  en: 'DUN HUANG DREAM',
  cover: cdnImg('/static/images/hero-dunhuang.webp'),
}))

async function loadHomeConfig() {
  try {
    // 一次聚合拉取：Banner + 主题 + 功能区 + 案例（后台均可配，空则用兜底/隐藏）
    const res = await catalogApi.getHome()
    const d = res.data || ({} as Partial<typeof res.data>)
    // 仅展示已配图片的 Banner（演示/未填图的不渲染破图，回退固定 hero）
    banners.value = (Array.isArray(d.banners) ? d.banners : []).filter((b) => !!b.image_url)
    if (d.themes?.length) themes.value = mergeCover(d.themes, FALLBACK_THEMES, '/static/images/theme-dunhuang.png')
    fallbackCases.value = d.cases?.length ? mergeCover(d.cases, FALLBACK_CASES, defaultCaseCover) : [...FALLBACK_CASES]
    showcasePool.value = fallbackCases.value
    if (!themeInitialized || !themes.value.some((item) => normalizeKey(item.id) === normalizeKey(activeThemeId.value))) {
      activeThemeId.value = String(themes.value[0]?.id || '')
      themeInitialized = true
    }
    applyThemeShowcases(activeTheme())
  } catch {
    /* 保留本地兜底 */
    applyThemeShowcases(activeTheme())
  }
}

onShow(() => {
  loadHomeConfig()
})

// pages.json 开了 enablePullDownRefresh，必须收回动画，否则下拉后一直转圈
onPullDownRefresh(async () => {
  await loadHomeConfig()
  uni.stopPullDownRefresh()
})

const TAB_PATHS = new Set([
  '/pages/home/index', '/pages/feed/index', '/pages/ai/index', '/pages/cart/index', '/pages/mine/index',
])
function go(link?: string | null) {
  if (!link) return
  if (TAB_PATHS.has(link)) switchTab(link)
  else navigateTo(link)
}
const onHero = () => switchTab('/pages/feed/index')
const onBanner = (b: Banner) => go(b.link)
/** 主题随心订：点击后只展示该主题后台配置的轮播记录 */
const onTheme = (t: ConfigItem) => {
  activeThemeId.value = String(t.id || '')
  themeInitialized = true
  applyThemeShowcases(t)
}
function stringField(item: ConfigItem, key: string): string {
  const value = item[key]
  return typeof value === 'string' ? value : ''
}
function stringList(item: ConfigItem, key: string): string[] {
  const value = item[key]
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && !!v.trim()) : []
}

/** 点击首页底部轮播卡：进入对应详情页（与浏览页详情同款），按该轮播的后台详情配置渲染 */
const onFeatured = (d: ConfigItem) => {
  const cover =
    stringField(d, 'cover') ||
    stringField(d, 'printImage') ||
    stringField(d, 'feedCover') ||
    stringField(d, 'image_url') ||
    stringField(d, 'imageUrl')
  const slides = stringList(d, 'detailSlides')
  stashCaseDetail({
    navTitle: stringField(d, 'title'),
    seriesTitle: stringField(d, 'detailTitle') || stringField(d, 'title'),
    description: stringField(d, 'detailDescription'),
    cover,
    slides: slides.length ? slides : cover ? [cover] : [],
    gallery: stringList(d, 'detailGallery'),
  })
  navigateTo('/pkg/detail/index')
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.home {
  height: 100vh;
  /* 顶部暖棕渐变向下延伸，包裹住下方 banner 后再柔和过渡到米色页底
     （banner 底约在 ~500rpx：导航栏~176 + 留白24 + banner 300，故渐变拉到 ~560rpx 之后才透明） */
  background:
    linear-gradient(180deg, #a4675a 0%, #b07c6c 22%, rgba(176, 124, 108, 0.5) 430rpx, rgba(176, 124, 108, 0) 560rpx),
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
.carousel-empty {
  min-height: 360rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32rpx;
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.54);
  color: $mp-text-muted;
  font-size: 24rpx;
  font-family: $mp-font-serif;
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

/* Banner 轮播（后台可配） */
.banner-swiper {
  width: 100%;
  height: 300rpx;
  border-radius: $mp-radius-lg;
  overflow: hidden;
  box-shadow: $mp-shadow-card;
}
.banner-img {
  width: 100%;
  height: 100%;
}

/* 资讯中心（后台可配，封面可有可无均整齐） */
.news-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.news-card {
  display: flex;
  align-items: center;
  background: $mp-bg-card;
  border-radius: $mp-radius-md;
  overflow: hidden;
  box-shadow: $mp-shadow-sm;
}
.news-cover {
  width: 168rpx;
  height: 126rpx;
  flex-shrink: 0;
  background: $mp-bg-inset;
}
.news-body {
  flex: 1;
  min-width: 0;
  /* 始终四周内边距：无封面时文字也不贴边、有封面时与封面留白 */
  padding: 22rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.news-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.news-title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: $mp-text-primary;
  font-family: $mp-font-serif;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.news-tag {
  flex-shrink: 0;
  font-size: 20rpx;
  color: $mp-primary;
  background: $mp-primary-soft;
  padding: 4rpx 16rpx;
  border-radius: $mp-radius-pill;
}
.news-summary {
  font-size: 24rpx;
  color: $mp-text-muted;
  line-height: 1.5;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
