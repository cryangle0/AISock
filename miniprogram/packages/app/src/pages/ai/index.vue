<template>
  <view class="ai">
    <NavBar brand title="爱花型 AI" variant="transparent" />

    <scroll-view
      class="ai-scroll"
      scroll-y
      :enhanced="true"
      :show-scrollbar="false"
      :scroll-into-view="anchor"
      :scroll-with-animation="true"
    >
      <view class="ai-body">
        <!-- 吉祥物问候 -->
        <view class="mascot">
          <view class="mascot-avatar"><image class="ma-img" src="/static/images/ai-avatar.png" mode="aspectFill" /></view>
          <text class="mascot-title">嗨！我是你的袜品推荐官～</text>
          <text class="mascot-sub">帮你找到舒适好穿、风格百搭的心动袜子</text>
        </view>

        <!-- 礼赠场景 -->
        <GiftGrid :items="gifts" :active="selectedGift?.id" @select="onGift" />

        <!-- 对话流 -->
        <view class="chat">
          <ChatMessage
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
            @retry="retryLastMessage(scrollBottom)"
          />

          <!-- 风格选择 -->
          <view v-if="showStyles" class="chat-widget">
            <StyleGrid :items="styles" @confirm="onStylesConfirm" @skip="onStylesSkip" />
          </view>

          <!-- 推荐卡 -->
          <view v-if="showRecommend" class="chat-widget">
            <RecommendCard
              :main="recMain"
              :candidates="candidates"
              :sock-type-id="selectedSockId"
              :sock-name="selectedSockName"
              :preview-hidden="previewBlocked"
              @refresh="onShuffle"
              @pick="recMain = $event"
              @recolor="goRecolor"
              @pick-sock="goPickSock"
              @customize="goCustomize"
              @order="goPurchase"
            />
          </view>
        </view>

        <view id="bottom-anchor" class="anchor" />
      </view>
    </scroll-view>

    <!-- 底部输入 -->
    <view class="ai-foot">
      <ChatInput :disabled="isProcessing" @send="onSend" />
    </view>

    <!-- 袜版选择 抽屉：点「袜版选择」先挑袜型，再带推荐花型进编辑器 -->
    <BottomSheet v-if="sockSheetOpen" title="选择袜版" subtitle="先选板型，再点尺寸即可在花型推荐中预览" @close="sockSheetOpen = false">
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
            :class="['sock-pick-item', { active: s.id === selectedSockId }]"
            @tap="confirmPickSock(s.id)"
          >
            <view class="sp-info">
              <text class="sp-name">{{ sockPickName(s) }}</text>
              <text class="sp-desc">{{ s.desc }}</text>
            </view>
            <AppIcon v-if="s.id === selectedSockId" name="check" :size="32" color="#8e4f43" />
            <text v-else class="sp-arrow">›</text>
          </view>
        </scroll-view>
      </view>
    </BottomSheet>

    <!-- 一键换色 抽屉：当前印花 + AI 指令改底色，就地不跳页 -->
    <RecolorSheet
      v-if="recolorSheetOpen"
      :print-image="recMain.url"
      :print-name="recMain.name"
      @close="recolorSheetOpen = false"
      @applied="onRecolorApply"
    />

    <custom-tab-bar current="editor" />
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { SOCK_TYPES } from '@aisock/common'
import { navigateTo } from '@aisock/common/utils'
import { purchaseRoute, stashCustomizeCover } from '@/domain/catalog'
import { catalogApi, type Tag } from '@aisock/service'
import NavBar from '@/components/ui/NavBar.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import RecolorSheet from '@/components/editor/RecolorSheet.vue'
import { cdnImg } from '@/config/cdn'
import CustomTabBar from '@/components/CustomTabBar.vue'
import GiftGrid, { type GiftItem } from '@/components/ai/GiftGrid.vue'
import StyleGrid, { type StyleItem } from '@/components/ai/StyleGrid.vue'
import RecommendCard, { type Candidate } from '@/components/ai/RecommendCard.vue'
import ChatInput from '@/components/ai/ChatInput.vue'
import ChatMessage from './components/ChatMessage.vue'
import { useAiChat } from './composables/useAiChat'
import { useAiRecommend } from './composables/useAiRecommend'

