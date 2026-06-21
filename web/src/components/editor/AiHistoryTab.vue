<template>
  <div class="ai-history">
    <div class="history-search">
      <AppIcon name="search" :size="14" color="var(--text-3)" />
      <input v-model="keyword" type="search" placeholder="搜索提示词" @keydown.enter="onSearch" />
      <button v-if="keyword" type="button" class="search-clear" aria-label="清空" @click="clearSearch">
        <AppIcon name="close" :size="12" color="var(--text-3)" />
      </button>
    </div>

    <div v-if="loading && !items.length" class="history-empty">加载中…</div>
    <div v-else-if="!items.length" class="history-empty">
      {{ keyword ? '没有匹配的记录' : '还没有生成记录，去 AI 生成试一下吧' }}
    </div>
    <div v-else ref="listRef" class="history-scroll">
      <div class="history-list">
        <article v-for="h in items" :key="h.id" class="history-card">
          <div class="history-result-wrap">
            <button type="button" class="history-result" :title="h.prompt || '生成结果'" @click="openPreview(h.url, h.prompt, true)">
              <img :src="displayUrl(h.url)" :alt="h.prompt || '生成结果'" class="history-result-img" />
              <span class="history-zoom"><AppIcon name="search" :size="12" color="#fff" /></span>
            </button>
            <button type="button" class="history-delete" title="删除" @click.stop="openDeleteConfirm(h)">
              <AppIcon name="close" :size="12" color="currentColor" />
            </button>
          </div>
          <div class="history-body">
            <p v-if="h.prompt" class="history-prompt">{{ h.prompt }}</p>
            <p v-else class="history-prompt muted">（无提示词）</p>
            <div v-if="h.refImages.length" class="history-refs">
              <span class="refs-label">参考</span>
              <div class="refs-row">
                <button
                  v-for="(ref, i) in h.refImages"
                  :key="`${h.id}-ref-${i}`"
                  type="button"
                  class="ref-thumb"
                  :title="`参考图 ${i + 1}`"
                  @click.stop="openPreview(ref, `参考图 ${i + 1}`, false)"
                >
                  <img :src="ref" :alt="`参考图 ${i + 1}`" />
                  <span class="ref-num">{{ i + 1 }}</span>
                </button>
              </div>
            </div>
            <div class="history-meta">
              <span>{{ typeLabel(h.type) }}</span>
              <span>{{ formatDate(h.createdAt) }}</span>
            </div>
            <button type="button" class="history-apply" @click="$emit('apply', h.url, h.prompt || 'AI 花型')">应用到袜版</button>
          </div>
        </article>
      </div>
      <div ref="sentinelRef" class="history-sentinel">
        <span v-if="loadingMore">加载更多…</span>
        <span v-else-if="!hasMore && items.length">已加载全部 {{ total }} 条</span>
      </div>
    </div>

    <BaseModal
      v-if="preview"
      :visible="!!preview"
      :title="preview.title"
      size="lg"
      @close="preview = null"
    >
      <img :src="displayUrl(preview.url)" :alt="preview.title" class="preview-img" />
      <template v-if="preview.canApply" #footer>
        <button type="button" class="preview-apply" @click="applyPreview">应用到袜版</button>
      </template>
    </BaseModal>

    <BaseModal
      v-if="deleteTarget"
      :visible="!!deleteTarget"
      title="删除记录"
      subtitle="删除后无法恢复"
      size="sm"
      @close="closeDeleteConfirm"
    >
      <p class="delete-msg">确定删除这条生成记录吗？</p>
      <p v-if="deleteTarget.prompt" class="delete-prompt">{{ deleteTarget.prompt }}</p>
      <template #footer>
        <button type="button" class="delete-cancel" :disabled="deleting" @click="closeDeleteConfirm">取消</button>
        <button type="button" class="delete-confirm" :disabled="deleting" @click="confirmDelete">
          {{ deleting ? '删除中…' : '删除' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { aiApi, type AiTaskResult } from '@/api/index'
import { imageProxyUrl } from '@/engine/imageLoader'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

export interface HistoryItem {
  id: number
  url: string
  prompt: string
  type: string
  refImages: string[]
  createdAt: string
}

const PAGE_SIZE = 10

const props = defineProps<{ active?: boolean }>()
const emit = defineEmits<{ apply: [url: string, name: string]; toast: [msg: string] }>()

const loading = ref(false)
const loadingMore = ref(false)
const items = ref<HistoryItem[]>([])
const total = ref(0)
const pageNum = ref(1)
const keyword = ref('')
const preview = ref<{ url: string; title: string; canApply: boolean } | null>(null)
const deleteTarget = ref<HistoryItem | null>(null)
const deleting = ref(false)
const listRef = ref<HTMLElement | null>(null)
const sentinelRef = ref<HTMLElement | null>(null)

const hasMore = computed(() => items.value.length < total.value)

let searchTimer: ReturnType<typeof setTimeout> | null = null
let observer: IntersectionObserver | null = null

/** OSS 结果图可能扩展名与真实格式不一致，走同源代理按内容嗅探 Content-Type */
function displayUrl(url: string) {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.includes('/api/v1/app/image-proxy')) return url
  return `${imageProxyUrl(url)}&v=2`
}

function parseRefImages(task: AiTaskResult): string[] {
  if (task.ref_images?.length) return task.ref_images
  const raw = task.ref_image
  if (!raw) return []
  if (raw.trim().startsWith('[')) {
    try {
      const arr = JSON.parse(raw) as unknown
      return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === 'string' && !!u) : []
    } catch {
      return []
    }
  }
  return [raw]
}

