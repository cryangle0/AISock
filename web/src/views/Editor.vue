<template>
  <div class="sock-editor">
    <AssetPanel @apply="applyPattern" @apply-image="applyImage" />

    <SockCanvas
      v-model:sock-type-id="sockTypeId"
      :print-image-url="printImageUrl"
      :print-pattern-id="printPatternId"
      :params="params"
      :colors="colors"
      @region-click="onRegionClick"
      @drop-pattern="applyPattern"
      @drop-image="applyImage"
    />

    <ParamsPanel
      :print-image-url="printImageUrl"
      :print-pattern-id="printPatternId"
      :print-name="printName"
      :params="params"
      :colors="colors"
      :palette-id="paletteId"
      :palette-strength="paletteStrength"
      :active-region="activeRegion"
      @update:params="params = $event"
      @update:colors="colors = $event"
      @update:palette-id="paletteId = $event"
      @update:palette-strength="paletteStrength = $event"
      @upload-file="onUploadFile"
      @clear="onClear"
      @reset="onReset"
      @save="onSave"
      @order="onOrder"
      @ai-extend="onAiExtend"
      @family-pair="onFamilyPair"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AssetPanel from '@/components/editor/AssetPanel.vue'
import SockCanvas from '@/components/editor/SockCanvas.vue'
import ParamsPanel from '@/components/editor/ParamsPanel.vue'
import { DEFAULT_SOCK_TYPE_ID } from '@/data/editor'
import { designApi } from '@/api'

const router = useRouter()

const DEFAULT_PARAMS = { density: 100, rotation: 0, singleMode: true }
const DEFAULT_COLORS = { bodyHex: null as string | null, weltHex: null as string | null, heelHex: null as string | null, toeHex: null as string | null }

const sockTypeId = ref(DEFAULT_SOCK_TYPE_ID)
const printImageUrl = ref<string | null>(null)
const printPatternId = ref<string | null>(null)
const printName = ref('')
const params = ref({ ...DEFAULT_PARAMS })
const colors = ref({ ...DEFAULT_COLORS })
const paletteId = ref<string | null>(null)
const paletteStrength = ref(80)
const activeRegion = ref<string | null>(null)
let regionTimer: number | undefined

function applyPattern(patternId: string, name: string) {
  printPatternId.value = patternId
  printImageUrl.value = null
  printName.value = name
}
function applyImage(url: string, name: string) {
  printImageUrl.value = url
  printPatternId.value = null
  printName.value = name
}
function onUploadFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => applyImage(e.target?.result as string, file.name.replace(/\.[^.]+$/, ''))
  reader.readAsDataURL(file)
}
function onClear() {
  printImageUrl.value = null
  printPatternId.value = null
  printName.value = ''
  paletteId.value = null
}
function onReset() {
  params.value = { ...DEFAULT_PARAMS }
  colors.value = { ...DEFAULT_COLORS }
  paletteId.value = null
}
function onRegionClick(region: string) {
  activeRegion.value = region
  window.clearTimeout(regionTimer)
  regionTimer = window.setTimeout(() => (activeRegion.value = null), 1400)
}

async function onSave() {
  await designApi.create({
    name: printName.value ? `${printName.value} 袜款` : '未命名袜版',
    sockModelId: undefined,
    coverUrl: printImageUrl.value || undefined,
  })
  alert('已保存到我的设计')
}
function onOrder() {
  router.push({ name: 'Cart' })
}
function onAiExtend() {
  alert('款式衍生：基于当前设计生成 1/2/4 套全新款式（接 AI 图生图）')
}
function onFamilyPair() {
  alert('亲子袜：衍生成人 + 儿童两款（接 AI 图生图）')
}
</script>

<style scoped>
.sock-editor {
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
}
</style>
