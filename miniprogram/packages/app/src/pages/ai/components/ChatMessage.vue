<template>
  <view :class="['chat-message', message.role, { error: message.status === 'error' }]">
    <!-- AI 消息显示头像 -->
    <view v-if="message.role === 'ai'" class="message-avatar">
      <image class="avatar-img" src="/static/images/mascot.png" mode="aspectFill" />
    </view>

    <!-- 消息气泡 -->
    <view :class="['message-bubble', message.role]">
      <!-- 正在输入指示器 -->
      <view v-if="message.typing" class="typing-indicator">
        <view class="typing-dot" />
        <view class="typing-dot" />
        <view class="typing-dot" />
      </view>

      <!-- 消息内容 -->
      <text v-else-if="message.content" class="message-text">{{ message.content }}</text>

      <!-- 错误信息 -->
      <view v-if="message.status === 'error'" class="message-error">
        <text class="error-text">{{ message.error || '发送失败' }}</text>
        <view class="error-actions">
          <text class="retry-btn" @tap="$emit('retry')">重试</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { ChatMessage as Message } from '../types/chat'

defineProps<{
  message: Message
}>()

defineEmits<{
  retry: []
}>()
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.chat-message {
  display: flex;
  align-items: flex-end;
  gap: 14rpx;
  margin-bottom: 20rpx;
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-message.ai {
  flex-direction: row;
  justify-content: flex-start;
}

.chat-message.user {
  flex-direction: row;
  justify-content: flex-end;
}

.message-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: $mp-header-gradient;
  padding: 4rpx;
  box-sizing: border-box;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
}

.message-bubble {
  max-width: 76%;
  padding: 20rpx 24rpx;
  font-size: 26rpx;
  line-height: 1.6;
  font-family: $mp-font-serif;
  word-wrap: break-word;
}

.message-bubble.ai {
  background: #fff;
  color: $mp-text-strong;
  border-radius: 16rpx 16rpx 16rpx 4rpx;
  box-shadow: $mp-shadow-sm;
}

.message-bubble.user {
  background: $mp-primary-deep;
  color: #fff;
  border-radius: 16rpx 16rpx 4rpx 16rpx;
}

.chat-message.error .message-bubble.ai {
  background: #fff5f5;
  border: 1rpx solid #ffcccc;
}

.message-text {
  display: block;
  white-space: pre-wrap;
}

/* 正在输入指示器 */
.typing-indicator {
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
  animation: typingBlink 1.2s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBlink {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4rpx);
  }
}

/* 错误样式 */
.message-error {
  margin-top: 8rpx;
}

.error-text {
  display: block;
  font-size: 22rpx;
  color: #d9534f;
  margin-bottom: 8rpx;
}

.error-actions {
  display: flex;
  gap: 12rpx;
}

.retry-btn {
  font-size: 22rpx;
  color: $mp-primary;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: rgba(142, 79, 67, 0.1);
}
</style>
