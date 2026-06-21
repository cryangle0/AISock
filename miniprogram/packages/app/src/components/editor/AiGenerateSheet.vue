<template>
  <view class="ai-mask" @tap="$emit('close')">
    <view class="ai-panel" @tap.stop>
      <view class="ai-grip" />
      <text class="ai-heading">AI 灵感生成</text>

      <!-- 风格标签 -->
      <scroll-view scroll-x class="tag-row" :show-scrollbar="false">
        <view
          v-for="t in tags"
          :key="t"
          :class="['tag', { active: activeTag === t }]"
          @tap="onTag(t)"
        >
          {{ t }}
        </view>
      </scroll-view>

      <!-- 输入区 -->
      <view class="input-card">
        <view class="input-head">
          <view class="input-spark" @tap="onPickImage">
            <AppIcon name="upload" :size="36" color="#8e4f43" />
          </view>
          <textarea
            v-model="prompt"
            class="input-area"
            :maxlength="200"
            placeholder="请输入您的创作灵感，如：'江南烟雨，墨色流淌，点缀淡粉桃花…'"
            placeholder-class="input-ph"
            auto-height
          />
        </view>
        <view v-if="refImages.length" class="ref-grid">
          <view v-for="(img, i) in refImages" :key="`${i}-${img}`" class="ref-item">
            <image class="ref-img" :src="img" mode="aspectFill" />
            <text class="ref-badge">{{ i + 1 }}</text>
            <view class="ref-remove" @tap.stop="removeRef(i)">×</view>
          </view>
          <view v-if="refImages.length < MAX_REF" class="ref-add" @tap="onPickImage">
            <AppIcon name="plus" :size="28" color="#8e4f43" />
          </view>
        </view>
        <text v-if="refImages.length" class="ref-hint">已选 {{ refImages.length }}/{{ MAX_REF }} 张参考图</text>
        <text class="input-count">{{ prompt.length }} / 200</text>
      </view>

      <!-- 按住说话 → 语音转文字 -->
      <view class="voice-bar">
        <view
          class="vb-mic"
          :class="{ rec: recording }"
          @touchstart="start"
          @touchmove="move"
          @touchend="stop"
          @touchcancel="cancel"
        >
          <AppIcon name="voice" :size="34" :color="recording ? '#8e4f43' : '#8a8378'" />
        </view>
        <text class="vb-hint">{{ recording ? '松开识别 · 上滑取消' : '按住说话，自动转文字' }}</text>
      </view>

      <!-- 生成按钮 -->
      <view :class="['gen-btn', { disabled: !prompt.trim() }]" @tap="onGenerate">
        <AppIcon name="sparkle" :size="34" color="#ffffff" />
        <text class="gen-text">立即生成灵感图案</text>
      </view>
    </view>

    <!-- 录音浮层（敦煌主题） -->
    <VoiceRecordOverlay :visible="recording" :elapsed="elapsed" :will-cancel="willCancel" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import VoiceRecordOverlay from '@/components/ai/VoiceRecordOverlay.vue'
import { useVoiceInput, useUserStore } from '@aisock/composition'
import { STORAGE_KEYS } from '@aisock/common/constants'
import { uploadApi } from '@aisock/service'

const props = defineProps<{ initialPrompt?: string }>()
const emit = defineEmits<{
  close: []
  generate: [prompt: string, refImages: string[]]
  /** 本地临时路径预览（选图后、上传完成前） */
  preview: [path: string]
}>()

const userStore = useUserStore()
const MAX_REF = 9
const refImages = ref<string[]>([])

const tags = ['水墨', '几何', '碎花', '国潮', '唐三彩', '极简', '插画']
const activeTag = ref('')
// 支持外部带入初始灵感（如从「AI 设计」推荐官跳转携带的意图描述）
const prompt = ref((props.initialPrompt || '').slice(0, 200))

// 按住说话 → 识别文本追加到提示词
const { recording, elapsed, willCancel, start, move, stop, cancel } = useVoiceInput((t) => {
  prompt.value = (prompt.value ? `${prompt.value} ${t}` : t).slice(0, 200)
})

function onTag(t: string) {
  activeTag.value = activeTag.value === t ? '' : t
  // 把标签作为风格前缀拼入提示词（去重）
  const base = prompt.value.replace(/^[^，,。\s]{1,4}风格[，,、]?/, '').trim()
  prompt.value = activeTag.value ? `${activeTag.value}风格，${base}`.replace(/，$/, '') : base
}

function onGenerate() {
  const p = prompt.value.trim()
  if (!p) return
  emit('generate', p, [...refImages.value])
}

function removeRef(i: number) {
  refImages.value.splice(i, 1)
  if (!refImages.value.length) emit('preview', '')
}