// ========== 数据配置 ==========
// 视觉兜底：后台「标签管理」只配名称/排序/显隐；渐变与本地图按 code 套用，设计不丢。
const DEFAULT_VISUAL = { bg: 'linear-gradient(135deg,#E3DACB,#C2B49A)', img: '' }
const SCENE_VISUALS: Record<string, { bg: string; img: string }> = {
  lover: { bg: 'linear-gradient(135deg,#E7B7C0,#C77B8E)', img: '/static/images/gift-lover.jpg' },
  bff: { bg: 'linear-gradient(135deg,#CFE0D6,#8FB3A0)', img: '/static/images/gift-bff.jpg' },
  elder: { bg: 'linear-gradient(135deg,#E6D7B8,#C6A857)', img: '/static/images/gift-elder.jpg' },
  self: { bg: 'linear-gradient(135deg,#C9C2E0,#9387C4)', img: '/static/images/gift-self.jpg' },
}
const STYLE_VISUALS: Record<string, { bg: string; img: string }> = {
  floral: { bg: 'linear-gradient(135deg,#F0C9D4,#D98AA0)', img: '/static/images/style-floral.jpg' },
  couple: { bg: 'linear-gradient(135deg,#E7B7C0,#C77B8E)', img: '/static/images/style-couple.jpg' },
  sport: { bg: 'linear-gradient(135deg,#A9D2E0,#5B9BB8)', img: '/static/images/style-sport.jpg' },
  retro: { bg: 'linear-gradient(135deg,#D8C49C,#A8854E)', img: '/static/images/style-retro.jpg' },
  solid: { bg: 'linear-gradient(135deg,#DDD6CB,#B4A98F)', img: '/static/images/style-solid.jpg' },
  cartoon: { bg: 'linear-gradient(135deg,#F2D8A8,#E0A85A)', img: '/static/images/style-cartoon.jpg' },
  illust: { bg: 'linear-gradient(135deg,#CBBBD9,#9B82B8)', img: '/static/images/style-illust.jpg' },
  guochao: { bg: 'linear-gradient(135deg,#D99A8A,#A8503C)', img: '/static/images/style-guochao.jpg' },
  more: { bg: 'linear-gradient(135deg,#E3DACB,#C2B49A)', img: '/static/images/style-more.jpg' },
}

// 「更多」是前端入口（不入库）：固定置于风格末尾；tagId=0 → 不参与标签筛选
const MORE_STYLE: StyleItem = { id: 'more', tagId: 0, name: '更多', bg: STYLE_VISUALS.more.bg, img: cdnImg(STYLE_VISUALS.more.img) }

/** 本地静态图走 CDN；后台 icon_url 为 http 直链 */
function resolveCardImg(url?: string | null, fallbackLocal?: string): string {
  const u = url || fallbackLocal || ''
  if (!u) return ''
  if (/^https?:/i.test(u)) return u
  return cdnImg(u.startsWith('/') ? u : `/${u}`)
}

// 接口失败/为空时的兜底（tagId=0 → 推荐自动回退为不按标签筛选，功能仍可用）
const FALLBACK_GIFTS: GiftItem[] = [
  { id: 'lover', tagId: 0, title: '送爱人/恋人', desc: '甜蜜心意，温暖相伴', bg: SCENE_VISUALS.lover.bg, img: resolveCardImg(SCENE_VISUALS.lover.img) },
  { id: 'bff', tagId: 0, title: '送闺蜜/朋友', desc: '一起出行，默契加倍', bg: SCENE_VISUALS.bff.bg, img: resolveCardImg(SCENE_VISUALS.bff.img) },
  { id: 'elder', tagId: 0, title: '送长辈/家人', desc: '贴心守护，舒服相伴', bg: SCENE_VISUALS.elder.bg, img: resolveCardImg(SCENE_VISUALS.elder.img) },
  { id: 'self', tagId: 0, title: '送给自己', desc: '取悦自己，从脚开始', bg: SCENE_VISUALS.self.bg, img: resolveCardImg(SCENE_VISUALS.self.img) },
]
const FALLBACK_STYLES: StyleItem[] = [
  { id: 'floral', tagId: 0, name: '浪漫花卉', bg: STYLE_VISUALS.floral.bg, img: resolveCardImg(STYLE_VISUALS.floral.img) },
  { id: 'couple', tagId: 0, name: '爱心情侣', bg: STYLE_VISUALS.couple.bg, img: resolveCardImg(STYLE_VISUALS.couple.img) },
  { id: 'sport', tagId: 0, name: '运动活力', bg: STYLE_VISUALS.sport.bg, img: resolveCardImg(STYLE_VISUALS.sport.img) },
  { id: 'retro', tagId: 0, name: '复古格纹', bg: STYLE_VISUALS.retro.bg, img: resolveCardImg(STYLE_VISUALS.retro.img) },
  { id: 'solid', tagId: 0, name: '简约纯色', bg: STYLE_VISUALS.solid.bg, img: resolveCardImg(STYLE_VISUALS.solid.img) },
  { id: 'cartoon', tagId: 0, name: '萌趣卡通', bg: STYLE_VISUALS.cartoon.bg, img: resolveCardImg(STYLE_VISUALS.cartoon.img) },
  { id: 'illust', tagId: 0, name: '艺术插画', bg: STYLE_VISUALS.illust.bg, img: resolveCardImg(STYLE_VISUALS.illust.img) },
  { id: 'guochao', tagId: 0, name: '国潮纹样', bg: STYLE_VISUALS.guochao.bg, img: resolveCardImg(STYLE_VISUALS.guochao.img) },
  MORE_STYLE,
]

