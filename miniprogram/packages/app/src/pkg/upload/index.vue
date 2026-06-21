<template>
  <view class="upload">
    <view class="up-hero" :style="{ background: heroBg }">
      <view class="hero-scrim" />
      <NavBar title="袜版定制" show-back variant="transparent" title-size="42rpx" />
      <view class="hero-head">
        <view class="hero-title-row">
          <view class="ht-diamond" />
          <text class="hero-title">花型设计</text>
          <view class="ht-diamond" />
        </view>
        <text class="hero-sub">上传图片或生成灵感花型，AI 为你渲染到袜版上</text>
      </view>
    </view>

    <scroll-view class="up-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
      <view class="up-body">
        <!-- 主预览卡：把选中的袜版 + 花型渲染到上方中心（真实 canvas，与推荐卡一致） -->
        <view class="card preview-card">
          <view class="sock-stage">
            <view class="sock-select-chip" @tap="goPickSock">
              <AppIcon name="sock-template" :size="30" />
              <text class="sock-select-text">{{ selectedSockName || '袜版选择' }}</text>
              <text class="sock-select-arrow">›</text>
            </view>
            <SockCanvas
              v-if="!aiGenOpen"
              ref="sockCanvasRef"
              :sock-type-id="sockTypeId"
              :print-image="printImage"
              :pattern-id="null"
              :params="previewParams"
              :colors="emptyColors"
              mode="preview"
            />
            <!-- AI 生成抽屉打开时隐藏原生 canvas（否则会盖住抽屉），用普通 image 兜底 -->
            <image v-else-if="stagePreview" class="stage-fallback" :src="stagePreview" mode="aspectFit" />
          </view>
          <view class="upload-box" @tap="onChoose">
            <view class="up-ico"><AppIcon name="upload" :size="36" color="#8e4f43" /></view>
            <view class="up-texts">
              <text class="up-main">{{ printImage ? '重新上传图片' : '上传图片' }}</text>
              <text class="up-tip">支持 JPG / PNG，建议清晰图案</text>
            </view>
          </view>
        </view>

        <!-- 灵感参考 + 生成 -->
        <view class="card">
          <text class="block-title">灵感参考</text>
          <view class="ref-grid">
            <view
              v-for="(r, i) in refs"
              :key="i"
              :class="['ref-item', { active: printImage === r.url }]"
              :style="{ background: r.bg }"
              @tap="onRef(r)"
            >
              <image v-if="r.url" class="ref-img" :src="r.url" mode="aspectFill" />
            </view>
          </view>
          <view class="gen-pill" @tap="goGenerate">
            <AppIcon name="sparkle" :size="30" color="#8e4f43" />
            <text class="gen-pill-text">生成花型灵感</text>
          </view>
        </view>

        <!-- 历史记录 -->
        <view class="card">
          <view class="block-head">
            <text class="block-title">历史记录</text>
            <view v-if="historyTotal > historyItems.length" class="block-more" @tap="loadHistory(false)">
              <text class="more-text">{{ historyLoading ? '加载中…' : '加载更多' }}</text>
            </view>
          </view>
          <view v-if="!userStore.isLogin" class="history-hint">登录后查看 AI 生成历史</view>
          <view v-else-if="historyLoaded && !historyItems.length" class="history-hint">暂无生成记录</view>
          <scroll-view v-else scroll-x class="history-scroll" :show-scrollbar="false">
            <view class="history-row">
              <view
                v-for="h in historyItems"
                :key="h.id"
                :class="['history-thumb', { active: printImage === h.url }]"
                @tap="onHistoryPick(h)"
              >
                <image class="history-img" :src="h.thumb" mode="aspectFill" />
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </scroll-view>

    <view class="action-bar">
      <view class="act-btn ghost" @tap="onAddCart">加入购物车</view>
      <view class="act-btn solid" @tap="onNext">{{ preparingPurchase ? '生成中…' : '下一步' }}</view>
    </view>

    <!-- AI 生成花型 抽屉：就地生成灵感花型并渲染到袜版（不跳页） -->
    <AiGenerateSheet
      v-if="aiGenOpen"
      @close="aiGenOpen = false"
      @generate="onAiGenerate"
      @preview="onSheetPreview"
    />

    <BottomSheet v-if="sockSheetOpen" title="选择袜版" subtitle="先选板型，再点尺寸即可在当前页面预览" @close="sockSheetOpen = false">
      <view class="sock-pick">
        <view v-if="sockFamilies.length > 1" class="sock-fam-tabs">
          <view
            v-for="f in sockFamilies"
            :key="f"
            :class="['sock-fam-tab', { active: activeSockFamily === f }]"
            @tap="activeSockFamily = f"
          >{{ f }}</view>
        </view>
        <scroll-view scroll-y class="sock-pick-list" :show-scrollbar="false">
          <view
            v-for="s in shownSockPicks"
            :key="s.id"
            :class="['sock-pick-item', { active: s.id === sockTypeId }]"
            @tap="confirmPickSock(s.id)"
          >
            <view class="sp-info">
              <text class="sp-name">{{ sockPickName(s) }}</text>
              <text class="sp-desc">{{ s.desc }}</text>
            </view>
            <AppIcon v-if="s.id === sockTypeId" name="check" :size="32" color="#8e4f43" />
            <text v-else class="sp-arrow">›</text>
          </view>
        </scroll-view>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { navigateTo } from '@aisock/common/utils'
