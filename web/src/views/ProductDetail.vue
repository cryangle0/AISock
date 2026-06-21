<template>
  <div class="detail">
    <header class="detail-head">
      <button class="back-btn" type="button" aria-label="返回" @click="router.back()">
        <AppIcon name="chevron-right" :size="18" color="currentColor" class="back-ico" />
      </button>
    </header>

    <div v-if="loading" class="detail-state">加载中…</div>
    <div v-else-if="error" class="detail-state error">{{ error }}</div>
    <template v-else>
      <div class="detail-scroll">
        <div class="detail-body">
          <section class="product-layout">
            <div class="copy-panel">
              <p class="eyebrow">{{ navTitle }}</p>
              <h2 class="product-title">{{ seriesTitle }}</h2>
              <div class="title-line" />

              <div class="feature-row">
                <div class="feature">
                  <span class="feature-icon">柔</span>
                  <div>
                    <b>柔软亲肤</b>
                    <small>细腻舒适</small>
                  </div>
                </div>
                <div class="feature">
                  <span class="feature-icon">透</span>
                  <div>
                    <b>吸湿透气</b>
                    <small>保持干爽</small>
                  </div>
                </div>
                <div class="feature">
                  <span class="feature-icon">适</span>
                  <div>
                    <b>舒适贴合</b>
                    <small>自在不紧绷</small>
                  </div>
                </div>
              </div>

              <p class="desc-text">{{ description }}</p>

              <div class="inline-actions">
                <button class="act-btn ghost" type="button" @click="onBuy">立即购买</button>
                <button class="act-btn solid" type="button" @click="onCustomize">定制设计</button>
              </div>
            </div>

            <div class="main-visual">
              <img
                v-if="slideImages[slide]"
                class="hero-img"
                :src="slideImages[slide]"
                :alt="seriesTitle"
              />
              <div class="dots">
                <button
                  v-for="(_, i) in slideImages"
                  :key="i"
                  type="button"
                  :class="['dot', { active: i === slide }]"
                  @click="slide = i"
                />
              </div>
            </div>

            <div class="side-gallery">
              <button
                v-if="galleryImages[0]"
                class="side-card"
                type="button"
                @click="setSlideByImage(galleryImages[0])"
              >
                <img :src="galleryImages[0]" :alt="`${seriesTitle} 展示 1`" loading="lazy" />
              </button>
              <button
                v-if="galleryImages[1]"
                class="side-card"
                type="button"
                @click="setSlideByImage(galleryImages[1])"
              >
                <img :src="galleryImages[1]" :alt="`${seriesTitle} 展示 2`" loading="lazy" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </template>

    <OrderModal
      v-if="orderOpen"
      :default-design-name="seriesTitle"
      @close="orderOpen = false"
      @submit="onOrderSubmit"
    />
    <PaymentModal v-if="pendingOrder" :order="pendingOrder" @cancel="pendingOrder = null" @paid="onPaid" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogApi, designApi } from '@/api'
import OrderModal, { type OrderFormData } from '@/components/order/OrderModal.vue'
import PaymentModal from '@/components/order/PaymentModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { CDN_BASE, resolveCfgImg, stashCustomizeCover } from '@/domain/catalog'

const DEFAULT_DETAIL = {
  navTitle: '袜版定制 · 杭城',
  seriesTitle: '杭城袜韵',
  description: '将杭州城市文化融入袜品设计\n舒适与美学兼具\n传递城市温度与品质生活',
  cover: `${CDN_BASE}/pkg/static/detail/hangzhou-hero.webp`,
  slides: [
    `${CDN_BASE}/pkg/static/detail/hangzhou-hero.webp`,
    `${CDN_BASE}/pkg/static/detail/hangzhou-hero.webp`,
    `${CDN_BASE}/pkg/static/detail/hangzhou-hero.webp`,
    `${CDN_BASE}/pkg/static/detail/hangzhou-hero.webp`,
  ],
  gallery: [
    `${CDN_BASE}/pkg/static/detail/hangzhou-1.webp`,
    `${CDN_BASE}/pkg/static/detail/hangzhou-2.webp`,
    `${CDN_BASE}/pkg/static/detail/hangzhou-3.webp`,
  ],
}

const route = useRoute()
const router = useRouter()

const patternId = ref<number | null>(null)
const navTitle = ref(DEFAULT_DETAIL.navTitle)
const seriesTitle = ref(DEFAULT_DETAIL.seriesTitle)
const description = ref(DEFAULT_DETAIL.description)
const cover = ref(DEFAULT_DETAIL.cover)
const slideImages = ref<string[]>([...DEFAULT_DETAIL.slides])
const gridImages = ref<string[]>([...DEFAULT_DETAIL.gallery])
const slide = ref(0)
const loading = ref(true)
const error = ref('')
const orderOpen = ref(false)
const pendingOrder = ref<OrderFormData | null>(null)
let designId: number | null = null

