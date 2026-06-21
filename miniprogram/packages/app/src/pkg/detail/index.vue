<template>
  <view class="detail">
    <!-- 头部：纯棕标题栏（对齐 Figma） -->
    <NavBar :title="navTitle" show-back variant="solid" />

    <scroll-view class="detail-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
      <view class="detail-body">
        <SectionTitle :title="seriesTitle" color="#8e4f43" :line-width="72" />

        <!-- 主商品卡 -->
        <view class="hero-card">
          <view class="hero-card-img" :style="{ background: heroBg }">
            <image v-if="slideImages[slide]" class="cover" :src="slideImages[slide]" mode="aspectFill" />
          </view>
          <view class="dots">
            <view
              v-for="(_, i) in slideImages"
              :key="i"
              :class="['dot', { active: i === slide }]"
              @tap="slide = i"
            />
          </view>
        </view>

        <!-- 描述 + 设计展示 -->
        <view class="info-card">
          <view class="desc-box">
            <text class="desc-text">{{ description }}</text>
          </view>

          <view class="design-grid">
            <SectionTitle title="设计展示" subtitle="原创设计 · 精准织造" color="#b8895a" :line-width="52" />
            <view class="grid">
              <view v-if="gridImages[0]" class="grid-item"><image class="grid-img" :src="gridImages[0]" mode="aspectFill" /></view>
              <view v-if="gridImages[1]" class="grid-item tall"><image class="grid-img" :src="gridImages[1]" mode="aspectFill" /></view>
              <view v-if="gridImages[2]" class="grid-item"><image class="grid-img" :src="gridImages[2]" mode="aspectFill" /></view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view class="act-btn ghost" @tap="onBuy">立即购买</view>
      <view class="act-btn solid" @tap="onCustomize">定制设计</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { navigateTo } from '@aisock/common/utils'
import type { Pattern } from '@aisock/common/types'
import { catalogApi } from '@aisock/service'
import { purchaseRoute, stashCustomizeCover, takeCaseDetail } from '@/domain/catalog'
import NavBar from '@/components/ui/NavBar.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { cdnImg } from '@/config/cdn'

const DEFAULT_DETAIL = {
  navTitle: '袜版定制 · 杭城',
  seriesTitle: '杭城袜韵',
  description: '将杭州城市文化融入袜品设计\n舒适与美学兼具\n传递城市温度与品质生活',
  cover: cdnImg('/pkg/static/detail/hangzhou-hero.webp'),
  slides: [
    cdnImg('/pkg/static/detail/hangzhou-hero.webp'),
    cdnImg('/pkg/static/detail/hangzhou-hero.webp'),
    cdnImg('/pkg/static/detail/hangzhou-hero.webp'),
    cdnImg('/pkg/static/detail/hangzhou-hero.webp'),
  ],
  gallery: [
    cdnImg('/pkg/static/detail/hangzhou-1.webp'),
    cdnImg('/pkg/static/detail/hangzhou-2.webp'),
    cdnImg('/pkg/static/detail/hangzhou-3.webp'),
  ],
}

const navTitle = ref(DEFAULT_DETAIL.navTitle)
const seriesTitle = ref(DEFAULT_DETAIL.seriesTitle)
const description = ref(DEFAULT_DETAIL.description)
const cover = ref(DEFAULT_DETAIL.cover)
const slideImages = ref<string[]>([...DEFAULT_DETAIL.slides])
const gridImages = ref<string[]>([...DEFAULT_DETAIL.gallery])
const slide = ref(0)
const heroBg = 'linear-gradient(160deg,#d8c4a6 0%,#a4675a 100%)'

const patternId = ref<number | undefined>(undefined)

function resolveCfgImg(url: string, fallback: string): string {
  const u = url?.trim()
  if (!u) return fallback
  if (/^https?:/i.test(u)) return u
  if (u.startsWith('/static/') || u.startsWith('/pkg/')) return cdnImg(u)
  return u
}

function applyDetailConfig(detail: typeof DEFAULT_DETAIL) {
  navTitle.value = detail.navTitle || DEFAULT_DETAIL.navTitle
  seriesTitle.value = detail.seriesTitle || DEFAULT_DETAIL.seriesTitle
  description.value = detail.description || DEFAULT_DETAIL.description
  cover.value = resolveCfgImg(detail.cover, DEFAULT_DETAIL.cover)
  slideImages.value = (detail.slides?.length ? detail.slides : DEFAULT_DETAIL.slides).map((u) => resolveCfgImg(u, cover.value))
  gridImages.value = (detail.gallery?.length ? detail.gallery : DEFAULT_DETAIL.gallery).map((u, i) => resolveCfgImg(u, DEFAULT_DETAIL.gallery[i] || cover.value))
  slide.value = 0
}

function hasPatternDisplayConfig(pattern: Pattern): boolean {
  const cfg = pattern.display_config
  return !!(
    cfg?.detailTitle ||
    cfg?.detailDescription ||
    cfg?.detailSlides?.length ||
    cfg?.detailGallery?.length
  )
}

