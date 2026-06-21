<template>
  <div class="feed">
    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        :class="['tab', { active: t.key === activeKey }]"
        @click="selectTab(t.key)"
      >
        {{ t.name }}
      </button>
      <span class="tabs-line" />
    </div>

    <div class="feed-scroll">
      <!-- 主题 Banner：与小程序一致，展示当前主题配图 -->
      <div class="topic-banner">
        <img class="tb-img" :src="activeBannerImg" alt="" loading="lazy" />
        <div class="topic-banner-scrim" />
        <div class="tb-titlebar">
          <span class="tb-ornament"><span class="tb-line" /><AppIcon name="chevron-right" :size="12" color="#fff" /></span>
          <h2 class="tb-title">{{ activeTabName }}</h2>
          <span class="tb-ornament"><AppIcon name="chevron-right" :size="12" color="#fff" class="tb-chev-flip" /><span class="tb-line" /></span>
        </div>
      </div>

      <!-- 主题描述：居中衬线、暖褐色（对齐小程序 Topic Description） -->
      <div v-if="activeTabDesc" class="topic-desc-block">
        <span class="desc-line" />
        <p class="topic-desc">{{ activeTabDesc }}</p>
        <span class="desc-line" />
      </div>

      <div v-if="loading" class="rec-grid">
        <div v-for="n in 4" :key="'sk' + n" class="rec-card sk-card">
          <div class="rec-card-slot">
            <div class="rec-card-inner">
              <div class="sk-block sk-model" />
              <div class="sk-info">
                <div class="sk-bar" style="width: 56%" />
                <div class="sk-bar sk-bar-sm" style="width: 34%" />
              </div>
              <div class="sk-block sk-socks" />
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="!items.length" class="empty">该主题暂无花型，换一个看看～</div>
      <div v-else class="rec-grid">
        <button
          v-for="(p, i) in items"
          :key="p.patternId"
          type="button"
          class="rec-card"
          @click="goDetail(p)"
        >
          <div class="rec-card-slot">
            <div class="rec-card-inner">
              <img class="rec-bg" :src="p.cover" :alt="p.name" loading="lazy" />
              <div class="rec-bg-veil" />
              <div class="rec-info">
                <span class="rec-name">{{ p.name }}</span>
                <span class="rec-link">
                  <span class="rec-link-text">查看详情</span>
                  <AppIcon name="chevron-right" :size="14" color="#2a2724" />
                </span>
              </div>
            </div>
            <img
              class="rec-model"
              :src="modelImg(i)"
              alt=""
              loading="lazy"
              @error="onDiscoverImgError($event, i % 2 === 0 ? 'modelA' : 'modelB')"
            />
            <div class="rec-socks">
              <img
                class="rec-sock"
                :src="sockImg(i)"
                alt=""
                loading="lazy"
                @error="onDiscoverImgError($event, i % 2 === 0 ? 'sockA' : 'sockB')"
              />
              <img
                class="rec-sock"
                :src="sockImg(i)"
                alt=""
                loading="lazy"
                @error="onDiscoverImgError($event, i % 2 === 0 ? 'sockA' : 'sockB')"
              />
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { catalogApi } from '@/api'
import AppIcon from '@/components/ui/AppIcon.vue'
import { CDN_BASE, patternToProduct, detailRoute, resolveCfgImg, type BuyableProduct } from '@/domain/catalog'

const router = useRouter()

const DEFAULT_DISCOVER = {
  hero: `${CDN_BASE}/static/images/feed-hero.webp`,
  modelA: `${CDN_BASE}/static/discover/model-a.png`,
  modelB: `${CDN_BASE}/static/discover/model-b.png`,
  sockA: `${CDN_BASE}/static/discover/sock-a.png`,
  sockB: `${CDN_BASE}/static/discover/sock-b.png`,
}

const DEFAULT_DESC =
  '甄选花型灵感，从浪漫碎花到国潮纹样，\n每一款都可一键进入 AI 设计，\n定制属于你的专属袜款。'

const THEME_NAMES = ['野趣精灵', '帕斯蒂尔', '痛核少女', '松弛田园', '美式学院']
interface Tab { key: number; name: string; themeId?: number; description?: string; iconUrl?: string }
const tabs = ref<Tab[]>(THEME_NAMES.map((name, i) => ({ key: i, name })))
const activeKey = ref(0)
const activeTab = computed(() => tabs.value.find((t) => t.key === activeKey.value))
const activeTabName = computed(() => activeTab.value?.name || THEME_NAMES[0])
const activeTabDesc = computed(() => activeTab.value?.description?.trim() || DEFAULT_DESC)
const activeBannerImg = computed(() => {
  const icon = activeTab.value?.iconUrl?.trim()
  if (icon) return resolveCfgImg(icon, discoverImg.value.hero)
  return discoverImg.value.hero
})

const heroImg = ref(DEFAULT_DISCOVER.hero)
const discoverImg = ref({ ...DEFAULT_DISCOVER })
const listPageSize = ref(10)
const items = ref<BuyableProduct[]>([])
const loading = ref(true)

type DiscoverKey = 'modelA' | 'modelB' | 'sockA' | 'sockB'

function modelImg(i: number) {
  return i % 2 === 0 ? discoverImg.value.modelA : discoverImg.value.modelB
}
function sockImg(i: number) {
  return i % 2 === 0 ? discoverImg.value.sockA : discoverImg.value.sockB
}
function onDiscoverImgError(e: Event, key: DiscoverKey) {
  const img = e.target as HTMLImageElement
  const fb = DEFAULT_DISCOVER[key]
  if (img.src !== fb) img.src = fb
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
    if (d.pageSize && d.pageSize > 0) listPageSize.value = d.pageSize
  } catch {
    /* 保留内置兜底 */
  }
}

