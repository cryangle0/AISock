<template>
  <div class="canvas-wrap">
    <!-- 顶部：袜型选择 + 提示 -->
    <div class="canvas-toolbar">
      <div class="sock-select" @click.stop="sockMenuOpen = !sockMenuOpen">
        <span class="sock-current">{{ currentSock.name }}</span>
        <span class="sock-caret">▾</span>
        <div v-if="sockMenuOpen" class="sock-menu" @click.stop>
          <button
            v-for="s in sockTypes"
            :key="s.id"
            :class="['sock-opt', { active: s.id === sockTypeId }]"
            @click="selectSock(s.id)"
          >
            <span class="sock-opt-name">{{ s.name }}</span>
            <span class="sock-opt-desc">{{ s.desc }}</span>
          </button>
        </div>
      </div>
      <span v-if="resources.ready && resources.meta.count" class="canvas-meta">
        可印区域 {{ resources.meta.count.toLocaleString() }} px · 单击袜版定位颜色
      </span>
    </div>

    <!-- 袜版预览（真实 canvas 合成） -->
    <div
      class="canvas-stage"
      :class="{ dragover: isDragover, clickable: true }"
      @dragover.prevent="isDragover = true"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
      @click="onCanvasClick"
    >
      <canvas ref="canvasEl" class="sock-canvas" />

      <div v-if="!resources.ready" class="canvas-loading">
        <div class="spinner" />
        <span>正在加载袜版…</span>
      </div>

      <div v-else-if="!hasPrint" class="drop-hint">
        <div class="drop-icon">🧦</div>
        <p>把花型拖到这里</p>
        <small>从左侧素材库 / AI 结果拖入，或点右侧「上传印花」</small>
      </div>

      <div v-if="isDragover" class="drop-mask">
        <div class="drop-pill">松开应用为印花</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { SOCK_TYPES } from '@/data/editor'
import { useSockResources, renderSock, hitTestRegion, loadImage, type SockColors, type SockParams, type SockResources } from '@/engine'

const props = defineProps<{
  sockTypeId: string
  printImageUrl: string | null
  params: SockParams
  colors: SockColors
}>()

const emit = defineEmits<{
  'update:sockTypeId': [id: string]
  regionClick: [region: string]
  dropImage: [url: string, name: string]
  resourceReady: [res: SockResources]
}>()

const sockTypes = SOCK_TYPES
const sockMenuOpen = ref(false)
const isDragover = ref(false)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const patternImg = ref<HTMLImageElement | null>(null)

const sockTypeRef = computed(() => props.sockTypeId)
const { resources } = useSockResources(sockTypeRef)

const currentSock = computed(() => sockTypes.find((s) => s.id === props.sockTypeId) || sockTypes[0])
const hasPrint = computed(() => !!props.printImageUrl)

function draw() {
  if (!resources.value.ready || !canvasEl.value) return
  renderSock(canvasEl.value, resources.value, patternImg.value, props.colors, props.params)
}

// 资源就绪：设置画布尺寸 + 通知外部 + 首绘
watch(
  () => resources.value.ready,
  (ready) => {
    if (!ready || !canvasEl.value) return
    canvasEl.value.width = resources.value.meta.width
    canvasEl.value.height = resources.value.meta.height
    emit('resourceReady', resources.value)
    draw()
  },
  { immediate: true },
)

// 印花变化：加载后重绘
watch(
  () => props.printImageUrl,
  async (url) => {
    patternImg.value = await loadImage(url)
    draw()
  },
  { immediate: true },
)

// 颜色 / 参数变化：直接重绘
watch(() => [props.colors, props.params], draw, { deep: true })

function selectSock(id: string) {
  emit('update:sockTypeId', id)
  sockMenuOpen.value = false
}

function onCanvasClick(e: MouseEvent) {
  const canvas = canvasEl.value
  if (!canvas || !resources.value.ready) return
  const rect = canvas.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height
  const region = hitTestRegion(resources.value, x, y)
  if (region) emit('regionClick', region)
}

function onDragLeave(e: DragEvent) {
  if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return
  isDragover.value = false
}

function onDrop(e: DragEvent) {
  isDragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (ev) => emit('dropImage', ev.target?.result as string, file.name.replace(/\.[^.]+$/, ''))
    reader.readAsDataURL(file)
    return
  }
  const imageUrl = e.dataTransfer?.getData('application/x-aisock-image')
  const patternId = e.dataTransfer?.getData('application/x-aisock-pattern')
  const name = e.dataTransfer?.getData('application/x-aisock-name') || ''
  if (imageUrl) emit('dropImage', imageUrl, name)
  else if (patternId) emit('dropImage', `pattern:${patternId}`, name)
}

// 暴露给父组件：取快照 / 下载
function getDataURL(): string {
  try {
    return canvasEl.value?.toDataURL('image/png') || ''
  } catch {
    return ''
  }
}
function download(filename = `袜版印花_${Date.now()}.png`) {
  const url = getDataURL()
  if (!url) return
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
}
defineExpose({ getDataURL, download })

function closeMenu() {
  sockMenuOpen.value = false
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', closeMenu)
  onBeforeUnmount(() => document.removeEventListener('click', closeMenu))
}
</script>

<style scoped>
.canvas-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}
.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
}
.sock-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.sock-caret {
  color: var(--text-3);
}
.sock-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 200px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  padding: 6px;
  z-index: 20;
}
.sock-opt {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
}
.sock-opt:hover {
  background: var(--bg-hover);
}
.sock-opt.active {
  background: var(--primary-soft);
}
.sock-opt-name {
  font-size: 13px;
  font-weight: 600;
}
.sock-opt.active .sock-opt-name {
  color: var(--primary);
}
.sock-opt-desc {
  font-size: 11px;
  color: var(--text-3);
}
.canvas-meta {
  font-size: 12px;
  color: var(--text-3);
}
.canvas-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
  transition: background 0.15s;
}
.canvas-stage.clickable {
  cursor: pointer;
}
.canvas-stage.dragover {
  background: var(--primary-soft);
}
.sock-canvas {
  max-height: 540px;
  max-width: 100%;
  height: auto;
  width: auto;
  object-fit: contain;
}
.canvas-loading,
.drop-hint {
  position: absolute;
  text-align: center;
  color: var(--text-3);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.drop-icon {
  font-size: 48px;
}
.drop-hint p {
  font-size: 14px;
  color: var(--text-2);
}
.drop-hint small {
  font-size: 12px;
}
.drop-mask {
  position: absolute;
  inset: 12px;
  border: 2px dashed var(--primary);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(148, 109, 96, 0.08);
  pointer-events: none;
}
.drop-pill {
  background: var(--primary);
  color: #fff;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}
</style>