import type { AiTask } from '@aisock/common/types'
import { SOCK_TYPES } from '@aisock/common'
import { STORAGE_KEYS } from '@aisock/common/constants'
import { aiApi, uploadApi, configApi, catalogApi, parseAiResultUrl, imageProxyUrl } from '@aisock/service'
import { useUserStore } from '@aisock/composition'
import NavBar from '@/components/ui/NavBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SockCanvas from '@/components/editor/SockCanvas.vue'
import AiGenerateSheet from '@/components/editor/AiGenerateSheet.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import { cdnImg } from '@/config/cdn'
import ref1Img from '@/pkg/static/images/ref-1.png'
import ref2Img from '@/pkg/static/images/ref-2.png'
import ref3Img from '@/pkg/static/images/ref-3.png'
import ref4Img from '@/pkg/static/images/ref-4.png'
import ref5Img from '@/pkg/static/images/ref-5.png'

const userStore = useUserStore()
const heroBg = 'linear-gradient(180deg,#8e4f43 0%,#a4675a 42%,#c7a48e 74%,#f7f3ea 100%)'
const emptyColors = { bodyHex: null, weltHex: null, heelHex: null, toeHex: null }
// 袜版预览参数：单张居中、原始比例（与推荐卡一致）
const previewParams = { density: 100, rotation: 0, singleMode: true, tileDensity: 3 }

const printImage = ref<string | null>(null)
// 从「去定制」带入的选中袜型（决定袜版形状）
const sockTypeId = ref<string | null>(null)
const sockCanvasRef = ref<InstanceType<typeof SockCanvas> | null>(null)
const preparingPurchase = ref(false)

interface SockOption {
  id: string
  name: string
  desc: string
  family: string | null
  _id: number
}

const fallbackSockTypes: SockOption[] = SOCK_TYPES.map((s) => ({
  id: s.id,
  name: s.name,
  desc: s.desc,
  family: null,
  _id: 0,
}))
const sockTypes = ref<SockOption[]>(fallbackSockTypes)
const sockSheetOpen = ref(false)
const activeSockFamily = ref('直板')
let sockCatalogLoaded = false
let sockCatalogLoading: Promise<void> | null = null

const selectedSockName = computed(() => sockTypes.value.find((s) => s.id === sockTypeId.value)?.name || '')
const sockFamilies = computed(() => {
  const set = [...new Set(sockTypes.value.map((s) => s.family).filter(Boolean))] as string[]
  return set.sort((a, b) => (a === '直板' ? -1 : b === '直板' ? 1 : 0))
})
const shownSockPicks = computed(() =>
  sockFamilies.value.length ? sockTypes.value.filter((s) => s.family === activeSockFamily.value) : sockTypes.value,
)