function applyPatternDisplayConfig(pattern: Pattern) {
  if (!hasPatternDisplayConfig(pattern)) return
  const cfg = pattern.display_config
  if (!cfg) return
  if (cfg.detailTitle?.trim()) seriesTitle.value = cfg.detailTitle.trim()
  if (cfg.detailDescription?.trim()) description.value = cfg.detailDescription.trim()
  if (cfg.detailSlides?.length) {
    const slides = cfg.detailSlides.map((u) => resolveCfgImg(u, cover.value)).filter(Boolean)
    if (slides.length) {
      slideImages.value = slides
      cover.value = slides[0]
    }
  }
  if (cfg.detailGallery?.length) {
    const gallery = cfg.detailGallery.map((u, i) => resolveCfgImg(u, DEFAULT_DETAIL.gallery[i] || cover.value)).filter(Boolean)
    if (gallery.length) gridImages.value = gallery.slice(0, 3)
  }
  slide.value = 0
}

async function loadPageData(id?: number) {
  if (id && Number.isInteger(id) && id > 0) patternId.value = id

  try {
    const res = await catalogApi.getFeedDiscover()
    if (res.data?.detail) applyDetailConfig(res.data.detail)
  } catch {
    applyDetailConfig(DEFAULT_DETAIL)
  }
  if (!patternId.value) return
  try {
    const res = await catalogApi.getPattern(patternId.value)
    if (res.data) applyPatternDisplayConfig(res.data)
  } catch {
    /* 花型展示配置读取失败时保留商品详情默认内容 */
  }
}

onLoad((q?: Record<string, string>) => {
  // 首页底部轮播跳转：优先用该轮播在后台「首页主题配置」里配的详情内容渲染
  const stashed = takeCaseDetail()
  if (stashed) {
    applyDetailConfig({
      ...DEFAULT_DETAIL,
      navTitle: stashed.navTitle || DEFAULT_DETAIL.navTitle,
      seriesTitle: stashed.seriesTitle || DEFAULT_DETAIL.seriesTitle,
      description: stashed.description || DEFAULT_DETAIL.description,
      cover: stashed.cover || DEFAULT_DETAIL.cover,
      slides: stashed.slides?.length ? stashed.slides : stashed.cover ? [stashed.cover] : DEFAULT_DETAIL.slides,
      gallery: stashed.gallery?.length ? stashed.gallery : DEFAULT_DETAIL.gallery,
    })
    return
  }
  const id = q?.id ? Number(q.id) : NaN
  loadPageData(Number.isInteger(id) && id > 0 ? id : undefined)
})

function onBuy() {
  navigateTo(purchaseRoute({
    name: seriesTitle.value || '袜款',
    cover: cover.value,
    patternId: patternId.value,
  }))
}
function onCustomize() {
  stashCustomizeCover(cover.value)
  navigateTo('/pkg/upload/index')
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.detail {
  height: 100vh;
  background: radial-gradient(120% 60% at 50% 0%, #fdf6ea 0%, $mp-bg 60%);
  display: flex;
  flex-direction: column;
}
.detail-hero {
  position: relative;
}
.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(43, 31, 20, 0.25), transparent);
}
.detail-scroll {
  flex: 1;
  min-height: 0;
}
.detail-body {
  padding: 32rpx 32rpx calc(160rpx + env(safe-area-inset-bottom));
}

/* 主商品卡 */
.hero-card {
  margin-top: 28rpx;
  background: $mp-bg-card;
  border-radius: $mp-radius-xl;
  padding: 20rpx;
  box-shadow: $mp-shadow-card;
}
.hero-card-img {
  height: 384rpx;
  border-radius: $mp-radius-lg;
  overflow: hidden;
}
.cover {
  width: 100%;
  height: 100%;
}
.dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  margin-top: 20rpx;
}
.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: $mp-radius-pill;
  background: #e0d6c4;
  transition: all 0.2s;
}
.dot.active {
  width: 28rpx;
  background: $mp-primary;
}

/* 信息卡 */
.info-card {
  margin-top: 24rpx;
  background: $mp-bg-card;
  border-radius: $mp-radius-md;
  padding: 24rpx;
  box-shadow: $mp-shadow-sm;
}
.desc-box {
  background: $mp-bg-inset;
  border-radius: $mp-radius-md;
  padding: 28rpx;
}
.desc-text {
  display: block;
  font-size: 26rpx;
  line-height: 2;
  color: $mp-text-secondary;
  text-align: center;
  font-family: $mp-font-serif;
  white-space: pre-line;
}
.design-grid {
  margin-top: 32rpx;
}
.grid {
  margin-top: 24rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 176rpx;
  gap: 18rpx;
}
.grid-item {
  border-radius: $mp-radius-md;
  box-shadow: $mp-shadow-sm;
  overflow: hidden;
}
.grid-item.tall {
  grid-row: span 2;
}
.grid-img {
  width: 100%;
  height: 100%;
}

/* 底部操作栏 */
.action-bar {
  display: flex;
  gap: 24rpx;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: $mp-bg-card;
  box-shadow: 0 -2rpx 24rpx rgba(94, 60, 30, 0.06);
}
.act-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 48rpx;
  font-size: 28rpx;
  font-weight: 700;
  font-family: $mp-font-serif;
}
.act-btn.ghost {
  color: $mp-gold;
  border: 2rpx solid $mp-gold;
}
.act-btn.solid {
  background: $mp-primary-deep;
  color: $mp-bg;
}
</style>