// 后台可配：礼赠场景 / 风格（空或失败时用本地兜底，保证不空白）
const gifts = ref<GiftItem[]>([...FALLBACK_GIFTS])
const styles = ref<StyleItem[]>([...FALLBACK_STYLES])

function toGift(t: Tag): GiftItem {
  const v = SCENE_VISUALS[t.code] || DEFAULT_VISUAL
  return { id: t.code, tagId: t.id, title: t.name, desc: t.description || '', bg: v.bg, img: resolveCardImg(t.icon_url, v.img) }
}
function toStyle(t: Tag): StyleItem {
  const v = STYLE_VISUALS[t.code] || DEFAULT_VISUAL
  return { id: t.code, tagId: t.id, name: t.name, bg: v.bg, img: resolveCardImg(t.icon_url, v.img) }
}

let tagsLoaded = false
async function loadTags() {
  try {
    const [sceneRes, styleRes] = await Promise.all([
      catalogApi.listTags('scene'),
      catalogApi.listTags('style'),
    ])
    const scenes = sceneRes.data || []
    const sts = styleRes.data || []
    if (scenes.length) gifts.value = scenes.map(toGift)
    // 真实风格 + 末尾固定「更多」入口
    if (sts.length) styles.value = [...sts.map(toStyle), MORE_STYLE]
    tagsLoaded = true
  } catch {
    /* 保留本地兜底 */
  }
}
onShow(() => {
  if (!tagsLoaded) loadTags()
  ensureCatalog().then(selectDefaultSock)
})

// ========== Composables ==========
const { messages, context, isProcessing, sendMessage, setScene, setStyles, retryLastMessage } = useAiChat()
const { recommend, shuffle, isRecommending } = useAiRecommend()

// ========== 状态 ==========
const selectedGift = ref<GiftItem | null>(null)
const showStyles = ref(false)
const showRecommend = ref(false)
const anchor = ref('')
const recMain = ref<Candidate>({ id: 'main', name: '推荐花型', bg: 'linear-gradient(135deg,#C9B89A,#8E4F43)', url: cdnImg('/static/images/rec-main.webp') })
const candidates = ref<Candidate[]>([])
// 已选风格标签 id（真实筛选用；「更多」等 tagId=0 不计入）
const selectedStyleTagIds = ref<number[]>([])

// ========== 滚动控制 ==========
function scrollBottom() {
  nextTick(() => {
    anchor.value = ''
    nextTick(() => { anchor.value = 'bottom-anchor' })
  })
}

// ========== 交互逻辑 ==========

/** 选择礼赠场景 */
async function onGift(g: GiftItem) {
  if (isProcessing.value) return
  
  selectedGift.value = g
  showStyles.value = false
  showRecommend.value = false
  selectedStyleTagIds.value = []
  
  // 更新上下文
  setScene(g.id)
  
  // 发送用户选择并获取 AI 回复
  await sendMessage(g.title, scrollBottom)
  
  // 显示风格选择
  showStyles.value = true
  scrollBottom()
}

/** 确认风格选择 */
async function onStylesConfirm(ids: string[]) {
  if (isProcessing.value) return
  showStyles.value = false

  const selectedStyles = styles.value.filter((s) => ids.includes(s.id))
  const names = selectedStyles.map((s) => s.name)
  // 记录风格标签 id（真实筛选用，排除「更多」等 tagId=0）
  selectedStyleTagIds.value = selectedStyles.map((s) => s.tagId).filter((n) => n > 0)
  const userMessage = names.length ? `我喜欢：${names.join('、')}` : '需要推荐'

  // 更新上下文：存风格「名称」（对话文案按名称匹配）
  setStyles(names)

  // 发送用户选择并获取 AI 回复（结构化选择，无需消耗 AI 配额）
  await sendMessage(userMessage, scrollBottom)

  // 调用智能推荐
  await loadRecommendations()
}

/** 跳过风格选择 */
async function onStylesSkip() {
  if (isProcessing.value) return
  showStyles.value = false
  selectedStyleTagIds.value = []

  await sendMessage('直接推荐吧', scrollBottom)
  await loadRecommendations()
}