function selectDefaultSock() {
  if (sockTypeId.value && sockTypes.value.some((s) => s.id === sockTypeId.value)) {
    activeSockFamily.value = sockTypes.value.find((s) => s.id === sockTypeId.value)?.family || activeSockFamily.value
    return
  }
  const first = sockTypes.value[0]
  if (!first) return
  sockTypeId.value = first.id
  activeSockFamily.value = first.family || '直板'
}

function ensureSockCatalog(): Promise<void> {
  if (sockCatalogLoaded) return Promise.resolve()
  if (!sockCatalogLoading) {
    sockCatalogLoading = catalogApi.listSocks()
      .then((res) => {
        if (res.data?.length) {
          sockTypes.value = res.data.map((s) => ({
            id: s.code || String(s.id),
            name: s.name,
            desc: s.craft || `起订 ${s.min_order} 双`,
            family: s.family ?? null,
            _id: s.id,
          }))
        }
        selectDefaultSock()
      })
      .catch(() => {
        sockTypes.value = fallbackSockTypes
        selectDefaultSock()
      })
      .finally(() => {
        sockCatalogLoaded = true
        sockCatalogLoading = null
      })
  }
  return sockCatalogLoading
}

function sockPickName(s: { name: string; family: string | null }) {
  return s.family ? s.name.replace(new RegExp('^' + s.family + '[·\\s]*'), '') : s.name
}

function goPickSock() {
  ensureSockCatalog()
  sockSheetOpen.value = true
}

function confirmPickSock(sockId: string) {
  sockTypeId.value = sockId
  uni.setStorageSync('aisock_sock_type', sockId)
  sockSheetOpen.value = false
}

interface Ref { bg: string; url?: string }

const LOCAL_REF_IMAGES: Record<string, string> = {
  '/pkg/static/images/ref-1.png': ref1Img,
  '/pkg/static/images/ref-2.png': ref2Img,
  '/pkg/static/images/ref-3.png': ref3Img,
  '/pkg/static/images/ref-4.png': ref4Img,
  '/pkg/static/images/ref-5.png': ref5Img,
}

function resolveRefUrl(cover?: string | null): string | undefined {
  const u = (cover || '').trim()
  if (!u) return undefined
  if (/^https?:/i.test(u)) return u
  const local = u.startsWith('/') ? u : `/${u}`
  // 灵感图是小缩略图，使用构建可追踪的本地资源，避免 CDN 未同步时空白。
  if (LOCAL_REF_IMAGES[local]) return LOCAL_REF_IMAGES[local]
  return cdnImg(local)
}

const FALLBACK_REFS: Ref[] = [
  { bg: 'linear-gradient(135deg,#E9D5C2,#C9A98A)', url: resolveRefUrl('/pkg/static/images/ref-1.png') },
  { bg: 'linear-gradient(135deg,#CFE0D6,#8FB3A0)', url: resolveRefUrl('/pkg/static/images/ref-2.png') },
  { bg: 'linear-gradient(135deg,#E7D2D8,#C293A6)', url: resolveRefUrl('/pkg/static/images/ref-3.png') },
  { bg: 'linear-gradient(135deg,#D8D2E4,#9C8FC4)', url: resolveRefUrl('/pkg/static/images/ref-4.png') },
  { bg: 'linear-gradient(135deg,#E6D7B8,#C6A857)', url: resolveRefUrl('/pkg/static/images/ref-5.png') },
]
const refs = ref<Ref[]>([...FALLBACK_REFS])

interface HistoryItem { id: number; url: string; prompt: string; thumb: string }
const HISTORY_PAGE = 10
const historyItems = ref<HistoryItem[]>([])
const historyTotal = ref(0)
const historyPage = ref(1)
const historyLoading = ref(false)
const historyLoaded = ref(false)

