<template>
  <view class="feed">
    <scroll-view class="feed-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
      <!-- 顶部一体化 Hero：同一背景图从状态栏延伸到「全部」标题底部，再渐隐到下方网格 -->
      <view class="hero">
        <image class="hero-img" :src="HERO_IMG" mode="aspectFill" />
        <view class="hero-mask" />
        <view class="hero-fg">
          <NavBar title="发现" brand variant="transparent" />
          <scroll-view scroll-x class="topic-tabs" :show-scrollbar="false">
            <view
              v-for="t in tabs"
              :key="t.id"
              :class="['topic', { active: t.id === activeId }]"
              @tap="onSelectTab(t.id)"
            >
              <text class="topic-text">{{ t.name }}</text>
              <view v-if="t.id === activeId" class="topic-underline" />
            </view>
          </scroll-view>
          <!-- 主题 Banner 卡片：圆角边框 + 主题大图 + 居中分类名，叠在 hero 丛林背景上（对齐设计稿 Section-Banner Card radius=12px） -->
          <view class="topic-banner">
            <image class="tb-img" :src="HERO_IMG" mode="aspectFill" />
            <view class="topic-banner-scrim" />
            <view class="tb-titlebar">
              <view class="tb-ornament"><view class="tb-line" /><AppIcon name="chevron-right" :size="24" color="#ffffff" /></view>
              <text class="tb-title">{{ activeTabName }}</text>
              <view class="tb-ornament"><AppIcon name="chevron-left" :size="24" color="#ffffff" /><view class="tb-line" /></view>
            </view>
          </view>
        </view>
      </view>

      <view class="feed-body">
        <!-- 真实花型商品网格 -->
        <view v-if="loading" class="state">加载中…</view>
        <view v-else-if="!products.length" class="state">该分类暂无花型，换一个看看～</view>
        <view v-else class="p-grid">
          <view
            v-for="p in products"
            :key="p.patternId"
            class="p-card"
            @tap="goDetail(p)"
          >
            <view class="p-cover">
              <image class="p-img" :src="p.cover" mode="aspectFill" lazy-load />
            </view>
            <view class="p-meta">
              <text class="p-name">{{ p.name }}</text>
              <view class="p-link">
                <text class="p-link-text">查看详情</text>
                <AppIcon name="chevron-right" :size="20" color="#8e4f43" />
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <custom-tab-bar current="feed" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navigateTo } from '@aisock/common/utils'
import { catalogApi } from '@aisock/service'
import { patternToProduct, detailRoute, type BuyableProduct } from '@/domain/catalog'
import NavBar from '@/components/ui/NavBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'

const HERO_IMG = '/static/images/feed-hero.jpg'

interface Tab { id: number; name: string }
const ALL_TAB: Tab = { id: 0, name: '全部' }
const tabs = ref<Tab[]>([ALL_TAB])
const activeId = ref(0)
const activeTabName = computed(() => tabs.value.find((t) => t.id === activeId.value)?.name || '全部')

const products = ref<BuyableProduct[]>([])
const loading = ref(false)
let loaded = false

async function loadCategories() {
  try {
    const res = await catalogApi.listPatternCategories()
    if (res.data?.length) tabs.value = [ALL_TAB, ...res.data.map((c) => ({ id: c.id, name: c.name }))]
  } catch {
    /* 保留全部 tab */
  }
}

async function loadProducts(): Promise<boolean> {
  loading.value = true
  try {
    const res = await catalogApi.listPatterns({
      pageNum: 1,
      pageSize: 30,
      categoryId: activeId.value || undefined,
    })
    products.value = (res.data?.list ?? []).map(patternToProduct)
    return true
  } catch {
    products.value = []
    return false
  } finally {
    loading.value = false
  }
}

function onSelectTab(id: number) {
  if (activeId.value === id) return
  activeId.value = id
  loadProducts()
}

function goDetail(p: BuyableProduct) {
  navigateTo(detailRoute(p.patternId))
}