/** 用户文本输入（自由文本 → 调用真实 AI 提炼意图） */
async function onSend(text: string) {
  if (isProcessing.value) return
  
  showStyles.value = false
  await sendMessage(text, scrollBottom, { useAi: true })
  await loadRecommendations()
}

/** 加载推荐结果 */
async function loadRecommendations() {
  try {
    const recommendation = await recommend(
      {
        sceneCode: context.value.scene,
        sceneTagId: selectedGift.value?.tagId,
        styleTagIds: selectedStyleTagIds.value,
        keyword: context.value.intent || undefined,
      },
      3,
    )

    candidates.value = recommendation.candidates.map(c => ({
      id: c.id,
      name: c.name,
      bg: 'linear-gradient(135deg,#CFE0D6,#7FA890)',
      url: c.imageUrl,
    }))

    // 没有可下单的真实花型时不展示空推荐卡（占位图无法成单）
    if (!candidates.value.length) {
      uni.showToast({ title: '暂无匹配花型，去逛逛花型库吧', icon: 'none' })
      return
    }
    recMain.value = candidates.value[0]

    showRecommend.value = true
    scrollBottom()
  } catch (error) {
    console.error('Failed to load recommendations:', error)
    uni.showToast({ title: '推荐加载失败', icon: 'none' })
  }
}

/** 换一批 */
async function onShuffle() {
  if (isRecommending.value) return
  
  try {
    const currentIds = candidates.value.map(c => c.id)
    const recommendation = await shuffle(
      {
        sceneCode: context.value.scene,
        sceneTagId: selectedGift.value?.tagId,
        styleTagIds: selectedStyleTagIds.value,
        keyword: context.value.intent || undefined,
      },
      3,
      currentIds,
    )
    
    candidates.value = recommendation.candidates.map(c => ({
      id: c.id,
      name: c.name,
      bg: 'linear-gradient(135deg,#CFE0D6,#7FA890)',
      url: c.imageUrl,
    }))
    
    if (candidates.value.length > 0) {
      recMain.value = candidates.value[0]
    }
    
    uni.showToast({ title: '已换一批', icon: 'none', duration: 600 })
  } catch (error) {
    console.error('Failed to shuffle:', error)
  }
}

// ========== 跳转逻辑 ==========

/** 当前推荐花型转为可下单商品（推荐候选 id 即后端花型 id） */
function currentProduct() {
  const pid = Number(recMain.value.id)
  // 已换色/换图视为自定义印花：不再上报来源花型 id（避免来源与实际图不符）
  const usePattern = !recMain.value.customized && Number.isInteger(pid) && pid > 0
  return {
    name: recMain.value.name || '推荐花型',
    cover: recMain.value.url,
    patternId: usePattern ? pid : undefined,
  }
}

/** 袜版选择：弹「选择袜版」（数据来自后台 22 个真实袜版），先挑板型再挑尺寸 */
interface AiSockOption {
  id: string
  name: string
  desc: string
  family: string | null
  _id: number
}

const fallbackSockTypes: AiSockOption[] = SOCK_TYPES.map((s) => ({
  id: s.id,
  name: s.name,
  desc: s.desc,
  family: null,
  _id: 0,
}))
const sockTypes = ref<AiSockOption[]>(fallbackSockTypes)
let sockCatalogLoaded = false
let sockCatalogLoading: Promise<void> | null = null

function ensureCatalog(): Promise<void> {
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
          selectDefaultSock()
        }
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
const sockSheetOpen = ref(false)
const selectedSockId = ref('')
const selectedSockName = computed(() => sockTypes.value.find((s) => s.id === selectedSockId.value)?.name || '')
const sockFamilies = computed(() => {
  const set = [...new Set(sockTypes.value.map((s) => s.family).filter(Boolean))] as string[]
  return set.sort((a, b) => (a === '直板' ? -1 : b === '直板' ? 1 : 0))
})
const activeSockFamily = ref('直板')
const shownSockPicks = computed(() =>
  sockFamilies.value.length ? sockTypes.value.filter((s) => s.family === activeSockFamily.value) : sockTypes.value,
)
function selectDefaultSock() {
  if (selectedSockId.value && sockTypes.value.some((s) => s.id === selectedSockId.value)) return
  const first = sockTypes.value[0]
  if (!first) return
  selectedSockId.value = first.id
  activeSockFamily.value = first.family || '直板'
}
function sockPickName(s: { name: string; family: string | null }) {
  return s.family ? s.name.replace(new RegExp('^' + s.family + '[·\\s]*'), '') : s.name
}
function goPickSock() {
  ensureCatalog()
  sockSheetOpen.value = true
}
/** 选定袜型：直接在「花型推荐」区域回显（不跳页），并记下袜型供去定制/下单沿用 */
function confirmPickSock(sockId: string) {
  selectedSockId.value = sockId
  uni.setStorageSync('aisock_sock_type', sockId)
  sockSheetOpen.value = false
}