function mapHistoryTask(t: AiTask): HistoryItem | null {
  const url = parseAiResultUrl(t)
  if (!url) return null
  return {
    id: t.id,
    url,
    prompt: (t.prompt || '').trim(),
    thumb: imageProxyUrl(url),
  }
}

async function loadHistory(reset = true) {
  if (!userStore.isLogin) return
  if (historyLoading.value) return
  if (!reset && historyItems.value.length >= historyTotal.value) return
  historyLoading.value = true
  try {
    const page = reset ? 1 : historyPage.value + 1
    const r = await aiApi.listTasks({ pageNum: page, pageSize: HISTORY_PAGE })
    const mapped = (r.data.list || []).map(mapHistoryTask).filter(Boolean) as HistoryItem[]
    historyTotal.value = r.data.total ?? 0
    historyPage.value = page
    historyItems.value = reset ? mapped : [...historyItems.value, ...mapped]
    historyLoaded.value = true
  } catch {
    if (reset) {
      historyItems.value = []
      historyTotal.value = 0
    }
  } finally {
    historyLoading.value = false
  }
}

function onHistoryPick(h: HistoryItem) {
  printImage.value = h.url
  sheetPreview.value = null
  uni.showToast({ title: '已应用到袜版', icon: 'success' })
}

async function loadUploadRefs() {
  try {
    const res = await configApi.getConfigBlock('upload_refs')
    const items = Array.isArray(res.data) ? res.data : []
    if (!items.length) return
    refs.value = items.map((it, i) => ({
      bg: (it.bg as string) || FALLBACK_REFS[i]?.bg || 'linear-gradient(135deg,#E9D5C2,#C9A98A)',
      url: resolveRefUrl(it.cover as string) || FALLBACK_REFS[i]?.url,
    }))
  } catch {
    /* 保留本地兜底 */
  }
}

// 页面加载时加载缓存的图片（从其它入口带入的花型）
onLoad(() => {
  loadUploadRefs()
  const cachedImg = uni.getStorageSync('aisock_upload_image')
  if (cachedImg) {
    printImage.value = cachedImg
    uni.removeStorageSync('aisock_upload_image')
  }
  const presetSock = uni.getStorageSync('aisock_sock_type')
  if (presetSock) {
    sockTypeId.value = String(presetSock)
    uni.removeStorageSync('aisock_sock_type')
  }
  ensureSockCatalog()
})

onShow(() => {
  if (userStore.isLogin) loadHistory(true)
})

function ensureLogin(): boolean {
  if (!userStore.isLogin) {
    // 记录回跳，登录后回到上传页继续
    uni.setStorageSync(STORAGE_KEYS.LOGIN_RETURN_TO, '/pkg/upload/index')
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.reLaunch({ url: '/pages/login/index' }), 600)
    return false
  }
  return true
}

const sheetPreview = ref<string | null>(null)
const stagePreview = computed(() => printImage.value || sheetPreview.value)

