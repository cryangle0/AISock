<template>
  <div class="oa">
    <div class="oa-head">
      <h3 class="sec-title">订单附件</h3>
      <button v-if="editable" class="oa-add" :disabled="uploading" @click="pick">
        {{ uploading ? '上传中…' : '+ 上传图片/文件' }}
      </button>
      <input ref="fileInput" type="file" accept="image/*,application/pdf" hidden @change="onFileChange" />
    </div>

    <div v-if="list.length" class="oa-grid">
      <div v-for="f in list" :key="f.id" class="oa-item">
        <a :href="f.url" target="_blank" rel="noopener" class="oa-link">
          <img v-if="isImage(f)" :src="f.url" :alt="f.name" class="oa-thumb" />
          <span v-else class="oa-file">📄</span>
        </a>
        <span class="oa-name" :title="f.name">{{ f.name }}</span>
        <button v-if="editable" class="oa-del" title="删除" @click="remove(f)">✕</button>
      </div>
    </div>
    <p v-else class="oa-empty">{{ editable ? '可上传设计稿、参考图或补充文件（图片 / PDF，≤10MB）' : '暂无附件' }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { orderApi, uploadApi, type OrderAttachment } from '@/api'

const props = defineProps<{
  orderId: number
  /** 仅待付款/已付款（未进入生产）可增删 */
  editable?: boolean
}>()
const emit = defineEmits<{ toast: [msg: string] }>()

const list = ref<OrderAttachment[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

async function load() {
  if (!props.orderId) return
  try {
    const res = await orderApi.attachments(props.orderId)
    list.value = res.data || []
  } catch {
    /* 忽略 */
  }
}
watch(() => props.orderId, load, { immediate: true })

function isImage(f: OrderAttachment) {
  return (f.mime || '').startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(f.name)
}

function pick() {
  fileInput.value?.click()
}
async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploading.value = true
  try {
    const up = await uploadApi.upload(file)
    await orderApi.addAttachment(props.orderId, { name: up.data.name, url: up.data.url, mime: up.data.mime, size: up.data.size })
    await load()
    emit('toast', '已上传')
  } catch (err) {
    emit('toast', (err as Error).message || '上传失败')
  } finally {
    uploading.value = false
  }
}
async function remove(f: OrderAttachment) {
  if (!confirm(`确认删除「${f.name}」？`)) return
  try {
    await orderApi.removeAttachment(props.orderId, f.id)
    await load()
  } catch (err) {
    emit('toast', (err as Error).message || '删除失败')
  }
}
</script>

<style scoped>
.oa-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.sec-title {
  font-size: 15px;
  font-weight: 700;
}
.oa-add {
  border: 1px solid var(--primary);
  background: var(--bg-card);
  color: var(--primary);
  border-radius: 999px;
  font-size: 12px;
  padding: 5px 12px;
  cursor: pointer;
}
.oa-add:disabled {
  opacity: 0.6;
  cursor: default;
}
.oa-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 12px;
}
.oa-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.oa-link {
  width: 100%;
}
.oa-thumb,
.oa-file {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 96px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--border);
  background: var(--bg-hover);
  font-size: 36px;
}
.oa-name {
  font-size: 11px;
  color: var(--text-3);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.oa-del {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}
.oa-empty {
  font-size: 13px;
  color: var(--text-3);
}
</style>
