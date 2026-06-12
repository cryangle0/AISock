<template>
  <view class="feed">
    <scroll-view class="feed-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
      <!-- Hero 头图（对齐 Figma：丛林大图铺满 + 暖色渐变遮罩，文字在最上层）-->
      <view class="hero">
        <image class="hero-img" :src="heroImg" mode="aspectFill" />
        <view class="hero-mask" />
        <view class="hero-fg">
          <NavBar title="发现" brand variant="transparent" />
          <scroll-view scroll-x class="topic-tabs" :show-scrollbar="false">
            <view
              v-for="t in topics"
              :key="t.id"
              :class="['topic', { active: t.id === activeId }]"
              @tap="activeId = t.id"
            >
              <text class="topic-text">{{ t.name }}</text>
              <view v-if="t.id === activeId" class="topic-underline" />
            </view>
          </scroll-view>
        </view>
      </view>

      <view class="feed-body">
        <!-- 主题 Banner 卡（实拍大图 + 云纹标题） -->
        <view class="topic-banner">
          <image class="tb-img" :src="heroImg" mode="aspectFill" />
          <view class="topic-banner-scrim" />
          <view class="tb-ornament">
            <view class="tb-line" />
            <view class="tb-diamond" />
          </view>
          <text class="tb-title">{{ activeTopic.name }}</text>
          <view class="tb-ornament">
            <view class="tb-diamond" />
            <view class="tb-line" />
          </view>
        </view>

        <!-- 主题描述 -->
        <text class="topic-desc">{{ activeTopic.desc }}</text>

        <!-- 商品列表：左模特图 + 中文案 + 右袜款 -->
        <view class="product-list">
          <view
            v-for="p in products"
            :key="p.id"
            class="product-card"
            @tap="goDetail(p)"
          >
            <image v-if="p.bg" class="pc-bg" :src="p.bg" mode="aspectFill" />
            <image v-if="p.model" class="pc-model" :src="p.model" mode="aspectFit" />
            <view class="pc-text">
              <text class="pc-title">{{ p.title }}</text>
              <view class="pc-link">
                <text class="pc-link-text">查看详情</text>
                <AppIcon name="chevron-right" :size="22" color="#222222" />
              </view>
            </view>
            <image v-if="p.socks" class="pc-socks" :src="p.socks" mode="aspectFit" />
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
import NavBar from '@/components/ui/NavBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'

interface Topic { id: string; name: string; desc: string; bg: string; img?: string }
const HERO_IMG = '/static/images/feed-hero.jpg'
const topics: Topic[] = [
  { id: 'wildling', name: '野趣精灵', desc: '少女浪漫美学的梦幻进阶，以妄想世界为核心色彩基调，捕捉年轻群体逃离现实束缚、追寻自由梦想的精神诉求。', bg: 'linear-gradient(135deg,#A8C4B0,#5a8a7d)', img: HERO_IMG },
  { id: 'pastel', name: '帕斯蒂尔', desc: '低饱和马卡龙色系，温柔治愈，糖果般的轻盈质感，适配通勤与日常的百搭风格。', bg: 'linear-gradient(135deg,#E9D5DE,#C9A2B5)' },
  { id: 'painecore', name: '痛核少女', desc: '高对比撞色与解构主义，强烈的情绪张力，属于敢于表达自我的酷感主张。', bg: 'linear-gradient(135deg,#C97B9B,#7B4B6B)' },
  { id: 'pastoral', name: '松弛田园', desc: '大地色与原野绿交织，自然松弛的呼吸感，回归质朴的生活美学。', bg: 'linear-gradient(135deg,#D6C9A0,#9CA87A)' },
  { id: 'preppy', name: '美式学院', desc: '复古格纹与字母元素，经典学院风的青春叙事，干净利落又不失温度。', bg: 'linear-gradient(135deg,#9BB8CC,#5F7FA3)' },
]
const activeId = ref(topics[0].id)
const activeTopic = computed(() => topics.find((t) => t.id === activeId.value) || topics[0])
const heroImg = computed(() => activeTopic.value.img || HERO_IMG)

