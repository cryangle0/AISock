<template>
  <view class="rs-mask" @tap="$emit('close')">
    <view class="rs-panel" @tap.stop>
      <view class="rs-grip" />

      <!-- 顶部：当前印花 + 标识 + 修改底色标记 -->
      <view class="rs-head">
        <text class="rs-label">当前印花</text>
        <text v-if="title" class="rs-id">{{ title }}</text>
        <view class="rs-mode">
          <AppIcon name="palette" :size="22" color="#8e4f43" />
          <text class="rs-mode-text">修改底色</text>
        </view>
      </view>

      <!-- 印花大图预览 -->
      <view class="rs-preview">
        <image v-if="currentImage" :src="displayImage(currentImage)" mode="aspectFill" class="rs-img" />
        <view v-else class="rs-img placeholder">
          <AppIcon name="image" :size="64" color="#c8b89a" />
        </view>
      </view>

      <!-- AI 指令 -->
      <view class="rs-cmd">
        <text class="rs-cmd-title">AI 指令</text>
        <input
          v-model="instruction"
          class="rs-input"
          :disabled="busy"
          placeholder="如：将底色修改成绿色 / 整体偏冷色调"
          placeholder-class="rs-ph"
          confirm-type="done"
        />
        <view class="rs-actions">
          <view class="rs-btn ghost" @tap="$emit('close')">取消</view>
          <view :class="['rs-btn primary', { disabled: !instruction.trim() || busy }]" @tap="onConfirm">
            {{ busy && mode === 'recolor' ? '改色中…' : '确认修改' }}
          </view>
        </view>
      </view>

      <!-- 更换印花图片 -->
      <view :class="['rs-replace', { disabled: busy }]" @tap="onReplace">
        <AppIcon name="upload" :size="30" color="#ffffff" />
        <text class="rs-replace-text">{{ busy && mode === 'upload' ? '上传中…' : '更换印花图片' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { aiApi, uploadApi, parseAiResultUrl, imageProxyUrl } from '@aisock/service'
import { useUserStore } from '@aisock/composition'

const props = defineProps<{
  /** 当前印花图 URL（改色基底图） */
  printImage?: string | null
  /** 印花标识：花型名优先，用于顶部胶囊展示 */
  printName?: string
}>()
const emit = defineEmits<{ close: []; applied: [url: string] }>()

const userStore = useUserStore()
const currentImage = ref<string | null>(props.printImage ?? null)
const instruction = ref('')
const busy = ref(false)
const mode = ref<'recolor' | 'upload'>('recolor')

const title = computed(() => {
  const s = (props.printName || '').trim()
  return s.length > 16 ? `${s.slice(0, 16)}…` : s
})

function displayImage(url: string) {
  return imageProxyUrl(url)
}

function ensureLogin(): boolean {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录后再使用', icon: 'none' })
    return false
  }
  return true
}

/** 确认修改：基于当前印花图 + 指令做图生图改底色 */
async function onConfirm() {
  const text = instruction.value.trim()
  if (!text || busy.value) return
  if (!currentImage.value) {
    uni.showToast({ title: '暂无印花图', icon: 'none' })
    return
  }
  if (!ensureLogin()) return
  mode.value = 'recolor'
  busy.value = true
  try {
    const r = await aiApi.remixImage(currentImage.value, text)
    const url = parseAiResultUrl(r.data)
    if (url) {
      currentImage.value = url
      instruction.value = ''
      emit('applied', url)
      uni.showToast({ title: '已修改', icon: 'none' })
      emit('close')
    } else {
      uni.showToast({ title: r.data.error || '改色失败，请稍后重试', icon: 'none' })
    }
  } catch {
    /* 请求拦截器已提示 */
  } finally {
    busy.value = false
  }
}

/** 更换印花图片：从相册选图上传换永久 URL */
async function onReplace() {
  if (busy.value) return
  if (!ensureLogin()) return
  let path = ''
  try {
    const res = await uni.chooseImage({ count: 1, sizeType: ['compressed'] })
    path = res.tempFilePaths?.[0] || ''
  } catch {
    return // 用户取消选择
  }
  if (!path) return
  mode.value = 'upload'
  busy.value = true
  try {
    const up = await uploadApi.uploadFile(path)
    emit('applied', up.url)
    uni.showToast({ title: '印花已更换', icon: 'none' })
    emit('close')
  } catch {
    /* 请求拦截器已提示 */
  } finally {
    busy.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.rs-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(20, 18, 16, 0.55);
  display: flex;
  align-items: flex-end;
}
.rs-panel {
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
  animation: rs-up 0.26s ease;
}
@keyframes rs-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.rs-grip {
  width: 72rpx;
  height: 8rpx;
  border-radius: $mp-radius-pill;
  background: $mp-border;
  margin: 0 auto 24rpx;
}

/* 顶部行 */
.rs-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.rs-label {
  font-size: 28rpx;
  font-weight: 700;
  color: $mp-text-primary;
  font-family: $mp-font-serif;
  flex-shrink: 0;
}
.rs-id {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: 8rpx 20rpx;
  border-radius: $mp-radius-pill;
  background: $mp-bg;
  color: $mp-text-muted;
  font-size: 24rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.rs-mode {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 20rpx;
  border-radius: $mp-radius-pill;
  border: 1rpx solid $mp-border;
  flex-shrink: 0;
}
.rs-mode-text {
  font-size: 24rpx;
  color: $mp-text-strong;
  font-family: $mp-font-serif;
}

/* 印花大图 */
.rs-preview {
  width: 100%;
  height: 420rpx;
  border-radius: $mp-radius-lg;
  overflow: hidden;
  margin-bottom: 24rpx;
}
.rs-img {
  width: 100%;
  height: 100%;
}
.rs-img.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: $mp-bg;
}

/* AI 指令卡 */
.rs-cmd {
  background: $mp-bg;
  border-radius: $mp-radius-md;
  padding: 24rpx;
}
.rs-cmd-title {
  display: block;
  font-size: 24rpx;
  color: $mp-text-muted;
  margin-bottom: 16rpx;
}
.rs-input {
  width: 100%;
  height: 88rpx;
  background: #fff;
  border-radius: $mp-radius-sm;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: $mp-text-primary;
  box-sizing: border-box;
}
.rs-ph {
  color: rgba(138, 131, 120, 0.6);
}
.rs-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}
.rs-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $mp-radius-pill;
  font-size: 28rpx;
  font-weight: 600;
  font-family: $mp-font-serif;
}
.rs-btn.ghost {
  background: #fff;
  color: $mp-text-secondary;
}
.rs-btn.primary {
  background: $mp-primary-deep;
  color: #fff;
}
.rs-btn.primary.disabled {
  opacity: 0.5;
}

/* 更换印花图片 */
.rs-replace {
  margin-top: 24rpx;
  height: 96rpx;
  border-radius: $mp-radius-pill;
  background: $mp-primary-deep;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  box-shadow: 0 12rpx 28rpx rgba(142, 79, 67, 0.32);
}
.rs-replace.disabled {
  opacity: 0.6;
}
.rs-replace-text {
  font-size: 30rpx;
  color: #fff;
  font-family: $mp-font-serif;
}
</style>
