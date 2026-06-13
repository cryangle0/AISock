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
          <view class="mascot-avatar"><image class="ma-img" src="/static/images/mascot.png" mode="aspectFill" /></view>
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
      <ChatInput :cats="cats" :disabled="isProcessing" @send="onSend" @cat="onCat" />
    </view>

    <custom-tab-bar current="editor" />
  </view>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { navigateTo } from '@aisock/common/utils'
import { purchaseRoute, stashCustomizeCover } from '@/domain/catalog'
import NavBar from '@/components/ui/NavBar.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import GiftGrid, { type GiftItem } from '@/components/ai/GiftGrid.vue'
import StyleGrid, { type StyleItem } from '@/components/ai/StyleGrid.vue'
import RecommendCard, { type Candidate } from '@/components/ai/RecommendCard.vue'
import ChatInput, { type Cat } from '@/components/ai/ChatInput.vue'
import ChatMessage from './components/ChatMessage.vue'
import { useAiChat } from './composables/useAiChat'
import { useAiRecommend } from './composables/useAiRecommend'

// ========== 数据配置 ==========
const gifts: GiftItem[] = [
  { id: 'lover', title: '送爱人/恋人', desc: '甜蜜心意，温暖相伴', bg: 'linear-gradient(135deg,#E7B7C0,#C77B8E)', img: '/static/images/gift-lover.jpg' },
  { id: 'bff', title: '送闺蜜/朋友', desc: '一起出行，默契加倍', bg: 'linear-gradient(135deg,#CFE0D6,#8FB3A0)', img: '/static/images/gift-bff.jpg' },
  { id: 'elder', title: '送长辈/家人', desc: '贴心守护，舒服相伴', bg: 'linear-gradient(135deg,#E6D7B8,#C6A857)', img: '/static/images/gift-elder.jpg' },
  { id: 'self', title: '送给自己', desc: '取悦自己，从脚开始', bg: 'linear-gradient(135deg,#C9C2E0,#9387C4)', img: '/static/images/gift-self.jpg' },
]

const styles: StyleItem[] = [
  { id: 'floral', name: '浪漫花卉', bg: 'linear-gradient(135deg,#F0C9D4,#D98AA0)', img: '/static/images/style-floral.jpg' },
  { id: 'couple', name: '爱心情侣', bg: 'linear-gradient(135deg,#E7B7C0,#C77B8E)', img: '/static/images/style-couple.jpg' },
  { id: 'sport', name: '运动活力', bg: 'linear-gradient(135deg,#A9D2E0,#5B9BB8)', img: '/static/images/style-sport.jpg' },
  { id: 'retro', name: '复古格纹', bg: 'linear-gradient(135deg,#D8C49C,#A8854E)', img: '/static/images/style-retro.jpg' },
  { id: 'solid', name: '简约纯色', bg: 'linear-gradient(135deg,#DDD6CB,#B4A98F)', img: '/static/images/style-solid.jpg' },
  { id: 'cartoon', name: '萌趣卡通', bg: 'linear-gradient(135deg,#F2D8A8,#E0A85A)', img: '/static/images/style-cartoon.jpg' },
  { id: 'illust', name: '艺术插画', bg: 'linear-gradient(135deg,#CBBBD9,#9B82B8)', img: '/static/images/style-illust.jpg' },
  { id: 'guochao', name: '国潮纹样', bg: 'linear-gradient(135deg,#D99A8A,#A8503C)', img: '/static/images/style-guochao.jpg' },
  { id: 'more', name: '更多', bg: 'linear-gradient(135deg,#E3DACB,#C2B49A)', img: '/static/images/style-more.jpg' },
]

const cats: Cat[] = [
  { id: 'sport', name: '运动袜', icon: 'sport' },
  { id: 'couple', name: '情侣袜', icon: 'love' },
  { id: 'crew', name: '中筒袜', icon: 'socks' },
  { id: 'gift', name: '礼盒装', icon: 'gift' },
]

// ========== Composables ==========
const { messages, context, isProcessing, sendMessage, setScene, setStyles, retryLastMessage } = useAiChat()
const { recommend, shuffle, isRecommending } = useAiRecommend()

// ========== 状态 ==========
const selectedGift = ref<GiftItem | null>(null)
const showStyles = ref(false)
const showRecommend = ref(false)
const anchor = ref('')
const recMain = ref<Candidate>({ id: 'main', name: '推荐花型', bg: 'linear-gradient(135deg,#C9B89A,#8E4F43)', url: '/static/images/rec-main.jpg' })
const candidates = ref<Candidate[]>([])

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

  const names = styles.filter((s) => ids.includes(s.id)).map((s) => s.name)
  const userMessage = names.length ? `我喜欢：${names.join('、')}` : '需要推荐'

  // 更新上下文：存风格「名称」（推荐与文案逻辑均按名称匹配）
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

/** 快捷分类 */
function onCat(c: Cat) {
  onSend(`想要${c.name}`)
}

/** 加载推荐结果 */
async function loadRecommendations() {
  try {
    const recommendation = await recommend(
      context.value.intent || '',
      context.value.scene,
      context.value.styles,
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
      context.value.intent || '',
      context.value.scene,
      context.value.styles,
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
  return {
    name: recMain.value.name || '推荐花型',
    cover: recMain.value.url,
    patternId: Number.isInteger(pid) && pid > 0 ? pid : undefined,
  }
}

/** 袜版选择：带上推荐图，跳转到 upload 页面选择袜版 */
function goPickSock() {
  stashCustomizeCover(recMain.value.url)
  navigateTo('/pkg/upload/index')
}

/** 一键换色：带上推荐图，进入编辑器做改色/微调 */
function goRecolor() {
  stashCustomizeCover(recMain.value.url)
  navigateTo('/pkg/editor/index')
}

/** 去定制：把推荐官收集到的意图带入编辑器 */
function goCustomize() {
  const parts: string[] = []
  if (recMain.value.name && recMain.value.name !== '推荐花型') parts.push(recMain.value.name)
  if (context.value.intent) parts.push(context.value.intent)
  const prompt = parts.join('，')
  if (prompt) uni.setStorageSync('aisock_ai_prompt', prompt)
  navigateTo('/pkg/editor/index')
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
  background: $mp-header-gradient;
  padding: 6rpx;
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
</style>
