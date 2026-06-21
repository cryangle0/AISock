<template>
  <div class="canvas-wrap">
    <!-- 顶部工具条：左 设计名 + 撤销/重做，右 袜版选择 -->
    <div class="canvas-toolbar">
      <div class="tb-left">
        <div class="name-pill">
          <span class="name-text">{{ designName || '未命名袜版' }} · 草稿</span>
        </div>
        <div class="tb-divider" />
        <button class="tb-icon" :disabled="!canUndo" title="撤销" @click="$emit('undo')"><AppIcon name="undo" :size="18" /></button>
        <button class="tb-icon" :disabled="!canRedo" title="重做" @click="$emit('redo')"><AppIcon name="redo" :size="18" /></button>
      </div>

      <div class="sock-select" @click.stop="pickerOpen = !pickerOpen">
        <span class="sock-current">袜版 · {{ currentName }}</span>
        <AppIcon name="chevron-down" :size="16" color="var(--text-3)" />
        <div v-if="pickerOpen" class="sock-popover" @click.stop>
          <SockPicker v-model="pickerValue" @select="onPick" />
        </div>
      </div>
    </div>

    <!-- 袜版预览（矢量 canvas 合成） -->
    <div
      class="canvas-stage"
      :class="{ dragover: isDragover }"
      @dragover.prevent="isDragover = true"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
      @click="onCanvasClick"
    >
      <div class="canvas-board">
        <canvas ref="canvasEl" class="sock-canvas" :style="{ transform: canvasTransform }" />

        <div v-if="loadingGeo" class="canvas-loading">
          <div class="spinner" />
          <span>正在加载袜版…</span>
        </div>
        <div v-else-if="!parsed" class="canvas-loading">
          <span>袜版加载失败，请重试</span>
        </div>
        <div v-else-if="!hasPrint" class="drop-hint">
          <span class="drop-icon"><AppIcon name="image" :size="34" color="var(--text-3)" /></span>
          <p>把花型拖到这里</p>
          <small>从左侧素材库 / AI 结果拖入，或点右侧「上传印花」</small>
        </div>

        <div v-if="isDragover" class="drop-mask">
          <div class="drop-pill">松开应用为印花</div>
        </div>
      </div>

      <!-- 底部缩放 -->
      <div class="zoom-bar" @click.stop>
        <button class="zoom-btn" title="缩小" @click="setZoom(zoom - 10)"><AppIcon name="minus" :size="16" /></button>
        <span class="zoom-val">{{ zoom }}%</span>
        <button class="zoom-btn" title="放大" @click="setZoom(zoom + 10)"><AppIcon name="plus" :size="16" /></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  parseGeometry, renderVectorSock, hitTestVector, loadImage, VECTOR_RENDER_SCALE,
  type ParsedGeometry, type SockColors, type SockParams,
} from '@/engine'
import { useSockCatalog } from '@/composables/useSockCatalog'
import AppIcon from '@/components/ui/AppIcon.vue'
import SockPicker from './SockPicker.vue'

const props = defineProps<{
  sockTypeId: string
  printImageUrl: string | null
  params: SockParams
  colors: SockColors
  designName?: string
  canUndo?: boolean
  canRedo?: boolean
}>()

const emit = defineEmits<{
  'update:sockTypeId': [code: string]
  regionClick: [region: string]
  dropImage: [url: string, name: string]
  geometryReady: [geo: ParsedGeometry | null]
  undo: []
  redo: []
}>()

const { load, getGeometry, findByCode, defaultCode } = useSockCatalog()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const patternImg = ref<HTMLImageElement | null>(null)
const parsed = ref<ParsedGeometry | null>(null)
const loadingGeo = ref(true)
const pickerOpen = ref(false)
const zoom = ref(150)

/** 画布缩放（在 CSS 尺寸基础上再缩放） */
const canvasTransform = computed(() => `scale(${zoom.value / 100})`)

const hasPrint = computed(() => !!props.printImageUrl)
const currentName = computed(() => (findByCode(props.sockTypeId)?.name || '选择袜版').replace(/^(直板|弯板)[·\s]*/, (m) => m))
const pickerValue = computed({ get: () => props.sockTypeId, set: (v: string) => emit('update:sockTypeId', v) })

function setZoom(v: number) { zoom.value = Math.min(400, Math.max(50, Math.round(v / 10) * 10)) }

function draw() {
  if (!parsed.value || !canvasEl.value) return
  renderVectorSock(canvasEl.value, parsed.value, patternImg.value, props.colors, props.params)
}

// 加载某个袜版几何（code 为空/无效时回退到目录首个）
async function loadSock(code: string) {
  loadingGeo.value = true
  await load()
  let target = code
  if (!findByCode(target)) {
    const def = defaultCode()
    if (def) { target = def; emit('update:sockTypeId', def) }
  }
  const geo = await getGeometry(target)
  parsed.value = geo
  loadingGeo.value = false
  emit('geometryReady', geo)
  draw()
}