function mapTask(t: AiTaskResult): HistoryItem | null {
  const urls = t.result_urls
  const url = Array.isArray(urls) ? urls[0] : null
  if (!url || t.status !== 'success') return null
  return {
    id: t.id,
    url,
    prompt: (t.prompt || '').trim(),
    type: t.type || 'text2img',
    refImages: parseRefImages(t),
    createdAt: t.created_at || '',
  }
}

async function fetchPage(page: number, append: boolean) {
  const q = keyword.value.trim()
  const r = await aiApi.tasks({ pageNum: page, pageSize: PAGE_SIZE, q: q || undefined })
  const mapped = (r.data?.list || []).map(mapTask).filter(Boolean) as HistoryItem[]
  total.value = r.data?.total ?? 0
  pageNum.value = page
  items.value = append ? [...items.value, ...mapped] : mapped
}

async function load(reset = true) {
  if (reset) {
    loading.value = true
    pageNum.value = 1
  }
  try {
    await fetchPage(1, false)
  } catch {
    if (reset) {
      items.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    await fetchPage(pageNum.value + 1, true)
  } catch {
    /* 保留已加载内容 */
  } finally {
    loadingMore.value = false
  }
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  load(true)
}

function clearSearch() {
  keyword.value = ''
  load(true)
}

function openDeleteConfirm(h: HistoryItem) {
  deleteTarget.value = h
}

function closeDeleteConfirm() {
  if (deleting.value) return
  deleteTarget.value = null
}

async function confirmDelete() {
  const h = deleteTarget.value
  if (!h || deleting.value) return
  deleting.value = true
  try {
    await aiApi.deleteTask(h.id)
    items.value = items.value.filter((x) => x.id !== h.id)
    total.value = Math.max(0, total.value - 1)
    deleteTarget.value = null
    emit('toast', '已删除')
  } catch {
    emit('toast', '删除失败，请稍后重试')
  } finally {
    deleting.value = false
  }
}

function setupObserver() {
  observer?.disconnect()
  if (!sentinelRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore()
    },
    { root: listRef.value, rootMargin: '120px', threshold: 0 },
  )
  observer.observe(sentinelRef.value)
}

function typeLabel(type: string) {
  if (type === 'img2img' || type === 'remix') return '图生图'
  return '文生图'
}

function formatDate(iso: string) {
  if (!iso) return ''
  return iso.slice(0, 16).replace('T', ' ')
}