const galleryImages = computed(() => {
  const seen = new Set<string>()
  return [...gridImages.value, ...slideImages.value].filter((url) => {
    if (!url || seen.has(url)) return false
    seen.add(url)
    return true
  })
})

function applyDetailConfig(detail: typeof DEFAULT_DETAIL) {
  navTitle.value = detail.navTitle || DEFAULT_DETAIL.navTitle
  seriesTitle.value = detail.seriesTitle || DEFAULT_DETAIL.seriesTitle
  description.value = detail.description || DEFAULT_DETAIL.description
  cover.value = resolveCfgImg(detail.cover, DEFAULT_DETAIL.cover)
  slideImages.value = (detail.slides?.length ? detail.slides : DEFAULT_DETAIL.slides).map((u) =>
    resolveCfgImg(u, cover.value),
  )
  gridImages.value = (detail.gallery?.length ? detail.gallery : DEFAULT_DETAIL.gallery).map((u, i) =>
    resolveCfgImg(u, DEFAULT_DETAIL.gallery[i] || cover.value),
  )
  slide.value = 0
}

interface PatternDisplayConfigLike {
  detailTitle?: string
  detailDescription?: string
  detailSlides?: string[]
  detailGallery?: string[]
}

function hasPatternDisplayConfig(pattern: { display_config?: PatternDisplayConfigLike | null }): boolean {
  const cfg = pattern.display_config
  return !!(
    cfg?.detailTitle ||
    cfg?.detailDescription ||
    cfg?.detailSlides?.length ||
    cfg?.detailGallery?.length
  )
}

function applyPatternDisplayConfig(pattern: { display_config?: PatternDisplayConfigLike | null }) {
  if (!hasPatternDisplayConfig(pattern)) return
  const cfg = pattern.display_config
  if (!cfg) return
  if (typeof cfg.detailTitle === 'string' && cfg.detailTitle.trim()) seriesTitle.value = cfg.detailTitle.trim()
  if (typeof cfg.detailDescription === 'string' && cfg.detailDescription.trim()) description.value = cfg.detailDescription.trim()
  if (Array.isArray(cfg.detailSlides) && cfg.detailSlides.length) {
    const slides = cfg.detailSlides.map((u) => resolveCfgImg(u, cover.value)).filter(Boolean)
    if (slides.length) {
      slideImages.value = slides
      cover.value = slides[0]
    }
  }
  if (Array.isArray(cfg.detailGallery) && cfg.detailGallery.length) {
    const gallery = cfg.detailGallery.map((u, i) => resolveCfgImg(u, DEFAULT_DETAIL.gallery[i] || cover.value)).filter(Boolean)
    if (gallery.length) gridImages.value = gallery.slice(0, 3)
  }
  slide.value = 0
}

