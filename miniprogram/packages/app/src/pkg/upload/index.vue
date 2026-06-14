<template>
  <view class="upload">
    <view class="up-hero" :style="{ background: heroBg }">
      <view class="hero-scrim" />
      <NavBar title="袜版定制" show-back variant="transparent" />
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
        <!-- 主预览卡 -->
        <view class="card preview-card">
          <SockPreview :print-image="printImage" :pattern-id="null" :params="{ rotation: 0 }" :colors="emptyColors" />
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
            <view class="block-more" @tap="goDesigns">
              <text class="more-text">查看详情</text>
              <AppIcon name="chevron-right" :size="20" color="#999999" />
            </view>
          </view>
          <view class="ref-grid">
            <view v-for="(r, i) in refs" :key="'h' + i" class="ref-item" :style="{ background: r.bg }" />
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="action-bar">
      <view class="act-btn ghost" @tap="onAddCart">加入购物车</view>
      <view class="act-btn solid" @tap="onNext">下一步</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { navigateTo, switchTab } from '@aisock/common/utils'
import { STORAGE_KEYS } from '@aisock/common/constants'
import { uploadApi } from '@aisock/service'
import { useUserStore } from '@aisock/composition'
import NavBar from '@/components/ui/NavBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SockPreview from '@/components/SockPreview.vue'

const userStore = useUserStore()
const fromAI = ref(false)
const heroBg = 'linear-gradient(180deg,#8e4f43 0%,#a4675a 45%,#c7a48e 100%)'
const emptyColors = { bodyHex: null, weltHex: null, heelHex: null, toeHex: null }

const printImage = ref<string | null>(null)

interface Ref { bg: string; url?: string }
const refs = ref<Ref[]>([
  { bg: 'linear-gradient(135deg,#E9D5C2,#C9A98A)', url: '/pkg/static/images/ref-1.webp' },
  { bg: 'linear-gradient(135deg,#CFE0D6,#8FB3A0)', url: '/pkg/static/images/ref-2.webp' },
  { bg: 'linear-gradient(135deg,#E7D2D8,#C293A6)', url: '/pkg/static/images/ref-3.webp' },
  { bg: 'linear-gradient(135deg,#D8D2E4,#9C8FC4)', url: '/pkg/static/images/ref-4.webp' },
  { bg: 'linear-gradient(135deg,#E6D7B8,#C6A857)', url: '/pkg/static/images/ref-5.webp' },
])

// 页面加载时检查是否从AI助手过来，并加载缓存的图片
onLoad((q?: Record<string, string>) => {
  if (q?.from === 'ai') fromAI.value = true
  const cachedImg = uni.getStorageSync('aisock_upload_image')
  if (cachedImg) {
    printImage.value = cachedImg
    uni.removeStorageSync('aisock_upload_image')
  }
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

function onChoose() {
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
      } catch {
        printImage.value = null
        uni.showToast({ title: '上传失败，请重试', icon: 'none' })
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

function goGenerate() {
  // 进入 AI 设计页生成灵感花型
  switchTab('/pages/ai/index')
}
function goDesigns() {
  if (!ensureLogin()) return
  navigateTo('/pkg/designs/index')
}

function onNext() {
  // 如果从AI助手来，跳到购买页；否则跳到编辑器
  if (fromAI.value) {
    const cover = printImage.value ? `&cover=${encodeURIComponent(printImage.value)}` : ''
    navigateTo(`/pkg/purchase/index?name=${encodeURIComponent('推荐花型 袜款')}${cover}`)
  } else {
    // 把已上传图片带入编辑器渲染到袜版
    if (printImage.value) uni.setStorageSync('aisock_upload_image', printImage.value)
    navigateTo('/pkg/editor/index')
  }
}
function onAddCart() {
  if (!ensureLogin()) return
  const cover = printImage.value ? `&cover=${encodeURIComponent(printImage.value)}` : ''
  navigateTo(`/pkg/purchase/index?name=${encodeURIComponent('上传花型 袜款')}${cover}`)
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
}
.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(43, 31, 20, 0.2), transparent);
}
.hero-head {
  position: relative;
  z-index: 2;
  padding: 8rpx 40rpx 40rpx;
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
.upload-box {
  width: 100%;
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
</style>
