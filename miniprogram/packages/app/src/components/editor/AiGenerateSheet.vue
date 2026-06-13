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
          <view class="input-spark">
            <AppIcon name="sparkle" :size="36" color="#8e4f43" />
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
import { useVoiceInput } from '@aisock/composition'

const props = defineProps<{ initialPrompt?: string }>()
const emit = defineEmits<{ close: []; generate: [prompt: string] }>()

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
  emit('generate', p)
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
