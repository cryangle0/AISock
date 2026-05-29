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
      @share="onShare"
    />

    <VariantModal
      v-if="variantMode"
      :mode="variantMode"
      :base-prompt="printName"
      @close="variantMode = null"
      @apply="onVariantApply"
      @save-all="onFamilySaveAll"
    />
    <ShareModal
      v-if="shareOpen"
      :design="{ name: printName ? `${printName} 袜款` : '我的袜版', printName }"
      :cover="printImageUrl"
      @close="shareOpen = false"
      @shared="onShared"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AssetPanel from '@/components/editor/AssetPanel.vue'
import SockCanvas from '@/components/editor/SockCanvas.vue'
import ParamsPanel from '@/components/editor/ParamsPanel.vue'
import VariantModal from '@/components/editor/VariantModal.vue'
import ShareModal from '@/components/editor/ShareModal.vue'
import { DEFAULT_SOCK_TYPE_ID } from '@/data/editor'
import { designApi, type StyleVariant } from '@/api'

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
const variantMode = ref<'derive' | 'family' | null>(null)
const shareOpen = ref(false)
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
  if (!printImageUrl.value && !printPatternId.value) {
    alert('请先选择印花')
    return
  }
  variantMode.value = 'derive'
}
function onFamilyPair() {
  if (!printImageUrl.value && !printPatternId.value) {
    alert('请先选择印花')
    return
  }
  variantMode.value = 'family'
}
function onShare() {
  shareOpen.value = true
}
function onVariantApply(v: StyleVariant) {
  printName.value = v.pattern
  variantMode.value = null
}
async function onFamilySaveAll(vs: StyleVariant[]) {
  variantMode.value = null
  for (const v of vs) {
    try {
      await designApi.create({ name: v.pattern, coverUrl: printImageUrl.value || undefined })
    } catch {
      /* 忽略 */
    }
  }
  alert('亲子套装已保存到我的设计')
}
function onShared(target: string) {
  shareOpen.value = false
  alert(`已分享到${target}`)
}
</script>

<style scoped>
.sock-editor {
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
}
</style>
