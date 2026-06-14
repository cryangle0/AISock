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
        <!-- 该分类的风格描述（后台「分类管理」可配，对齐设计稿 Topic Description） -->
        <view v-if="activeTabDesc" class="topic-desc">{{ activeTabDesc }}</view>

        <!-- 真实花型记录：严格还原设计稿横向卡（左模特 + 中系列名/查看详情 + 右成对袜子，卡底为淡化花型图） -->
        <view v-if="loading" class="state">加载中…</view>
        <view v-else-if="!products.length" class="state">该分类暂无花型，换一个看看～</view>
        <view v-else class="rec-list">
          <view
            v-for="(p, i) in products"
            :key="p.patternId"
            class="rec-card"
            @tap="goDetail(p)"
          >
            <image class="rec-bg" :src="p.cover" mode="aspectFill" lazy-load />
            <view class="rec-bg-veil" />
            <image class="rec-model" :src="i % 2 === 0 ? DISCOVER_IMG.modelA : DISCOVER_IMG.modelB" mode="widthFix" />
            <view class="rec-info">
              <text class="rec-name">{{ p.name }}</text>
              <view class="rec-link">
                <text class="rec-link-text">查看详情</text>
                <AppIcon name="chevron-right" :size="22" color="#2a2724" />
              </view>
            </view>
            <view class="rec-socks">
              <image class="rec-sock" :src="i % 2 === 0 ? DISCOVER_IMG.sockA : DISCOVER_IMG.sockB" mode="heightFix" />
              <image class="rec-sock" :src="i % 2 === 0 ? DISCOVER_IMG.sockA : DISCOVER_IMG.sockB" mode="heightFix" />
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
import { cdnImg } from '@/config/cdn'

const HERO_IMG = cdnImg('/static/images/feed-hero.webp')

// 发现页记录卡的设计稿切图（模特照 / 成对袜子样机），按 index 交替
const DISCOVER_IMG = {
  modelA: '/static/discover/model-a.webp',
  modelB: '/static/discover/model-b.webp',
  sockA: '/static/discover/sock-a.webp',
  sockB: '/static/discover/sock-b.webp',
}

interface Tab { id: number; name: string; desc?: string }
const ALL_TAB: Tab = { id: 0, name: '全部' }
// 分类未配置描述时的兜底文案（如「全部」），保证发现页主题描述区始终有内容
const DEFAULT_DESC = '甄选花型灵感，从浪漫碎花到国潮纹样，\n每一款都可一键进入 AI 设计，\n定制属于你的专属袜款。'
const tabs = ref<Tab[]>([ALL_TAB])
const activeId = ref(0)
const activeTab = computed(() => tabs.value.find((t) => t.id === activeId.value))
const activeTabName = computed(() => activeTab.value?.name || '全部')
const activeTabDesc = computed(() => activeTab.value?.desc?.trim() || DEFAULT_DESC)

const products = ref<BuyableProduct[]>([])
const loading = ref(false)
let loaded = false

async function loadCategories() {
  try {
    const res = await catalogApi.listPatternCategories()
    if (res.data?.length) tabs.value = [ALL_TAB, ...res.data.map((c) => ({ id: c.id, name: c.name, desc: c.description ?? '' }))]
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
  inset: 0;
  width: 100%;
  height: 100%;
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

/* 分类风格描述：居中衬线、暖褐色，多行（对齐设计稿 Topic Description） */
.topic-desc {
  margin: 20rpx 24rpx 36rpx;
  text-align: center;
  font-size: 26rpx;
  line-height: 1.9;
  color: $mp-text-secondary;
  font-family: $mp-font-serif;
  white-space: pre-wrap;
}

/* 主题 Banner 卡片：四角圆角 + 四边描边，独立浮于 hero 背景之上（不再向下开口，避免与背景图错位） */
.topic-banner {
  position: relative;
  margin: 8rpx 32rpx 24rpx;
  height: 300rpx;
  border-radius: 24rpx;
  overflow: hidden;
  border: 2rpx solid rgba(255, 248, 236, 0.6);
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

/* 记录卡：横向白卡（左模特 + 中系列名/查看详情 + 右成对袜子），严格还原设计稿 */
.rec-list {
  margin-top: 24rpx;
  /* 顶部留白：让首张卡的模特上出血不被裁切 */
  padding-top: 20rpx;
}
.rec-card {
  position: relative;
  height: 200rpx;
  margin-bottom: 112rpx;
  border-radius: 24rpx;
  background: #faf6ef;
  box-shadow: 0 8rpx 24rpx rgba(94, 60, 30, 0.1);
}
/* 卡底：淡化的真实花型图（对齐设计稿 faint product-image 底纹） */
.rec-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 24rpx;
}
.rec-bg-veil {
  position: absolute;
  inset: 0;
  border-radius: 24rpx;
  background: rgba(250, 246, 239, 0.82);
}
/* 左侧模特照：底对齐、上出血到卡外 */
.rec-model {
  position: absolute;
  left: 20rpx;
  bottom: 0;
  width: 104rpx;
  z-index: 2;
}
/* 中间系列名 + 查看详情：居中（避让左右） */
.rec-info {
  position: absolute;
  left: 144rpx;
  right: 148rpx;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}
.rec-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #2a2724;
  font-family: $mp-font-serif;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
}
.rec-link {
  display: flex;
  align-items: center;
  gap: 4rpx;
}
.rec-link-text {
  font-size: 24rpx;
  color: #2a2724;
  font-family: $mp-font-serif;
}
/* 右侧成对袜子样机：底对齐、上出血 */
.rec-socks {
  position: absolute;
  right: 20rpx;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 6rpx;
}
.rec-sock {
  height: 184rpx;
}
</style>
