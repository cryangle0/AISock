<template>
  <aside class="asset-panel">
    <div class="asset-tabs">
      <button v-for="t in tabs" :key="t.key" :class="['asset-tab', { active: tab === t.key }]" @click="tab = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- 公共库 -->
    <template v-if="tab === 'library'">
      <div class="asset-search">
        <input v-model="query" placeholder="搜索花型" />
      </div>
      <div class="asset-tip">拖拽花型到袜版即可应用，双击直接贴印</div>
      <div class="asset-grid">
        <div
          v-for="p in filteredPatterns"
          :key="p.id"
          class="asset-item"
          draggable="true"
          :title="`${p.name} · 拖到袜版即可应用`"
          @dragstart="onDragStart($event, p.id, p.name)"
          @click="$emit('apply', p.id, p.name)"
        >
          <div class="asset-swatch"><PatternSwatch :pattern-id="p.id" :uid="`a-${p.id}`" /></div>
          <span class="asset-name">{{ p.name }}</span>
        </div>
      </div>
    </template>

    <!-- 我的 -->
    <template v-else-if="tab === 'mine'">
      <button class="mine-upload" @click="pickFile">⬆ 上传到我的素材库</button>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
      <div v-if="mine.length === 0" class="mine-empty">
        <p>个人素材库为空</p>
        <small>上传你喜欢的图片，让设计更随心</small>
      </div>
      <div v-else class="asset-grid">
        <div
          v-for="m in mine"
          :key="m.id"
          class="asset-item"
          draggable="true"
          @dragstart="onDragImageStart($event, m.url, m.name)"
          @click="$emit('applyImage', m.url, m.name)"
        >
          <div class="asset-swatch"><img :src="m.url" :alt="m.name" /></div>
          <span class="asset-name">{{ m.name }}</span>
        </div>
      </div>
    </template>

    <!-- AI 生成（意图分析 + 文生图 + 指令改色）-->
    <template v-else-if="tab === 'ai'">
      <AiAssetTab :current-image="currentImage" @generated="onAiGenerated" @toast="onToast" />
    </template>

    <!-- 历史 -->
    <template v-else>
      <div v-if="history.length === 0" class="history-empty">还没有生成记录，去 AI 生成试一下吧</div>
      <div v-else class="asset-history">
        <div v-for="h in history" :key="h.id" class="history-item">
          <img :src="h.url" :alt="h.prompt" class="history-thumb" />
          <div class="history-info">
            <div class="history-prompt">{{ h.prompt }}</div>
            <div class="history-meta">可应用</div>
          </div>
          <button class="history-apply" @click="$emit('applyImage', h.url, h.prompt)">应用</button>
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PatternSwatch from '@/components/PatternSwatch.vue'
import AiAssetTab from '@/components/editor/AiAssetTab.vue'
import { PATTERN_LIST } from '@/data/editor'

const props = defineProps<{
  /** 当前画布印花图，透传给 AI tab 作为「指令改色」参考图 */
  currentImage?: string | null
}>()

const emit = defineEmits<{
  apply: [patternId: string, name: string]
  applyImage: [url: string, name: string]
  toast: [msg: string]
}>()

const tabs = [
  { key: 'library', label: '公共库' },
  { key: 'mine', label: '我的' },
  { key: 'ai', label: 'AI 生成' },
  { key: 'history', label: '历史' },
]
const tab = ref('library')
const query = ref('')

const currentImage = computed(() => props.currentImage ?? null)

const fileInput = ref<HTMLInputElement | null>(null)
const mine = ref<{ id: number; url: string; name: string }[]>([])
const history = ref<{ id: number; url: string; prompt: string }[]>([])

const filteredPatterns = computed(() =>
  PATTERN_LIST.filter((p) => !query.value || p.name.includes(query.value)),
)

function onDragStart(e: DragEvent, patternId: string, name: string) {
  e.dataTransfer?.setData('application/x-aisock-pattern', patternId)
  e.dataTransfer?.setData('application/x-aisock-name', name)
}
function onDragImageStart(e: DragEvent, url: string, name: string) {
  e.dataTransfer?.setData('application/x-aisock-image', url)
  e.dataTransfer?.setData('application/x-aisock-name', name)
}

function pickFile() {
  fileInput.value?.click()
}
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    mine.value.unshift({ id: Date.now(), url: ev.target?.result as string, name: file.name.replace(/\.[^.]+$/, '') })
  }
  reader.readAsDataURL(file)
  ;(e.target as HTMLInputElement).value = ''
}

/** AI 生成 / 改色成功：记入历史并应用到画布 */
function onAiGenerated(url: string, prompt: string) {
  history.value.unshift({ id: Date.now(), url, prompt })
  emit('applyImage', url, prompt)
  tab.value = 'history'
}
function onToast(msg: string) {
  emit('toast', msg)
}
</script>

<style scoped>
.asset-panel {
  width: 240px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 12px;
}
.asset-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}
.asset-tab {
  flex: 1;
  padding: 7px 0;
  font-size: 12px;
  border: none;
  background: var(--bg-hover);
  border-radius: 8px;
  color: var(--text-2);
}
.asset-tab.active {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
}
.asset-search input {
  width: 100%;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 10px;
  font-size: 12px;
}
.asset-tip {
  font-size: 11px;
  color: var(--text-3);
  margin: 8px 0;
}
.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.asset-item {
  cursor: grab;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-card);
  transition: transform 0.15s;
}
.asset-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}
.asset-swatch {
  aspect-ratio: 1;
}
.asset-swatch img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.asset-name {
  display: block;
  font-size: 11px;
  text-align: center;
  padding: 5px;
  color: var(--text-2);
}
.mine-upload {
  width: 100%;
  height: 36px;
  border: 1px dashed var(--border-strong);
  border-radius: 8px;
  background: var(--bg-hover);
  color: var(--text-2);
  font-size: 12px;
  margin-bottom: 10px;
}
.mine-empty,
.history-empty {
  text-align: center;
  color: var(--text-3);
  font-size: 12px;
  padding: 40px 0;
}
.mine-empty small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
}
.asset-history {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px;
}
.history-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}
.history-info {
  flex: 1;
  min-width: 0;
}
.history-prompt {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-meta {
  font-size: 10px;
  color: var(--text-3);
}
.history-apply {
  font-size: 11px;
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: var(--primary-soft);
  color: var(--primary);
}
</style>