function openPreview(url: string, title: string, canApply: boolean) {
  preview.value = { url, title: title || '预览', canApply }
}

function applyPreview() {
  if (!preview.value?.canApply) return
  emit('apply', preview.value.url, preview.value.title)
  preview.value = null
}

onMounted(() => {
  if (props.active !== false) load()
  setupObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (searchTimer) clearTimeout(searchTimer)
})

watch(() => props.active, (v) => {
  if (v) load()
})

watch(keyword, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(true), 350)
})

watch([() => items.value.length, () => hasMore.value], () => {
  setupObserver()
})

defineExpose({ reload: () => load(true) })
</script>

<style scoped>
.ai-history {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.history-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 14px;
  margin-bottom: 12px;
  background: var(--surface);
  border-radius: var(--r-12);
  flex-shrink: 0;
}
.history-search input {
  flex: 1;
  height: 100%;
  font-size: 14px;
  color: var(--text);
  border: none;
  background: transparent;
}
.history-search input::placeholder { color: var(--text-3); }
.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}
.history-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
}
.history-empty { text-align: center; color: var(--text-3); font-size: 12px; padding: 40px 0; }
.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-card {
  border: 1px solid var(--border);
  border-radius: var(--r-12);
  overflow: hidden;
  background: var(--bg-card);
}
.history-result-wrap { position: relative; }
.history-result {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border: none;
  padding: 0;
  cursor: zoom-in;
  background: var(--card-pink);
}
.history-result-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.history-zoom {
  position: absolute; right: 8px; bottom: 8px;
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
}
.history-delete {
  position: absolute; top: 8px; right: 8px;
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255,255,255,.92);
  border: 1px solid var(--border);
  color: var(--text-3);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  z-index: 1;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.history-delete:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.history-body { padding: 10px 12px 12px; }
.history-prompt {
  font-size: 12px; line-height: 1.45; color: var(--text);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden; margin-bottom: 8px;
}
.history-prompt.muted { color: var(--text-3); }
.history-refs { margin-bottom: 8px; }
.refs-label { font-size: 10px; color: var(--text-3); display: block; margin-bottom: 4px; }
.refs-row { display: flex; flex-wrap: wrap; gap: 6px; }
.ref-thumb {
  position: relative;
  width: 44px; height: 44px;
  border-radius: 8px; overflow: hidden;
  border: 1px solid var(--border);
  padding: 0; cursor: zoom-in;
  background: var(--surface);
}
.ref-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ref-num {
  position: absolute; left: 2px; top: 2px;
  min-width: 14px; height: 14px; padding: 0 3px;
  border-radius: 4px; background: rgba(0,0,0,.55);
  color: #fff; font-size: 9px; line-height: 14px; text-align: center;
}
.history-meta {
  display: flex; justify-content: space-between;
  font-size: 10px; color: var(--text-3); margin-bottom: 8px;
}
.history-apply {
  width: 100%; height: 30px;
  border-radius: var(--r-8);
  background: var(--primary-soft); color: var(--primary);
  font-size: 12px; font-weight: 500;
}
.history-sentinel {
  padding: 12px 0 4px;
  text-align: center;
  font-size: 11px;
  color: var(--text-3);
  min-height: 32px;
}
.preview-img {
  width: 100%; max-height: 60vh;
  object-fit: contain; border-radius: var(--r-8);
  background: var(--surface);
}
.preview-apply {
  flex: 1; height: 40px;
  border-radius: var(--r-8);
  background: var(--primary); color: #fff;
  font-size: 14px; font-weight: 600;
}
.delete-msg {
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
}
.delete-prompt {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: var(--r-8);
  background: var(--surface);
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.delete-cancel,
.delete-confirm {
  flex: 1;
  height: 40px;
  border-radius: var(--r-8);
  font-size: 14px;
  font-weight: 600;
}
.delete-cancel {
  background: var(--surface);
  color: var(--text-2);
}
.delete-cancel:disabled,
.delete-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.delete-confirm {
  background: var(--primary);
  color: #fff;
}
</style>
