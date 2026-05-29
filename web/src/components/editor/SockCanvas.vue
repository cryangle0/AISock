<template>
  <div class="canvas-wrap">
    <!-- 顶部：袜型选择 -->
    <div class="canvas-toolbar">
      <div class="sock-select" @click="sockMenuOpen = !sockMenuOpen">
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
      <span class="canvas-hint">单击袜版区域可定位颜色</span>
    </div>

    <!-- 袜版预览 -->
    <div
      class="canvas-stage"
      :class="{ dragover: isDragover }"
      @dragover.prevent="isDragover = true"
      @dragleave="isDragover = false"
      @drop="onDrop"
    >
      <svg viewBox="0 0 480 640" class="sock-svg">
        <defs>
          <clipPath id="sock-body-clip">
            <path :d="sockPath" />
          </clipPath>
          <pattern v-if="printPatternId" id="sock-print" patternUnits="userSpaceOnUse" :width="patternTile" :height="patternTile" :patternTransform="`rotate(${params.rotation})`">
            <rect :width="patternTile" :height="patternTile" :fill="patternBg" />
            <circle :cx="patternTile / 2" :cy="patternTile / 2" :r="patternTile / 4" :fill="patternFg" />
          </pattern>
        </defs>

        <g clip-path="url(#sock-body-clip)">
          <!-- 底色分区 -->
          <rect x="100" y="60" width="280" height="44" :fill="weltColor" />
          <rect x="100" y="104" width="280" height="56" :fill="cuffColor" />
          <rect x="100" y="160" width="280" height="320" :fill="bodyColor" />
          <rect x="100" y="478" width="280" height="120" :fill="toeColor" />
          <!-- 印花覆盖 body 区 -->
          <image v-if="printImageUrl" :href="printImageUrl" x="100" y="160" width="280" height="320" preserveAspectRatio="xMidYMid slice" :transform="`rotate(${params.rotation} 240 320)`" :style="{ opacity: 1 }" />
          <rect v-else-if="printPatternId" x="100" y="160" width="280" height="320" fill="url(#sock-print)" />
        </g>

        <!-- 区域可点击热区 -->
        <g class="regions" fill="transparent">
          <rect x="100" y="60" width="280" height="44" @click="clickRegion('welt')" />
          <rect x="100" y="104" width="280" height="56" @click="clickRegion('welt')" />
          <rect x="100" y="160" width="280" height="320" @click="clickRegion('body')" />
          <rect x="100" y="478" width="280" height="120" @click="clickRegion('toe')" />
        </g>

        <!-- 袜版轮廓 -->
        <path :d="sockPath" fill="none" stroke="rgba(43,31,20,0.18)" stroke-width="2" />
      </svg>

      <div v-if="!printImageUrl && !printPatternId" class="drop-hint">
        <div class="drop-icon">🧦</div>
        <p>把花型拖到这里</p>
        <small>从左侧花型库拖入，或点右侧「上传印花」</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SOCK_TYPES, PATTERN_LIST } from '@/data/editor'

const props = defineProps<{
  sockTypeId: string
  printImageUrl: string | null
  printPatternId: string | null
  params: { density: number; rotation: number; singleMode: boolean }
  colors: { bodyHex: string | null; weltHex: string | null; heelHex: string | null; toeHex: string | null }
}>()

const emit = defineEmits<{
  'update:sockTypeId': [id: string]
  regionClick: [region: string]
  dropPattern: [patternId: string, name: string]
  dropImage: [url: string, name: string]
}>()

const sockTypes = SOCK_TYPES
const sockMenuOpen = ref(false)
const isDragover = ref(false)

const sockPath =
  'M100 60 L380 60 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z'

const currentSock = computed(() => sockTypes.find((s) => s.id === props.sockTypeId) || sockTypes[0])

const DEFAULT_BG = '#efe4cc'
const bodyColor = computed(() => props.colors.bodyHex || DEFAULT_BG)
const weltColor = computed(() => props.colors.weltHex || '#d9c8a8')
const cuffColor = computed(() => props.colors.weltHex || '#e3d3b3')
const toeColor = computed(() => props.colors.toeHex || props.colors.heelHex || '#d9c8a8')

const patternDef = computed(() => PATTERN_LIST.find((p) => p.id === props.printPatternId))
const patternBg = computed(() => patternDef.value?.bg || '#fff')
const patternFg = computed(() => patternDef.value?.fg || '#d4376b')
const patternTile = computed(() => (props.params.singleMode ? 280 : Math.max(20, 280 / props.params.density * 30)))

function selectSock(id: string) {
  emit('update:sockTypeId', id)
  sockMenuOpen.value = false
}
function clickRegion(region: string) {
  emit('regionClick', region)
}
function onDrop(e: DragEvent) {
  isDragover.value = false
  const patternId = e.dataTransfer?.getData('application/x-aisock-pattern')
  const imageUrl = e.dataTransfer?.getData('application/x-aisock-image')
  const name = e.dataTransfer?.getData('application/x-aisock-name') || ''
  if (patternId) emit('dropPattern', patternId, name)
  else if (imageUrl) emit('dropImage', imageUrl, name)
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
.canvas-hint {
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
.canvas-stage.dragover {
  background: var(--primary-soft);
}
.sock-svg {
  height: 100%;
  max-height: 540px;
  width: auto;
}
.regions rect {
  cursor: pointer;
}
.drop-hint {
  position: absolute;
  text-align: center;
  color: var(--text-3);
  pointer-events: none;
}
.drop-icon {
  font-size: 48px;
}
.drop-hint p {
  font-size: 14px;
  margin-top: 8px;
  color: var(--text-2);
}
.drop-hint small {
  font-size: 12px;
}
</style>