async function loadPageData(id?: number) {
  if (id && Number.isInteger(id) && id > 0) patternId.value = id

  try {
    const res = await catalogApi.getFeedDiscover()
    if (res.data?.detail) {
      applyDetailConfig({
        navTitle: res.data.detail.navTitle,
        seriesTitle: res.data.detail.seriesTitle,
        description: res.data.detail.description,
        cover: res.data.detail.cover,
        slides: res.data.detail.slides,
        gallery: res.data.detail.gallery,
      })
    } else {
      applyDetailConfig(DEFAULT_DETAIL)
    }
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

onMounted(async () => {
  const id = Number(route.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    error.value = '无效的商品 ID'
    loading.value = false
    return
  }
  await loadPageData(id)
  loading.value = false
})

async function ensureDesign(): Promise<number | null> {
  if (designId) return designId
  if (!cover.value) return null
  try {
    const res = await designApi.create({ name: seriesTitle.value, coverUrl: cover.value })
    designId = res.data.id
    return designId
  } catch {
    return null
  }
}

async function onBuy() {
  await ensureDesign()
  orderOpen.value = true
}

function setSlideByImage(url: string) {
  const idx = slideImages.value.findIndex((img) => img === url)
  if (idx >= 0) slide.value = idx
}

function onCustomize() {
  stashCustomizeCover(cover.value)
  router.push({
    name: 'Editor',
    query: {
      pattern: patternId.value ? String(patternId.value) : undefined,
      cover: cover.value || undefined,
      name: seriesTitle.value,
    },
  })
}

async function onOrderSubmit(data: OrderFormData) {
  orderOpen.value = false
  const id = await ensureDesign()
  pendingOrder.value = { ...data, designId: id ?? undefined }
}

function onPaid() {
  pendingOrder.value = null
  router.push({ name: 'Cart' })
}
</script>

<style scoped>
.detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  --fresh: #21a86b;
  --fresh-deep: #168c58;
  --fresh-soft: #eaf8f1;
  --ink: #202323;
  --muted: #758078;
  --line: rgba(33, 168, 107, 0.18);
  background:
    radial-gradient(circle at 66% 18%, rgba(33, 168, 107, 0.12), transparent 28%),
    linear-gradient(135deg, #fbfdfb 0%, #f6faf7 48%, #ffffff 100%);
}
.detail-head {
  display: flex;
  align-items: center;
  padding: 22px 38px 0;
  flex-shrink: 0;
}
.back-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: #fff;
  color: var(--fresh);
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(33, 168, 107, 0.1);
}
.back-ico { transform: rotate(180deg); }
.back-btn:hover { background: var(--fresh-soft); }
.detail-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  font-size: 15px;
}
.detail-state.error { color: #c45a4a; }
.detail-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 34px 38px 42px;
}
.detail-body {
  max-width: 1360px;
  margin: 0 auto;
}
.product-layout {
  display: grid;
  grid-template-columns: minmax(300px, 0.88fr) minmax(420px, 1.24fr) minmax(210px, 0.68fr);
  align-items: stretch;
  gap: 28px;
}
.copy-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 560px;
  padding: 24px 10px 24px 0;
}
.eyebrow {
  margin: 0 0 16px;
  color: var(--fresh);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.product-title {
  margin: 0;
  max-width: 460px;
  color: var(--ink);
  font-size: clamp(48px, 5.4vw, 86px);
  line-height: 1.08;
  font-weight: 900;
  letter-spacing: 0.02em;
  white-space: pre-line;
}
.title-line {
  width: 48px;
  height: 3px;
  margin: 28px 0 36px;
  border-radius: 999px;
  background: var(--fresh);
}
.feature-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  max-width: 520px;
}
.feature {
  display: flex;
  align-items: center;
  gap: 10px;
}
.feature-icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(33, 168, 107, 0.4);
  color: var(--fresh);
  font-weight: 800;
}
.feature b {
  display: block;
  color: #4f5a54;
  font-size: 14px;
}
.feature small {
  display: block;
  margin-top: 2px;
  color: #8a958e;
  font-size: 12px;
}
.desc-text {
  max-width: 520px;
  margin: 40px 0 0;
  color: #727d76;
  font-size: 15px;
  line-height: 2;
  white-space: pre-line;
}
.inline-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 44px;
}
.main-visual,
.side-card {
  overflow: hidden;
  background: #fff;
  box-shadow: 0 18px 50px rgba(33, 168, 107, 0.08);
}
.main-visual {
  position: relative;
  min-height: 600px;
  border-radius: 18px;
}
.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dots {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(8px);
}
.dot {
  width: 8px;
  height: 8px;
  border: none;
  border-radius: 999px;
  background: rgba(33, 168, 107, 0.28);
  padding: 0;
  transition: all 0.2s;
}
.dot.active {
  width: 24px;
  background: var(--fresh);
}
.side-gallery {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 18px;
  min-height: 600px;
}
.side-card {
  border: none;
  padding: 0;
  cursor: pointer;
}
.side-card {
  border-radius: 16px;
}
.side-card img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.35s ease;
}
.side-card:hover img {
  transform: scale(1.035);
}
.act-btn {
  min-width: 128px;
  height: 46px;
  padding: 0 24px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
}
.act-btn:hover {
  transform: translateY(-1px);
}
.act-btn.ghost {
  color: var(--fresh);
  border: 1px solid rgba(33, 168, 107, 0.32);
  background: rgba(255, 255, 255, 0.82);
}
.act-btn.ghost:hover {
  background: var(--fresh-soft);
}
.act-btn.solid {
  color: #fff;
  background: linear-gradient(180deg, var(--fresh) 0%, var(--fresh-deep) 100%);
  box-shadow: 0 12px 24px rgba(33, 168, 107, 0.22);
}
.act-btn.solid:hover {
  box-shadow: 0 16px 28px rgba(33, 168, 107, 0.28);
}
@media (max-width: 1180px) {
  .product-layout {
    grid-template-columns: 1fr 1.2fr;
  }
  .side-gallery {
    grid-column: 1 / -1;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: none;
    min-height: 240px;
  }
}
@media (max-width: 860px) {
  .detail-head {
    padding: 18px 20px 0;
  }
  .detail-scroll {
    padding: 24px 20px 32px;
  }
  .product-layout {
    grid-template-columns: 1fr;
  }
  .copy-panel,
  .main-visual,
  .side-gallery {
    min-height: auto;
  }
  .main-visual {
    height: 440px;
  }
  .side-gallery {
    grid-template-columns: 1fr 1fr;
    min-height: 180px;
  }
  .feature-row {
    grid-template-columns: 1fr;
  }
}
</style>