function onChoose() {
  if (!ensureLogin()) return
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'], // 支持相册选择 + 实拍
    success: async (res) => {
      const path = res.tempFilePaths?.[0]
      if (!path) return
      printImage.value = path // 先本地预览
      // 上传换永久 URL；失败必须清掉本地临时路径，否则 wxfile:// 流入编辑器落库后封面/印花必然失效
      try {
        uni.showLoading({ title: '上传中…', mask: true })
        const up = await uploadApi.uploadFile(path)
        printImage.value = up.url
      } catch (e) {
        printImage.value = null
        const msg = e instanceof Error ? e.message : '上传失败，请重试'
        uni.showToast({ title: msg, icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
  })
}

function onRef(r: Ref) {
  if (r.url) printImage.value = r.url
  else uni.showToast({ title: '该灵感图待上线', icon: 'none' })
}

function onSheetPreview(path: string) {
  sheetPreview.value = path || null
}

const aiGenOpen = ref(false)
/** 生成花型灵感：就地弹 AI 生成抽屉（不跳页） */
function goGenerate() {
  if (!ensureLogin()) return
  aiGenOpen.value = true
}

/** AI 生成面板提交：意图优化 → 文生图/图生图 → 渲染到袜版预览 */
async function onAiGenerate(rawPrompt: string, refImages: string[] = []) {
  let prompt = rawPrompt.trim()
  if (!prompt) return
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录后再生成', icon: 'none' })
    return
  }
  // 意图分析：把模糊指令优化成高质量提示词，让用户确认后再生成
  try {
    const opt = await aiApi.optimizePrompt(prompt)
    if (opt.data.optimized && opt.data.optimized !== prompt) {
      const pick = await uni.showModal({
        title: 'AI 已优化你的描述',
        content: opt.data.optimized,
        confirmText: '用优化版',
        cancelText: '用原文',
      })
      if (pick.confirm) prompt = opt.data.optimized
    }
  } catch {
    /* 优化失败用原文 */
  }
  try {
    const payload = refImages.length
      ? { type: 'img2img' as const, prompt, refImages, refImage: refImages[0] }
      : { type: 'text2img' as const, prompt }
    const r = await aiApi.generate(payload)
    const url = parseAiResultUrl(r.data)
    if (url) {
      printImage.value = url
      sheetPreview.value = null
      aiGenOpen.value = false
      loadHistory(true)
    } else {
      uni.showToast({ title: r.data.error || '生成失败，请稍后重试', icon: 'none' })
    }
  } catch {
    /* 拦截器已提示 */
  }
}

async function exportSockCover(): Promise<string | null> {
  await nextTick()
  const path = await sockCanvasRef.value?.exportImage?.('png')
  if (!path) return null
  try {
    const up = await uploadApi.uploadFile(path)
    return up.url || null
  } catch {
    return null
  }
}

async function goPurchase(name: string) {
  if (preparingPurchase.value) return
  if (!ensureLogin()) return
  if (!printImage.value) {
    uni.showToast({ title: '请先上传或生成花型', icon: 'none' })
    return
  }
  preparingPurchase.value = true
  try {
    uni.showLoading({ title: '生成袜版预览…', mask: true })
    const sockCover = await exportSockCover()
    const params = [
      `name=${encodeURIComponent(name)}`,
      `cover=${encodeURIComponent(sockCover || printImage.value)}`,
      `printImage=${encodeURIComponent(printImage.value)}`,
    ]
    if (sockTypeId.value) params.push(`sockTypeId=${encodeURIComponent(sockTypeId.value)}`)
    navigateTo(`/pkg/purchase/index?${params.join('&')}`)
  } finally {
    uni.hideLoading()
    preparingPurchase.value = false
  }
}

function onNext() {
  // 直接下单：购买页顶部展示当前袜版成品图，设计数据保留原始花型图。
  goPurchase('定制花型 袜款')
}
function onAddCart() {
  goPurchase('上传花型 袜款')
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.upload {
  height: 100vh;
  background: $mp-bg;
  display: flex;
  flex-direction: column;
}
.up-hero {
  position: relative;
  margin-bottom: -48rpx;
}
.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(43, 31, 20, 0.2), transparent);
}
.hero-head {
  position: relative;
  z-index: 2;
  padding: 8rpx 40rpx 96rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hero-title-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
}
.ht-diamond {
  width: 12rpx;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.85);
  transform: rotate(45deg);
}
.hero-title {
  font-size: 44rpx;
  font-weight: 900;
  color: #fff;
  font-family: $mp-font-art;
  letter-spacing: 0.18em;
}
.hero-sub {
  display: block;
  margin-top: 14rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
  font-family: $mp-font-serif;
}
.up-scroll {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 2;
}
.up-body {
  padding: 24rpx 32rpx calc(160rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.card {
  background: $mp-bg-card;
  border-radius: $mp-radius-xl;
  padding: 28rpx;
  box-shadow: $mp-shadow-sm;
}
.preview-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sock-stage {
  position: relative;
  width: 100%;
  height: 420rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: $mp-radius-lg;
  background: linear-gradient(180deg, #f6efe2 0%, #efe4cc 100%);
}
.sock-select-chip {
  position: absolute;
  left: 16rpx;
  top: 16rpx;
  z-index: 3;
  height: 52rpx;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  border-radius: $mp-radius-pill;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(142, 79, 67, 0.22);
  box-shadow: 0 6rpx 16rpx rgba(94, 60, 30, 0.08);
}
.sock-select-text {
  max-width: 176rpx;
  font-size: 22rpx;
  color: $mp-primary;
  font-family: $mp-font-serif;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.sock-select-arrow {
  font-size: 28rpx;
  line-height: 1;
  color: $mp-primary;
}
.stage-fallback {
  width: 300rpx;
  height: 400rpx;
}
.upload-box {
  width: calc(100% - 24rpx);
  margin-top: 20rpx;
  background: $mp-bg;
  border-radius: $mp-radius-lg;
  padding: 28rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.up-ico {
  width: 80rpx;
  height: 80rpx;
  border-radius: $mp-radius-md;
  background: #fff;
  border: 2rpx dashed $mp-border-strong;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $mp-shadow-sm;
}
.up-main {
  display: block;
  font-size: 28rpx;
  color: $mp-text-primary;
  font-family: $mp-font-serif;
}
.up-tip {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: $mp-text-muted;
}
.block-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $mp-primary;
  font-family: $mp-font-serif;
}
.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.block-more {
  display: flex;
  align-items: center;
  gap: 2rpx;
}
.more-text {
  font-size: 22rpx;
  color: $mp-text-placeholder;
}
.ref-grid {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}
.ref-item {
  flex: 1;
  height: 96rpx;
  border-radius: $mp-radius-xs;
  border: 2rpx solid transparent;
  overflow: hidden;
}
.ref-item.active {
  border-color: $mp-primary;
}
.ref-img {
  width: 100%;
  height: 100%;
}
.history-hint {
  margin-top: 20rpx;
  font-size: 22rpx;
  color: $mp-text-muted;
  text-align: center;
  padding: 16rpx 0;
}
.history-scroll {
  margin-top: 20rpx;
  white-space: nowrap;
}
.history-row {
  display: inline-flex;
  gap: 16rpx;
  padding-bottom: 4rpx;
}
.history-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: $mp-radius-xs;
  overflow: hidden;
  border: 2rpx solid transparent;
  flex-shrink: 0;
  background: $mp-bg;
}
.history-thumb.active {
  border-color: $mp-primary;
}
.history-img {
  width: 100%;
  height: 100%;
  display: block;
}
.gen-pill {
  margin-top: 24rpx;
  height: 80rpx;
  border-radius: $mp-radius-pill;
  border: 1rpx solid $mp-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}
.gen-pill-text {
  font-size: 28rpx;
  color: $mp-primary;
  font-family: $mp-font-serif;
}
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

/* 选择袜版抽屉列表：与 AI 推荐页同逻辑同样式 */
.sock-pick {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.sock-fam-tabs {
  display: flex;
  gap: 8rpx;
  background: #f1ebe0;
  border-radius: 999rpx;
  padding: 6rpx;
}
.sock-fam-tab {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: $mp-text-secondary;
}
.sock-fam-tab.active {
  background: $mp-primary;
  color: #fff;
}
.sock-pick-list {
  max-height: 52vh;
}
.sock-pick-list .sock-pick-item {
  margin-bottom: 16rpx;
}
.sock-pick-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  border: 1rpx solid $mp-border;
  border-radius: 16rpx;
  background: $mp-bg-card;
}
.sock-pick-item.active {
  border-color: $mp-primary;
  background: $mp-primary-soft;
}
.sp-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.sp-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $mp-text-primary;
  font-family: $mp-font-serif;
}
.sp-desc {
  font-size: 22rpx;
  color: $mp-text-muted;
}
.sp-arrow {
  font-size: 36rpx;
  color: $mp-text-muted;
}
</style>
