<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-head">
        <div>
          <h3 class="modal-title">分享设计</h3>
          <p class="modal-sub">把这件袜款分享给朋友，邀请一起设计</p>
        </div>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div class="share-card">
          <div class="share-cover" :style="{ background: cover ? `url(${cover}) center/cover` : 'var(--bg-hover)' }">
            <span v-if="!cover">🧦</span>
          </div>
          <div class="share-meta">
            <div class="share-title">{{ design.name || '我的袜版' }}</div>
            <div class="share-sub">爱花型 · AI 袜版定制</div>
            <span class="share-tag">点开即可同款再创作</span>
          </div>
        </div>
        <div class="share-link">
          <span class="link-url">{{ shareLink }}</span>
          <button class="link-copy" @click="onCopy">{{ copied ? '已复制' : '复制' }}</button>
        </div>
        <div class="targets">
          <button v-for="t in targets" :key="t.label" class="target" @click="onShareTo(t.label)">
            <span class="target-icon" :style="{ background: t.bg, color: t.color }">{{ t.emoji }}</span>
            <span>{{ t.label }}</span>
          </button>
        </div>
        <p class="share-tip">分享后好友可一键同款再创作，邀请新用户注册可获得额外 AI 生图次数</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { aiApi } from '@/api'

const props = defineProps<{ design: { name?: string; printName?: string }; cover?: string | null }>()
const emit = defineEmits<{ close: []; shared: [target: string] }>()

const copied = ref(false)
const shareLink = computed(() => `https://aihuaxing.cn/s/${(props.design.printName || props.design.name || 'design').slice(0, 16)}`)
const targets = [
  { label: '微信好友', emoji: '💬', bg: 'rgba(7,193,96,0.12)', color: '#07c160' },
  { label: '朋友圈', emoji: '🌄', bg: 'rgba(26,173,25,0.12)', color: '#1aad19' },
  { label: '群聊', emoji: '👥', bg: 'rgba(58,111,176,0.12)', color: '#3a6fb0' },
]

function onCopy() {
  navigator.clipboard?.writeText(shareLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
async function onShareTo(target: string) {
  try {
    await aiApi.inviteBonus(3)
  } catch {
    /* 忽略 */
  }
  emit('shared', target)
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(43, 31, 20, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal {
  width: 460px;
  max-width: 92vw;
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}
.modal-title {
  font-size: 18px;
  font-weight: 800;
  font-family: var(--font-art);
}
.modal-sub {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 4px;
}
.modal-close {
  border: none;
  background: none;
  font-size: 18px;
  color: var(--text-3);
}
.modal-body {
  padding: 20px 24px;
}
.share-card {
  display: flex;
  gap: 16px;
  background: var(--bg-hover);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.share-cover {
  width: 90px;
  height: 90px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}
.share-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}
.share-title {
  font-size: 16px;
  font-weight: 700;
}
.share-sub {
  font-size: 12px;
  color: var(--text-3);
}
.share-tag {
  align-self: flex-start;
  font-size: 11px;
  color: var(--primary);
  background: var(--primary-soft);
  padding: 3px 10px;
  border-radius: 999px;
}
.share-link {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-hover);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 16px;
}
.link-url {
  flex: 1;
  font-size: 12px;
  color: var(--text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.link-copy {
  border: none;
  background: none;
  color: var(--primary);
  font-size: 12px;
}
.targets {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}
.target {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--text-2);
}
.target-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.share-tip {
  font-size: 11px;
  color: var(--text-3);
  text-align: center;
  line-height: 1.6;
}
</style>
