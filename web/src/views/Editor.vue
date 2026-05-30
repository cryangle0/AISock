<template>
  <div class="sock-editor">
    <!-- 左：素材库 / AI 生成 -->
    <AssetPanel @apply="onApplyPattern" @apply-image="onApplyImage" />

    <!-- 中：真实 canvas 袜版预览 -->
    <SockCanvas
      ref="canvasRef"
      v-model:sock-type-id="sockTypeId"
      :print-image-url="finalPrintImage"
      :params="params"
      :colors="colors"
      @region-click="onRegionClick"
      @drop-image="onApplyImage"
      @resource-ready="onResourceReady"
    />

    <!-- 右：参数 / 颜色 / 色卡 / 操作 -->
    <ParamsPanel
      :print-image-url="printImage"
      :print-pattern-id="null"
      :print-name="printName"
      :params="params"
      :colors="colors"
      :palette-id="paletteId"
      :palette-strength="paletteStrength"
      :active-region="activeRegion"
      @update:params="setParams"
      @update:colors="setColors"
      @update:palette-id="paletteId = $event"
      @update:palette-strength="paletteStrength = $event"
      @upload-file="onUploadFile"
      @clear="clearPrint"
      @reset="resetParams"
      @save="onSave"
      @order="onOrder"
      @ai-extend="onAiExtend"
      @family-pair="onFamilyPair"
      @share="shareOpen = true"
    />

    <!-- 款式衍生 / 亲子袜 -->
    <VariantModal
      v-if="variantMode"
      :mode="variantMode"
      :base-design="{ printName, colors, params }"
      :resources="resources"
      @close="variantMode = null"
      @apply="onVariantApply"
      @save-all="onFamilySaveAll"
    />

    <!-- 分享 -->
    <ShareModal
      v-if="shareOpen"
      :design="{ name: composeName(), printName }"
      :cover="finalPrintImage"
      @close="shareOpen = false"
      @shared="onShared"
    />

    <!-- 下单 -->
    <OrderModal
      v-if="orderOpen"
      :default-design-name="composeName()"
      @close="orderOpen = false"
      @submit="onOrderSubmit"
    />

    <!-- 支付 -->
    <PaymentModal v-if="pendingOrder" :order="pendingOrder" @cancel="pendingOrder = null" @paid="onPaid" />

    <!-- 全局轻提示 -->
    <Transition name="toast">
      <div v-if="toast" class="editor-toast">{{ toast }}</div>
    </Transition>
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
import OrderModal, { type OrderFormData } from '@/components/order/OrderModal.vue'
import PaymentModal from '@/components/order/PaymentModal.vue'
import { useSockEditor } from '@/composables/useSockEditor'
import { compressDataURL, type DesignVariant, type SockResources } from '@/engine'
import { designApi } from '@/api'

const router = useRouter()

const {
  sockTypeId,
  printImage,
  printName,
  params,
  colors,
  paletteId,
  paletteStrength,
  hasPrint,
  finalPrintImage,
  composeName,
  applyImage,
  applyPattern,
  clearPrint,
  resetParams,
  setColors,
  setParams,
  applyDesign,
} = useSockEditor()

const canvasRef = ref<InstanceType<typeof SockCanvas> | null>(null)
const resources = ref<SockResources | null>(null)
const activeRegion = ref<string | null>(null)
const variantMode = ref<'derive' | 'family' | null>(null)
const shareOpen = ref(false)
const orderOpen = ref(false)
const pendingOrder = ref<OrderFormData | null>(null)
const toast = ref('')
let regionTimer: number | undefined
let toastTimer: number | undefined

function showToast(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 2000)
}

function onApplyPattern(patternId: string, name: string) {
  applyPattern(patternId, name)
}
function onApplyImage(url: string, name: string) {
  applyImage(url, name)
}
function onUploadFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => applyImage(e.target?.result as string, file.name.replace(/\.[^.]+$/, ''))
  reader.readAsDataURL(file)
}
function onResourceReady(res: SockResources) {
  resources.value = res
}
function onRegionClick(region: string) {
  activeRegion.value = region
  window.clearTimeout(regionTimer)
  regionTimer = window.setTimeout(() => (activeRegion.value = null), 1400)
}

async function snapshotCover(): Promise<string | undefined> {
  const raw = canvasRef.value?.getDataURL?.() || ''
  if (!raw) return undefined
  return (await compressDataURL(raw, 360, 'image/jpeg', 0.82)) || undefined
}

async function onSave() {
  const cover = await snapshotCover()
  try {
    await designApi.create({ name: composeName(), coverUrl: cover })
    showToast('已保存到我的设计')
  } catch (e) {
    showToast((e as Error).message || '保存失败')
  }
}

function onOrder() {
  if (!hasPrint.value) {
    showToast('请先选择或生成印花')
    return
  }
  orderOpen.value = true
}
function onOrderSubmit(data: OrderFormData) {
  orderOpen.value = false
  pendingOrder.value = data
}
function onPaid(payment: { orderNo: string }) {
  pendingOrder.value = null
  showToast(`支付成功，订单 ${payment.orderNo} 已提交`)
  setTimeout(() => router.push({ name: 'Cart' }), 900)
}

function onAiExtend() {
  if (!hasPrint.value) {
    showToast('请先选择印花')
    return
  }
  variantMode.value = 'derive'
}
function onFamilyPair() {
  if (!hasPrint.value) {
    showToast('请先选择印花')
    return
  }
  variantMode.value = 'family'
}
function onVariantApply(v: DesignVariant) {
  applyDesign(v)
  variantMode.value = null
  showToast(`已应用：${v.pattern}`)
}
async function onFamilySaveAll(vs: DesignVariant[]) {
  variantMode.value = null
  for (const v of vs) {
    try {
      const cover = v.cover ? await compressDataURL(v.cover, 360, 'image/jpeg', 0.82) : undefined
      await designApi.create({ name: v.printName, coverUrl: cover })
    } catch {
      /* 忽略单个失败 */
    }
  }
  showToast('亲子套装已保存到我的设计')
}
function onShared(target: string) {
  shareOpen.value = false
  showToast(`已分享到${target}`)
}
</script>

<style scoped>
.sock-editor {
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
}
.editor-toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(43, 31, 20, 0.9);
  color: #fff;
  padding: 10px 22px;
  border-radius: 999px;
  font-size: 14px;
  z-index: 400;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
