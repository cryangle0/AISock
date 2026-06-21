<template>
  <view class="feed">
    <scroll-view class="feed-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
      <!-- 顶部一体化 Hero：同一背景图从状态栏延伸到「全部」标题底部，再渐隐到下方网格 -->
      <view class="hero">
        <image class="hero-img" :src="heroImg" mode="aspectFill" />
        <view class="hero-mask" />
        <view class="hero-fg">
          <NavBar :title="navTitle" brand variant="transparent" />
          <scroll-view scroll-x class="topic-tabs" :show-scrollbar="false">
            <view
              v-for="t in tabs"
              :key="t.key"
              :class="['topic', { active: t.key === activeKey }]"
              @tap="onSelectTab(t.key)"
            >
              <text class="topic-text">{{ t.name }}</text>
              <view v-if="t.key === activeKey" class="topic-underline" />
            </view>
          </scroll-view>
          <!-- 主题 Banner 卡片：圆角边框 + 主题大图 + 居中分类名，叠在 hero 丛林背景上（对齐设计稿 Section-Banner Card radius=12px） -->
          <view class="topic-banner">
            <image class="tb-img" :src="activeBannerImg" mode="aspectFill" />
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
        <!-- 该主题的描述文案（后台「标签管理 · 主题」的「说明」可配，留空用默认；对齐设计稿 Topic Description） -->
        <view v-if="activeTabDesc" class="topic-desc">{{ activeTabDesc }}</view>

        <!-- 真实花型记录：严格还原设计稿横向卡（左模特 + 中系列名/查看详情 + 右成对袜子，卡底为淡化花型图） -->
        <!-- 加载中：骨架屏（与记录卡同版式 + 微光），避免先闪空态再出数据 -->
        <view v-if="loading" class="rec-list">
          <view v-for="n in 4" :key="'sk' + n" class="rec-card sk-card">
            <view class="sk-block sk-model" />
            <view class="sk-info">
              <view class="sk-bar" style="width: 56%" />
              <view class="sk-bar sk-bar-sm" style="width: 34%" />
            </view>
            <view class="sk-block sk-socks" />
          </view>
        </view>
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
            <image class="rec-model" :src="i % 2 === 0 ? discoverImg.modelA : discoverImg.modelB" mode="widthFix" />
            <view class="rec-info">
              <text class="rec-name">{{ p.name }}</text>
              <view class="rec-link">
                <text class="rec-link-text">查看详情</text>
                <AppIcon name="chevron-right" :size="22" color="#2a2724" />
              </view>
            </view>
            <view class="rec-socks">
              <image class="rec-sock" :src="i % 2 === 0 ? discoverImg.sockA : discoverImg.sockB" mode="heightFix" />
              <image class="rec-sock" :src="i % 2 === 0 ? discoverImg.sockA : discoverImg.sockB" mode="heightFix" />
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

const DEFAULT_DISCOVER = {
  hero: cdnImg('/static/images/feed-hero.webp'),
  modelA: '/static/discover/model-a.png',
  modelB: '/static/discover/model-b.png',
  sockA: '/static/discover/sock-a.png',
  sockB: '/static/discover/sock-b.png',
}

const heroImg = ref(DEFAULT_DISCOVER.hero)
const discoverImg = ref({ ...DEFAULT_DISCOVER })
const navTitle = ref('发现')
const listPageSize = ref(10)

function resolveCfgImg(url: string, fallback: string): string {
  const u = url?.trim()
  if (!u) return fallback
  if (/^https?:/i.test(u)) return u
  if (u.startsWith('/static/discover/')) return u
  if (u.startsWith('/static/') || u.startsWith('/pkg/')) return cdnImg(u)
  return u
}

async function loadDiscoverAssets() {
  try {
    const res = await catalogApi.getFeedDiscover()
    const d = res.data?.discover
    if (!d) return
    const hero = resolveCfgImg(d.hero, DEFAULT_DISCOVER.hero)
    heroImg.value = hero
    discoverImg.value = {
      hero,
      modelA: resolveCfgImg(d.modelA, DEFAULT_DISCOVER.modelA),
      modelB: resolveCfgImg(d.modelB, DEFAULT_DISCOVER.modelB),
      sockA: resolveCfgImg(d.sockA, DEFAULT_DISCOVER.sockA),
      sockB: resolveCfgImg(d.sockB, DEFAULT_DISCOVER.sockB),
    }
    if (d.navTitle?.trim()) navTitle.value = d.navTitle.trim()
    if (d.pageSize && d.pageSize > 0) listPageSize.value = d.pageSize
  } catch {
    /* 保留内置兜底 */
  }
}

