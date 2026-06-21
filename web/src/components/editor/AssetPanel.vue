<template>
  <aside class="asset-panel">
    <!-- 标签段 公共库/我的/AI生成/历史 -->
    <div class="asset-tabs">
      <button v-for="t in tabs" :key="t.key" :class="['asset-tab', { active: tab === t.key }]" @click="tab = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- 公共库 -->
    <template v-if="tab === 'library'">
      <div class="asset-search">
        <AppIcon name="search" :size="16" color="var(--text-3)" />
        <input v-model="query" placeholder="搜索花型" />
      </div>
      <div class="asset-cats" aria-label="花型分类">
        <button
          :class="['asset-cat', { active: activeCategoryId === null }]"
          @click="activeCategoryId = null"
        >全部</button>
        <button
          v-for="c in categories"
          :key="c.id"
          :class="['asset-cat', { active: activeCategoryId === c.id }]"
          @click="activeCategoryId = c.id"
        >{{ c.name }}</button>
      </div>
      <div class="asset-tip"><AppIcon name="sparkle" :size="11" color="var(--text-3)" /> 拖拽花型到袜版即可应用，双击直接贴印</div>
      <div v-if="filteredPatterns.length" class="asset-grid">
        <div
          v-for="p in filteredPatterns"
          :key="p.key"
          class="asset-item"
          draggable="true"
          :title="`${p.name} · 拖到袜版即可应用`"
          @dragstart="onDragStart($event, p)"
          @click="onPatternClick(p)"
        >
          <PatternSwatch v-if="p.kind === 'builtin' && p.patternId" :pattern-id="p.patternId" :uid="`a-${p.key}`" />
          <img v-else-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="asset-img" />
          <span class="asset-label">{{ p.name }}</span>
        </div>
      </div>
      <div v-else class="asset-empty">没有匹配的花型</div>
    </template>

    <!-- 我的 -->
    <template v-else-if="tab === 'mine'">
      <button class="mine-upload" @click="pickFile"><AppIcon name="upload" :size="14" /> 上传到我的素材库</button>
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
          <img :src="m.url" :alt="m.name" class="asset-img" />
          <span class="asset-label">{{ m.name }}</span>
        </div>
      </div>
    </template>

    <!-- AI 生成 -->
    <template v-else-if="tab === 'ai'">
      <AiAssetTab :current-image="currentImage" @generated="onAiGenerated" @toast="onToast" />
    </template>

    <!-- 历史 -->
    <template v-else>
      <AiHistoryTab
        ref="historyRef"
        class="history-panel"
        :active="tab === 'history'"
        @apply="(url, name) => $emit('applyImage', url, name, true)"
        @toast="onToast"
      />
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PatternSwatch from '@/components/PatternSwatch.vue'
import AiAssetTab from '@/components/editor/AiAssetTab.vue'
import AiHistoryTab from '@/components/editor/AiHistoryTab.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useCatalog, type EditorPattern } from '@/composables/useCatalog'

const props = defineProps<{
  /** 当前画布印花图，透传给 AI tab 作为「指令改色」参考图 */
  currentImage?: string | null
}>()

const emit = defineEmits<{
  apply: [patternId: string, name: string]
  applyImage: [url: string, name: string, fromAi?: boolean]
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
const activeCategoryId = ref<number | null>(null)
const { patterns, categories, ensureLoaded } = useCatalog()

onMounted(() => ensureLoaded())

const currentImage = computed(() => props.currentImage ?? null)

const fileInput = ref<HTMLInputElement | null>(null)
const historyRef = ref<InstanceType<typeof AiHistoryTab> | null>(null)
const mine = ref<{ id: number; url: string; name: string }[]>([])

const filteredPatterns = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return patterns.value.filter((p) => {
    const matchesKeyword = !keyword || p.name.toLowerCase().includes(keyword)
    const matchesCategory = activeCategoryId.value === null || p.categoryId === activeCategoryId.value
    return matchesKeyword && matchesCategory
  })
})

function onPatternClick(p: EditorPattern) {
  if (p.kind === 'image' && p.imageUrl) emit('applyImage', p.imageUrl, p.name)
  else if (p.patternId) emit('apply', p.patternId, p.name)
}