/** 一键换色：就地弹「款式衍生」抽屉，基于当前推荐花型生成配色变体，选中后更新预览（不跳页） */
const recolorSheetOpen = ref(false)
// 任一抽屉打开时隐藏推荐卡的原生袜版 canvas，避免它盖住抽屉（微信原生组件层级最高，z-index 无效）
const previewBlocked = computed(() => sockSheetOpen.value || recolorSheetOpen.value)
function goRecolor() {
  recolorSheetOpen.value = true
}

/** 应用换色：用 AI 改色 / 换图后的新印花图刷新推荐卡预览，并标记为自定义印花 */
function onRecolorApply(url: string) {
  recMain.value = { ...recMain.value, url, customized: true }
}

/** 去定制：进入「袜版定制 · 花型设计」页（upload），带上推荐花型，自由上传/生成后定制 */
function goCustomize() {
  stashCustomizeCover(recMain.value.url)
  // 带上当前选中袜型，让「袜版定制」页把选中的袜版 + 花型渲染到上方预览
  if (selectedSockId.value) uni.setStorageSync('aisock_sock_type', selectedSockId.value)
  navigateTo('/pkg/upload/index')
}

/** 一键下单：携带真实花型封面直达购买页，可直接成单 */
function goPurchase() {
  navigateTo(purchaseRoute(currentProduct()))
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.ai {
  height: 100vh;
  box-sizing: border-box;
  /* 预留底部自定义 tabBar 高度（96rpx + 安全区），避免输入框被 tabBar 遮住 */
  padding-bottom: calc(96rpx + env(safe-area-inset-bottom));
  /* 顶部敦煌棕主题渐变（与首页/发现一致）：深棕顶 → 约 540rpx 渐隐到暖米底 */
  background: linear-gradient(
    180deg,
    #8e4f43 0rpx,
    #9c5a4d 150rpx,
    #b67c6a 300rpx,
    rgba(199, 159, 138, 0.5) 420rpx,
    #fdf9f1 540rpx
  );
  display: flex;
  flex-direction: column;
}
.ai-scroll {
  flex: 1;
  min-height: 0;
}
.ai-body {
  padding: 24rpx 32rpx 24rpx;
}

/* 吉祥物（居中，对齐设计稿渲染图） */
.mascot {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28rpx;
  padding-top: 16rpx;
}
.mascot-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: transparent;
  padding: 0;
  box-sizing: border-box;
  box-shadow: 0 8rpx 20rpx rgba(142, 79, 67, 0.3);
}
.ma-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
}
.mascot-title {
  margin-top: 22rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: $mp-text-strong;
  font-family: $mp-font-serif;
  text-align: center;
}
.mascot-sub {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $mp-text-muted;
  font-family: $mp-font-serif;
  text-align: center;
}

/* 对话 */
.chat {
  margin-top: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.msg {
  display: flex;
  align-items: flex-end;
  gap: 14rpx;
}
.msg.ai {
  flex-direction: row;
  justify-content: flex-start;
}
.msg.user {
  flex-direction: row;
  justify-content: flex-end;
}
.msg-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: $mp-header-gradient;
  padding: 4rpx;
  box-sizing: border-box;
  flex-shrink: 0;
}
.bubble {
  max-width: 76%;
  padding: 20rpx 24rpx;
  font-size: 26rpx;
  line-height: 1.6;
  font-family: $mp-font-serif;
}
.bubble.ai {
  background: #fff;
  color: $mp-text-strong;
  border-radius: 16rpx 16rpx 16rpx 4rpx;
  box-shadow: $mp-shadow-sm;
}
.bubble.user {
  background: $mp-primary-deep;
  color: #fff;
  border-radius: 16rpx 16rpx 4rpx 16rpx;
}
/* 等待回复：吉祥物"正在输入"三点动画（主题棕色） */
.typing {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 4rpx 2rpx;
}
.typing-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $mp-primary;
  opacity: 0.4;
  animation: typing-blink 1.2s infinite ease-in-out;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-blink {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4rpx); }
}
.chat-widget {
  margin-top: 4rpx;
}
.anchor {
  height: 1rpx;
}

.ai-foot {
  flex-shrink: 0;
}

/* 选择袜版抽屉列表 */
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