interface Tab { key: number; name: string; themeId?: number; desc?: string; iconUrl?: string }
// 顶部主题 Tab：后台「标签管理 · 主题」可配，名称/排序与后台保持同步；后台为空/失败时兜底用内置 5 个主题名（视觉不变）
const THEME_NAMES = ['野趣精灵', '帕斯蒂尔', '痛核少女', '松弛田园', '美式学院']
// 主题未配置描述时的兜底文案，保证发现页描述区始终有内容（后台「标签管理·主题·说明」留空时用此）
const DEFAULT_DESC = '甄选花型灵感，从浪漫碎花到国潮纹样，\n每一款都可一键进入 AI 设计，\n定制属于你的专属袜款。'
const tabs = ref<Tab[]>(THEME_NAMES.map((name, i) => ({ key: i, name })))
const activeKey = ref(0)
const activeTab = computed(() => tabs.value.find((t) => t.key === activeKey.value))
const activeTabName = computed(() => activeTab.value?.name || THEME_NAMES[0])
const activeTabDesc = computed(() => activeTab.value?.desc?.trim() || DEFAULT_DESC)
/** 主题 Banner：标签「主题」的配图 icon_url；未配则用发现页-配图里的顶部背景 */
const activeBannerImg = computed(() => {
  const icon = activeTab.value?.iconUrl?.trim()
  if (icon) return resolveCfgImg(icon, heroImg.value)
  return heroImg.value
})

const products = ref<BuyableProduct[]>([])
const loading = ref(true)
let loaded = false

async function loadThemes() {
  try {
    const res = await catalogApi.listTags('theme')
    const themes = res.data ?? []
    // 用后台主题渲染 Tab（名称/排序跟随后台）；后台为空则保留内置 5 个主题名，视觉不变
    if (themes.length) {
      tabs.value = themes.map((t, i) => ({
        key: i,
        name: t.name,
        themeId: t.id,
        desc: t.description ?? '',
        iconUrl: t.icon_url ?? '',
      }))
    }
  } catch {
    /* 保留内置主题名（不可筛选时退化为全部） */
  }
}

async function loadProducts(): Promise<boolean> {
  loading.value = true
  try {
    const res = await catalogApi.listPatterns({
      pageNum: 1,
      pageSize: listPageSize.value,
      themeIds: activeTab.value?.themeId ? [activeTab.value.themeId] : undefined,
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

function onSelectTab(key: number) {
  if (activeKey.value === key) return
  activeKey.value = key
  loadProducts()
}

function goDetail(p: BuyableProduct) {
  navigateTo(detailRoute(p.patternId))
}

onShow(async () => {
  const prevSize = listPageSize.value
  await loadDiscoverAssets()
  if (!loaded) {
    await loadThemes()
    loaded = await loadProducts()
    return
  }
  if (listPageSize.value !== prevSize) await loadProducts()
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
/* 「发现」品牌标题在发现页更大（仅作用于本页，不影响首页/AI 页） */
.hero :deep(.nav-title--brand) {
  font-size: 56rpx;
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
  /* 顶部背景图清晰可见，越往下主题棕色越重、图越淡，最终融入米色页底 */
  background: linear-gradient(
    180deg,
    rgba(142, 79, 67, 0.30) 0%,
    rgba(142, 79, 67, 0.24) 20%,
    rgba(148, 90, 76, 0.40) 46%,
    rgba(168, 112, 90, 0.64) 70%,
    rgba(202, 160, 130, 0.86) 89%,
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
  margin: 16rpx 28rpx 24rpx;
  height: 372rpx;
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
/* ── 加载骨架屏：与记录卡同版式 + 暖色微光 ── */
.sk-card {
  margin-bottom: 24rpx;
  background: $mp-bg-card;
  overflow: hidden;
}
.sk-block,
.sk-bar {
  background: linear-gradient(100deg, #efe7da 30%, #f8f2e7 50%, #efe7da 70%);
  background-size: 280% 100%;
  animation: sk-shimmer 1.3s linear infinite;
}
@keyframes sk-shimmer {
  0% { background-position: 180% 0; }
  100% { background-position: -80% 0; }
}
.sk-model {
  position: absolute;
  left: 24rpx;
  top: 30rpx;
  bottom: 30rpx;
  width: 110rpx;
  border-radius: 16rpx;
}
.sk-info {
  position: absolute;
  left: 168rpx;
  right: 172rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
}
.sk-bar {
  height: 26rpx;
  border-radius: 999rpx;
}
.sk-bar-sm {
  height: 22rpx;
}
.sk-socks {
  position: absolute;
  right: 24rpx;
  top: 40rpx;
  bottom: 40rpx;
  width: 120rpx;
  border-radius: 16rpx;
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
  width: 88rpx;
  z-index: 2;
}
/* 中间系列名 + 查看详情：左对齐（避让左侧模特、右侧袜子） */
.rec-info {
  position: absolute;
  left: 140rpx;
  right: 184rpx;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12rpx;
}
.rec-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #2a2724;
  font-family: $mp-font-serif;
  text-align: left;
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
  font-size: 27rpx;
  color: #2a2724;
  font-family: $mp-font-serif;
}
/* 右侧成对袜子样机：右侧出血到卡片边缘，加高使其上出血超出卡片（与左侧模特一致） */
.rec-socks {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 4rpx;
}
.rec-sock {
  height: 248rpx;
}
</style>