async function loadThemes() {
  try {
    const res = await catalogApi.listTags('theme')
    const themes = res.data ?? []
    if (themes.length) {
      tabs.value = themes.map((t, i) => ({
        key: i,
        name: t.name,
        themeId: t.id,
        description: t.description ?? undefined,
        iconUrl: t.icon_url ?? undefined,
      }))
    }
  } catch {
    /* 保留内置主题名 */
  }
}

async function loadPatterns() {
  loading.value = true
  const themeId = activeTab.value?.themeId
  try {
    const res = await catalogApi.listPatterns({
      pageNum: 1,
      pageSize: listPageSize.value,
      themeIds: themeId ? [themeId] : undefined,
    })
    items.value = (res.data?.list ?? []).map(patternToProduct)
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

function selectTab(key: number) {
  if (key === activeKey.value) return
  activeKey.value = key
  loadPatterns()
}

function goDetail(p: BuyableProduct) {
  router.push(detailRoute(p.patternId))
}

onMounted(async () => {
  await loadDiscoverAssets()
  await loadThemes()
  await loadPatterns()
})
</script>

<style scoped>
.feed {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f7f3ea;
}
.tabs {
  position: relative;
  display: flex;
  gap: 40px;
  height: 44px;
  padding: 0 20px;
  flex-shrink: 0;
  background: var(--bg-card);
}
.tabs-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--border);
}
.tab {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding-top: 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-2);
  white-space: nowrap;
  transition: color 0.15s;
  border: none;
  background: transparent;
  cursor: pointer;
}
.tab:hover { color: var(--primary); }
.tab.active { color: var(--primary); }
.tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1px;
  height: 2px;
  border-radius: 9999px;
  background: var(--primary);
}

.feed-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px 32px;
}

/* 两列卡片网格 */
.rec-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
  row-gap: 4px;
  margin-top: 16px;
  padding: 20px 4px 8px;
}

/* 记录卡槽：预留上方出血区，避免被 panel overflow 裁切 */
.rec-card {
  position: relative;
  display: block;
  width: 100%;
  margin: 0 0 20px;
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.rec-card:hover .rec-card-inner {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(94, 60, 30, 0.14);
}
.rec-card-slot {
  position: relative;
  height: 158px;
  padding-top: 38px;
  box-sizing: border-box;
}
.rec-card-inner {
  position: relative;
  height: 120px;
  border-radius: 14px;
  background: #faf6ef;
  box-shadow: 0 4px 14px rgba(94, 60, 30, 0.1);
  transition: transform 0.16s, box-shadow 0.16s;
  overflow: hidden;
}
.rec-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  object-fit: cover;
}
.rec-bg-veil {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: rgba(250, 246, 239, 0.82);
  pointer-events: none;
}
/* 左侧模特：相对 slot 底对齐，向上出血 */
.rec-model {
  position: absolute;
  left: 6px;
  bottom: 0;
  width: 58px;
  height: auto;
  z-index: 3;
  pointer-events: none;
}
.rec-info {
  position: absolute;
  left: 72px;
  right: 72px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.rec-name {
  font-size: 15px;
  font-weight: 600;
  color: #2a2724;
  font-family: var(--font-art);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
}
.rec-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.rec-link-text {
  font-size: 12px;
  color: #2a2724;
  font-family: var(--font-art);
}
/* 右侧袜子：相对 slot 底对齐，向上出血 */
.rec-socks {
  position: absolute;
  right: -2px;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  pointer-events: none;
}
.rec-sock {
  height: 132px;
  width: auto;
  display: block;
}

/* 骨架屏 */
.sk-card .rec-card-inner {
  background: var(--bg-card);
}
.topic-banner {
  position: relative;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 248, 236, 0.6);
  box-shadow: 0 6px 18px rgba(60, 40, 28, 0.14);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.tb-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.topic-banner-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(43, 31, 20, 0.12) 0%, rgba(43, 31, 20, 0.18) 50%, rgba(43, 31, 20, 0.5) 100%);
}
.tb-titlebar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-bottom: 18px;
}
.tb-ornament {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tb-line {
  width: 32px;
  height: 1px;
  background: rgba(255, 255, 255, 0.85);
}
.tb-chev-flip { transform: scaleX(-1); }
.tb-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  font-family: var(--font-art);
  letter-spacing: 0.06em;
  text-shadow: 0 2px 8px rgba(40, 26, 18, 0.55);
}

/* 主题描述 */
.topic-desc-block {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 20px 12px 24px;
}
.desc-line {
  flex: 1;
  max-width: 48px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(142, 79, 67, 0.35));
}
.desc-line:last-child {
  background: linear-gradient(90deg, rgba(142, 79, 67, 0.35), transparent);
}
.topic-desc {
  margin: 0;
  max-width: 520px;
  text-align: center;
  font-size: 14px;
  line-height: 1.9;
  color: #8a7568;
  font-family: var(--font-art);
  white-space: pre-line;
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
  left: 8px;
  top: 14px;
  bottom: 14px;
  width: 48px;
  border-radius: 8px;
}
.sk-info {
  position: absolute;
  left: 64px;
  right: 64px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.sk-bar {
  height: 14px;
  border-radius: 999px;
  width: 100%;
}
.sk-bar-sm { height: 12px; }
.sk-socks {
  position: absolute;
  right: 8px;
  top: 14px;
  bottom: 14px;
  width: 52px;
  border-radius: 8px;
}

.empty {
  padding: 80px 0;
  text-align: center;
  color: var(--text-3);
  font-size: 15px;
  font-family: var(--font-art);
}
</style>