function onDragStart(e: DragEvent, p: EditorPattern) {
  if (p.kind === 'image' && p.imageUrl) {
    e.dataTransfer?.setData('application/x-aisock-image', p.imageUrl)
    e.dataTransfer?.setData('application/x-aisock-name', p.name)
  } else if (p.patternId) {
    e.dataTransfer?.setData('application/x-aisock-pattern', p.patternId)
    e.dataTransfer?.setData('application/x-aisock-name', p.name)
  }
}
function onDragImageStart(e: DragEvent, url: string, name: string) {
  e.dataTransfer?.setData('application/x-aisock-image', url)
  e.dataTransfer?.setData('application/x-aisock-name', name)
}

function pickFile() { fileInput.value?.click() }
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

function onAiGenerated(url: string, prompt: string) {
  historyRef.value?.reload()
  emit('applyImage', url, prompt, true)
  tab.value = 'history'
}
function onToast(msg: string) { emit('toast', msg) }
</script>

<style scoped>
/* 左侧素材栏 288 白 */
.asset-panel {
  width: 288px;
  flex-shrink: 0;
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
}
.asset-panel:has(.history-panel) { overflow: hidden; }
.history-panel { flex: 1; min-height: 0; }
/* 段控 公共库/我的/AI生成/历史：底 #f5faf9 r8，选中白 r4 */
.asset-tabs {
  display: flex;
  gap: 4px;
  background: var(--surface);
  border-radius: var(--r-8);
  padding: 4px;
  margin-bottom: 16px;
}
.asset-tab {
  flex: 1;
  height: 28px;
  font-size: 12px;
  font-weight: 400;
  border-radius: var(--r-8);
  color: var(--text-2);
  transition: all 0.15s;
}
.asset-tab.active { background: var(--bg-card); color: var(--text-strong); font-weight: 500; box-shadow: var(--shadow-sm); }

/* 搜索 */
.asset-search {
  display: flex; align-items: center; gap: 8px;
  height: 48px; padding: 0 14px;
  background: var(--surface); border-radius: var(--r-12);
}
.asset-search input { flex: 1; height: 100%; font-size: 14px; color: var(--text); }
.asset-search input::placeholder { color: var(--text-3); }
.asset-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.asset-cat {
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--bg-card);
  color: var(--text-2);
  font-size: 12px;
  line-height: 28px;
  transition: all 0.15s;
}
.asset-cat:hover { border-color: var(--primary); color: var(--primary); }
.asset-cat.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}
.asset-tip { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-3); margin: 12px 0; }

/* 花型网格 2 列，卡 122 r12，标签浮层 */
.asset-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.asset-item {
  position: relative;
  aspect-ratio: 1;
  cursor: grab;
  border-radius: var(--r-12);
  overflow: hidden;
  background: var(--card-pink);
  transition: transform 0.15s;
}
.asset-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
.asset-item :deep(.pattern-swatch), .asset-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.asset-label {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 4px 8px; font-size: 10px; font-weight: 500; color: #fff;
  background: rgba(0, 0, 0, 0.32);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.mine-upload {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; height: 36px;
  border: 1px dashed var(--border-strong); border-radius: var(--r-8);
  background: var(--surface); color: var(--text-2); font-size: 12px; margin-bottom: 12px;
}
.mine-empty, .history-empty { text-align: center; color: var(--text-3); font-size: 12px; padding: 40px 0; }
.asset-empty { text-align: center; color: var(--text-3); font-size: 12px; padding: 36px 0; }
.mine-empty small { display: block; margin-top: 4px; font-size: 11px; }
.asset-history { display: flex; flex-direction: column; gap: 8px; }
.history-item { display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: var(--r-8); padding: 6px; }
.history-thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
.history-info { flex: 1; min-width: 0; }
.history-prompt { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-meta { font-size: 10px; color: var(--text-3); }
.history-apply { font-size: 11px; padding: 4px 10px; border-radius: 6px; background: var(--primary-soft); color: var(--primary); }
</style>