watch(() => props.sockTypeId, (code) => { loadSock(code) }, { immediate: true })
watch(() => props.printImageUrl, async (url) => { patternImg.value = await loadImage(url); draw() }, { immediate: true })
watch(() => [props.colors, props.params], draw, { deep: true })

function onPick(code: string) {
  pickerOpen.value = false
  if (code !== props.sockTypeId) emit('update:sockTypeId', code)
}

function onCanvasClick(e: MouseEvent) {
  const canvas = canvasEl.value
  if (!canvas || !parsed.value) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const rect = canvas.getBoundingClientRect()
  const gx = ((e.clientX - rect.left) / rect.width) * parsed.value.vw
  const gy = ((e.clientY - rect.top) / rect.height) * parsed.value.vh
  ctx.setTransform(1, 0, 0, 1, 0, 0) // 命中测试用几何坐标系
  const region = hitTestVector(parsed.value, gx, gy, ctx)
  draw() // 还原渲染变换
  if (region) emit('regionClick', region)
}

function onDragLeave(e: DragEvent) {
  if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return
  isDragover.value = false
}
const isDragover = ref(false)
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
  try { return canvasEl.value?.toDataURL('image/png') || '' } catch { return '' }
}
function download(format: 'png' | 'jpg' = 'png') {
  const canvas = canvasEl.value
  if (!canvas) return
  let url = ''
  try { url = format === 'jpg' ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png') } catch { return }
  if (!url) return
  const link = document.createElement('a')
  link.download = `袜版设计_${Date.now()}.${format}`
  link.href = url
  link.click()
}
defineExpose({ getDataURL, download })

function closePicker() { pickerOpen.value = false }
onMounted(() => document.addEventListener('click', closePicker))
onBeforeUnmount(() => document.removeEventListener('click', closePicker))
void VECTOR_RENDER_SCALE
</script>

<style scoped>
.canvas-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; padding: 16px 20px; }
.canvas-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.tb-left { display: flex; align-items: center; gap: 6px; height: 48px; padding: 0 10px 0 14px; background: var(--bg-card); border-radius: var(--r-12); box-shadow: var(--shadow-card); }
.name-pill { display: inline-flex; align-items: center; gap: 6px; }
.name-text { font-size: 16px; font-weight: 400; color: var(--text-strong); white-space: nowrap; }
.tb-divider { width: 1px; height: 16px; background: var(--border-strong); margin: 0 6px; }
.tb-icon { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #4d4540; transition: background 0.15s; }
.tb-icon:hover:not(:disabled) { background: var(--surface); color: var(--text-strong); }
.tb-icon:disabled { color: var(--text-3); cursor: default; }
.sock-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  min-width: 210px;
  justify-content: space-between;
  padding: 0 14px;
  background: var(--bg-card);
  border: 1px solid var(--primary);
  border-radius: var(--r-12);
  font-size: 16px;
  font-weight: 400;
  color: var(--text-strong);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.sock-current { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sock-popover { position: absolute; top: calc(100% + 6px); right: 0; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-12); box-shadow: var(--shadow-md); padding: 12px; z-index: 30; }
.canvas-stage { flex: 1; display: flex; align-items: stretch; justify-content: center; position: relative; min-height: min(78vh, 960px); transition: background 0.15s; }
.canvas-stage.dragover { background: var(--primary-soft); }
.canvas-board { position: relative; flex: 1; width: 100%; display: flex; align-items: center; justify-content: center; min-height: min(72vh, 900px); padding: 24px; box-sizing: border-box; background: var(--bg-card); border-radius: var(--r-hero); box-shadow: var(--shadow-card); overflow: hidden; }
.zoom-bar { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 6px; padding: 4px 6px; background: var(--bg-card); backdrop-filter: blur(6px); border-radius: 999px; box-shadow: var(--shadow-md); z-index: 5; }
.zoom-btn { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--text-2); transition: background 0.15s; }
.zoom-btn:hover { background: var(--bg-hover); color: var(--primary); }
.zoom-val { min-width: 44px; text-align: center; font-size: 12px; font-weight: 700; font-family: var(--font-num); color: var(--text-strong); }
.sock-canvas { height: min(68vh, 1280px); width: auto; max-width: 92%; object-fit: contain; cursor: pointer; transform-origin: center center; }
.canvas-loading, .drop-hint { position: absolute; text-align: center; color: var(--text-3); pointer-events: none; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.drop-icon { width: 40px; height: 40px; border-radius: 4px; background: var(--bg-card); box-shadow: var(--shadow-sm); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.drop-hint p { font-size: 14px; font-weight: 500; color: var(--ink); }
.drop-hint small { font-size: 12px; color: var(--text-mid); }
.drop-mask { position: absolute; inset: 12px; border: 2px dashed var(--primary); border-radius: 16px; display: flex; align-items: center; justify-content: center; background: rgba(148, 109, 96, 0.08); pointer-events: none; }
.drop-pill { background: var(--primary); color: #fff; padding: 8px 18px; border-radius: 999px; font-size: 13px; font-weight: 600; }
</style>