function rememberLoginReturn() {
  try {
    const pages = getCurrentPages()
    const top = pages[pages.length - 1] as { route?: string; options?: Record<string, string> } | undefined
    if (top?.route && !top.route.includes('pages/login/')) {
      const qs = Object.entries(top.options || {})
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&')
      uni.setStorageSync(STORAGE_KEYS.LOGIN_RETURN_TO, `/${top.route}${qs ? `?${qs}` : ''}`)
    }
  } catch {
    /* ignore */
  }
}

function onPickImage() {
  if (!userStore.isLogin) {
    rememberLoginReturn()
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.reLaunch({ url: '/pages/login/index' }), 600)
    return
  }
  const room = MAX_REF - refImages.value.length
  if (room <= 0) {
    uni.showToast({ title: `最多 ${MAX_REF} 张参考图`, icon: 'none' })
    return
  }
  uni.chooseImage({
    count: room,
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const paths = res.tempFilePaths || []
      if (!paths.length) return
      emit('preview', paths[0])
      try {
        uni.showLoading({ title: '上传中…', mask: true })
        for (const path of paths) {
          const up = await uploadApi.uploadFile(path)
          refImages.value.push(up.url)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '上传失败，请重试'
        uni.showToast({ title: msg, icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
  })
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.ai-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(20, 18, 16, 0.55);
  display: flex;
  align-items: flex-end;
}
.ai-panel {
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
  animation: ai-up 0.26s ease;
}
@keyframes ai-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.ai-grip {
  width: 72rpx;
  height: 8rpx;
  border-radius: $mp-radius-pill;
  background: $mp-border;
  margin: 0 auto 20rpx;
}
.ai-heading {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: $mp-text-primary;
  font-family: $mp-font-serif;
  margin-bottom: 20rpx;
}

/* 标签 */
.tag-row {
  white-space: nowrap;
  margin-bottom: 24rpx;
}
.tag {
  display: inline-block;
  padding: 12rpx 32rpx;
  margin-right: 16rpx;
  border-radius: $mp-radius-pill;
  background: $mp-bg;
  color: $mp-text-strong;
  font-size: 28rpx;
  font-family: $mp-font-serif;
}
.tag.active {
  background: $mp-primary;
  color: #fff;
}

/* 输入卡 */
.input-card {
  background: $mp-bg;
  border-radius: $mp-radius-md;
  padding: 24rpx;
}
.input-head {
  display: flex;
  gap: 16rpx;
}
.input-spark {
  width: 64rpx;
  height: 64rpx;
  border-radius: $mp-radius-sm;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: $mp-shadow-sm;
  cursor: pointer;
  overflow: hidden;
}
.spark-thumb {
  width: 100%;
  height: 100%;
}
.ref-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  margin-top: 16rpx;
}
.ref-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: $mp-radius-sm;
  overflow: hidden;
  background: #fff;
  border: 1rpx solid $mp-border;
}
.ref-img { width: 100%; height: 100%; display: block; }
.ref-badge {
  position: absolute;
  left: 8rpx;
  top: 8rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 18rpx;
  line-height: 28rpx;
  text-align: center;
}
.ref-remove {
  position: absolute;
  right: 6rpx;
  top: 6rpx;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 22rpx;
  line-height: 32rpx;
  text-align: center;
}
.ref-add {
  aspect-ratio: 1;
  border-radius: $mp-radius-sm;
  border: 2rpx dashed $mp-border;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ref-hint {
  display: block;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: $mp-text-muted;
}
.input-area {
  flex: 1;
  min-height: 120rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: $mp-text-primary;
}
.input-ph {
  color: rgba(138, 131, 120, 0.6);
}
.input-count {
  display: block;
  text-align: right;
  margin-top: 12rpx;
  font-size: 20rpx;
  color: $mp-text-muted;
}

/* 语音输入条 */
.voice-bar {
  margin-top: 20rpx;
  height: 80rpx;
  border-radius: $mp-radius-pill;
  background: $mp-bg;
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 0 24rpx;
}
.vb-mic {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.vb-mic.rec {
  background: $mp-primary-soft;
  transform: scale(1.1);
}
.vb-hint {
  font-size: 26rpx;
  color: $mp-text-placeholder;
  font-family: $mp-font-serif;
}

/* 生成按钮 */
.gen-btn {
  margin-top: 28rpx;
  height: 96rpx;
  border-radius: $mp-radius-pill;
  background: $mp-primary-deep;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  box-shadow: 0 12rpx 28rpx rgba(142, 79, 67, 0.32);
}
.gen-btn.disabled {
  opacity: 0.5;
}
.gen-text {
  font-size: 32rpx;
  color: #fff;
  font-family: $mp-font-serif;
}
</style>