onShow(async () => {
  if (loaded) return
  await loadCategories()
  // 首载失败不置 loaded：下次进入页面自动重试，避免空态永久驻留
  loaded = await loadProducts()
})
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.feed {
  height: 100vh;
  background: $mp-bg;
  display: flex;
  flex-direction: column;
}
.feed-scroll {
  flex: 1;
  min-height: 0;
}

.hero {
  position: relative;
  overflow: hidden;
}
.hero-img {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  /* 背景图比渐变遮罩短一截：底部 72rpx 为纯渐变区，使渐变越过背景图底部 */
  bottom: 72rpx;
  z-index: 0;
}
.hero-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  /* 敦煌棕主题渐变，顶部更深、色调更明显；暖色一直延伸到底部 72rpx 越过背景图后再渐隐到米色 */
  background: linear-gradient(
    180deg,
    rgba(142, 79, 67, 0.97) 0%,
    rgba(142, 79, 67, 0.88) 14%,
    rgba(142, 79, 67, 0.52) 34%,
    rgba(150, 90, 76, 0.42) 58%,
    rgba(160, 100, 84, 0.48) 80%,
    rgba(190, 140, 112, 0.56) 92%,
    #f7f3ea 100%
  );
}
.hero-fg {
  position: relative;
  z-index: 2;
  padding-bottom: 72rpx;
}
.topic-tabs {
  position: relative;
  z-index: 2;
  white-space: nowrap;
  padding: 8rpx 24rpx 16rpx;
}
.topic {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin-right: 36rpx;
}
.topic-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  font-family: $mp-font-serif;
}
.topic.active .topic-text {
  color: #fff;
  font-weight: 900;
}
.topic-underline {
  margin-top: 8rpx;
  width: 56rpx;
  height: 4rpx;
  border-radius: $mp-radius-pill;
  background: #fff;
}

.feed-body {
  padding: 32rpx 32rpx calc(180rpx + env(safe-area-inset-bottom));
}

/* 主题 Banner 卡片：顶部圆角 + 上/左/右描边，底部不要边框（向下开口、融入背景） */
.topic-banner {
  position: relative;
  margin: 8rpx 32rpx 0;
  height: 300rpx;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
  border: 2rpx solid rgba(255, 248, 236, 0.6);
  border-bottom: none;
  box-shadow: 0 10rpx 28rpx rgba(60, 40, 28, 0.22);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.tb-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.topic-banner-scrim {
  position: absolute;
  inset: 0;
  /* 底部加深，保证分类名白字清晰 */
  background: linear-gradient(180deg, rgba(43, 31, 20, 0.12) 0%, rgba(43, 31, 20, 0.18) 50%, rgba(43, 31, 20, 0.5) 100%);
}
.tb-titlebar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  padding-bottom: 34rpx;
}
.tb-ornament {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.tb-line {
  width: 56rpx;
  height: 2rpx;
  background: rgba(255, 255, 255, 0.85);
}
.tb-diamond {
  width: 14rpx;
  height: 14rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.85);
  transform: rotate(45deg);
}
.tb-title {
  position: relative;
  z-index: 1;
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  font-family: $mp-font-serif;
  letter-spacing: 0.06em;
  text-shadow: 0 2rpx 8rpx rgba(40, 26, 18, 0.55);
}

.state {
  padding: 80rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: $mp-text-muted;
  font-family: $mp-font-serif;
}

/* 花型商品网格 */
.p-grid {
  margin-top: 28rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}
.p-card {
  background: $mp-bg-card;
  border-radius: $mp-radius-md;
  overflow: hidden;
  box-shadow: $mp-shadow-sm;
}
.p-cover {
  width: 100%;
  height: 320rpx;
  background: $mp-bg-inset;
}
.p-img {
  width: 100%;
  height: 100%;
}
.p-meta {
  padding: 18rpx 20rpx 20rpx;
}
.p-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: $mp-text-strong;
  font-family: $mp-font-serif;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.p-link {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  gap: 2rpx;
}
.p-link-text {
  font-size: 22rpx;
  color: $mp-primary;
  font-family: $mp-font-serif;
}
</style>
