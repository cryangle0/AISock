<template>
  <view class="chat-input">
    <!-- 输入栏白色面板：与底部 tabBar 同底色，和 tabBar 连成一片 -->
    <view class="input-panel">
      <view class="bar">
        <view
          class="bar-voice"
          :class="{ rec: recording }"
          @touchstart="start"
          @touchmove="move"
          @touchend="stop"
          @touchcancel="cancel"
        >
          <AppIcon name="voice" :size="36" :color="recording ? '#8e4f43' : '#8a8378'" />
        </view>
        <input
          v-model="text"
          class="bar-input"
          :placeholder="recording ? '松开识别…' : '描述想要的花型，发给推荐官'"
          placeholder-class="bar-ph"
          confirm-type="send"
          @confirm="onSend"
        />
        <view class="bar-send" @tap="onSend">
          <AppIcon name="send" :size="34" color="#ffffff" />
        </view>
      </view>
    </view>

    <!-- 录音浮层（敦煌主题：声纹法相 + 声波律动 + 上滑取消） -->
    <VoiceRecordOverlay :visible="recording" :elapsed="elapsed" :will-cancel="willCancel" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import VoiceRecordOverlay from '@/components/ai/VoiceRecordOverlay.vue'
import { useVoiceInput } from '@aisock/composition'

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ send: [text: string] }>()

const text = ref('')
// 按住说话 → 识别文本追加进输入框，用户可二次编辑后发送
const { recording, elapsed, willCancel, start, move, stop, cancel } = useVoiceInput((t) => {
  text.value = text.value ? `${text.value} ${t}` : t
})
function onSend() {
  // AI 回复进行中不发送也不清空，避免用户输入被静默丢弃
  if (props.disabled) {
    uni.showToast({ title: '推荐官回复中，稍等一下哦', icon: 'none' })
    return
  }
  const t = text.value.trim()
  if (!t) return
  emit('send', t)
  text.value = ''
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.chat-input {
  position: relative;
}
.input-panel {
  background: #fff;
  box-shadow: 0 -2rpx 24rpx rgba(94, 60, 30, 0.06);
  padding: 14rpx 24rpx 16rpx;
}
.bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  height: 80rpx;
  padding: 0 20rpx;
  background: $mp-bg;
  border-radius: $mp-radius-pill;
}
.bar-voice {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.bar-voice.rec {
  background: $mp-primary-soft;
  transform: scale(1.1);
}
.bar-input {
  flex: 1;
  font-size: 26rpx;
  color: $mp-text-primary;
}
.bar-ph {
  color: $mp-text-placeholder;
}
.bar-send {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: $mp-primary;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