interface Product { id: string; title: string; bg?: string; model?: string; socks?: string; cover?: string }
const FALLBACK: Product[] = [
  { id: 'f1', title: '野趣精灵 · 蝶舞系列', bg: '/static/images/feed-bg-1.jpg', model: '/static/images/feed-model-1.png', socks: '/static/images/feed-socks-1.png' },
  { id: 'f2', title: '松弛田园 · 花影系列', bg: '/static/images/feed-bg-2.jpg', model: '/static/images/feed-model-2.png', socks: '/static/images/feed-socks-2.png' },
  { id: 'f3', title: '国潮新生 · 祥瑞系列', bg: '/static/images/feed-bg-1.jpg', model: '/static/images/feed-model-2.png', socks: '/static/images/feed-socks-2.png' },
  { id: 'f4', title: '敦煌入梦 · 飞天系列', bg: '/static/images/feed-bg-2.jpg', model: '/static/images/feed-model-1.png', socks: '/static/images/feed-socks-1.png' },
]
const products = ref<Product[]>(FALLBACK)

onShow(async () => {
  try {
    const res = await catalogApi.listFeed()
    if (res.data.length) {
      products.value = res.data.map((a, i) => ({
        id: String(a.id),
        title: a.title,
        model: FALLBACK[i % FALLBACK.length].model,
        socks: FALLBACK[i % FALLBACK.length].socks,
        // 后端文章封面用作卡片淡底；无封面则用兜底花卉底
        bg: a.cover_url || FALLBACK[i % FALLBACK.length].bg,
      }))
    }
  } catch {
    /* 兜底 */
  }
})

function goDetail(p: Product) {
  navigateTo(`/pages/detail/index?id=${p.id}&title=${encodeURIComponent(p.title)}`)
}
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

/* Hero 头图：丛林大图铺满 + 暖色渐变遮罩（对齐 Figma 296px 头部层级） */
.hero {
  position: relative;
  overflow: hidden;
}
.hero-img {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
}
.hero-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  /* 顶部赭红 → 多档平滑过渡 → 底部完全融入奶油底（无硬边、不戛然而止） */
  background: linear-gradient(
    180deg,
    rgba(150, 58, 44, 0.5) 0%,
    rgba(156, 66, 50, 0.46) 46%,
    rgba(176, 110, 90, 0.42) 66%,
    rgba(212, 190, 172, 0.5) 82%,
    rgba(240, 235, 226, 0.86) 93%,
    #f7f3ea 100%
  );
}
.hero-fg {
  position: relative;
  z-index: 2;
  /* 收紧底部间距：让主题 Tab 下方紧挨 banner 卡 */
  padding-bottom: 24rpx;
}
.hero-fg {
  position: relative;
  z-index: 2;
}
.topic-tabs {
  position: relative;
  z-index: 2;
  white-space: nowrap;
  padding: 8rpx 24rpx 28rpx;
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
  padding: 8rpx 32rpx calc(180rpx + env(safe-area-inset-bottom));
}

/* 主题 banner 卡 */
.topic-banner {
  position: relative;
  height: 220rpx;
  border-radius: $mp-radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  overflow: hidden;
  background: #5a8a7d;
  box-shadow: $mp-shadow-md;
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
  background: rgba(43, 31, 20, 0.3);
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
}

.topic-desc {
  display: block;
  margin: 28rpx 24rpx;
  font-size: 26rpx;
  line-height: 1.9;
  color: $mp-text-secondary;
  text-align: center;
  font-family: $mp-font-serif;
}

/* 商品卡：左模特 + 中文案 + 右袜款 */
.product-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.product-card {
  position: relative;
  height: 240rpx;
  border-radius: $mp-radius-md;
  overflow: hidden;
  background: #faf6ee;
  box-shadow: $mp-shadow-sm;
}
.pc-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.22;
}
.pc-model {
  position: absolute;
  left: 8rpx;
  bottom: 0;
  width: 200rpx;
  height: 280rpx;
}
.pc-text {
  position: absolute;
  left: 200rpx;
  right: 188rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
}
.pc-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $mp-text-strong;
  font-family: $mp-font-serif;
  text-align: center;
}
.pc-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}
.pc-link-text {
  font-size: 26rpx;
  color: $mp-text-strong;
  font-family: $mp-font-serif;
}
.pc-socks {
  position: absolute;
  right: 16rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 176rpx;
  height: 210rpx;
}
</style>
