<template>
  <view class="editor">
    <!-- ① 袜型选择 -->
    <view class="sock-bar">
      <text class="bar-label">袜型</text>
      <scroll-view scroll-x class="sock-row">
        <view
          v-for="s in sockTypes"
          :key="s.id"
          :class="['sock-chip', { active: sockTypeId === s.id }]"
          @tap="sockTypeId = s.id"
        >
          {{ s.name }}
        </view>
      </scroll-view>
    </view>

    <!-- 我的设计入口 -->
    <view class="mydesigns-bar" @tap="goDesigns">
      <text>📁 我的设计</text>
      <text class="arrow">›</text>
    </view>

    <!-- 袜版预览（真实 canvas 矢量渲染） -->
    <SockCanvas ref="canvasRef" :print-image="printImage" :pattern-id="patternId" :params="params" :colors="colors" @region-click="onRegionClick" />

    <!-- 滚动区：快捷操作 + 调节面板（袜版预览固定在上方，此区独立滚动、隐藏滚动条） -->
    <scroll-view class="editor-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
    <!-- 快捷操作 -->
    <view class="quick-row">
      <button class="quick-btn" :disabled="!hasPrint" @tap="onAiExtend">✨ 款式衍生</button>
      <button class="quick-btn" :disabled="!hasPrint" @tap="onFamily">♥ 亲子袜</button>
      <button class="quick-btn" @tap="onShare">↗ 分享</button>
    </view>

    <!-- sheet tab -->
    <view class="sheet-tabs">
      <text v-for="t in tabs" :key="t.key" :class="['sheet-tab', { active: tab === t.key }]" @tap="tab = t.key">{{ t.label }}</text>
    </view>

    <view class="sheet-card">
      <!-- 印花 -->
      <template v-if="tab === 'print'">
        <view class="pattern-grid">
          <view
            v-for="p in patterns"
            :key="p.key"
            :class="['pattern-item', { active: isPatternActive(p) }]"
            :style="{ background: p.bg }"
            @tap="applyPattern(p)"
          >
            <image v-if="p.kind === 'image'" :src="p.imageUrl" mode="aspectFill" class="pattern-img" />
            <view v-else class="pattern-fg" :style="{ background: p.fg }" />
            <text class="pattern-name">{{ p.name }}</text>
          </view>
        </view>
        <button class="ai-gen-entry" @tap="onAiGen">⚡ AI 生成花型（今日剩 {{ quota.remaining }} 次）</button>
      </template>

      <!-- 调节 -->
      <template v-else-if="tab === 'adjust'">
        <view class="slider-row">
          <view class="slider-head"><text>图片缩放</text><text class="sv">{{ params.density }}%</text></view>
          <slider :value="params.density" :min="50" :max="300" :disabled="!hasPrint" activeColor="#8C5A3C" block-size="18" @changing="onScale" @change="onScale" />
        </view>
        <view class="slider-row">
          <view class="slider-head"><text>图片旋转</text><text class="sv">{{ params.rotation }}°</text></view>
          <slider :value="params.rotation" :min="0" :max="360" :disabled="!hasPrint" activeColor="#8C5A3C" block-size="18" @changing="onRotate" @change="onRotate" />
        </view>
        <view class="seg">
          <view :class="['seg-btn', { active: params.singleMode }]" @tap="params.singleMode = true">单张</view>
          <view :class="['seg-btn', { active: !params.singleMode }]" @tap="params.singleMode = false">平铺</view>
        </view>
        <view v-if="!params.singleMode" class="slider-row">
          <view class="slider-head"><text>平铺密度</text><text class="sv">{{ params.tileDensity }}×</text></view>
          <slider :value="params.tileDensity" :min="2" :max="8" :disabled="!hasPrint" activeColor="#8C5A3C" block-size="18" @changing="onTile" @change="onTile" />
        </view>
      </template>

      <!-- 颜色 -->
      <template v-else-if="tab === 'color'">
        <view v-for="region in colorRegions" :key="region.key" class="color-block">
          <text class="color-label">{{ region.label }}</text>
          <view class="color-grid">
            <view
              v-for="c in baseColors"
              :key="c.value"
              :class="['color-chip', { active: colors[region.field] === c.hex, auto: c.hex == null }]"
              :style="c.hex ? { background: c.hex } : {}"
              @tap="setColor(region.field, c.hex)"
            >
              <text v-if="c.hex == null" class="chip-auto">自动</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 推荐色 -->
      <template v-else>
        <view v-if="!hasPrint" class="palette-tip">需先设置印花</view>
        <view
          v-for="p in palettes"
          :key="p.id"
          :class="['palette-item', { active: paletteId === p.id, disabled: !hasPrint }]"
          @tap="hasPrint && (paletteId = paletteId === p.id ? null : p.id)"
        >
          <view class="palette-swatches">
            <view v-for="(c, i) in p.colors" :key="i" class="ps" :style="{ background: c }" />
          </view>
          <view class="palette-meta">
            <text class="palette-name">{{ p.name }}</text>
            <text class="palette-desc">{{ p.desc }}</text>
          </view>
        </view>
      </template>
    </view>
    </scroll-view>

    <!-- 右侧固定 保存/下单 dock -->
    <view class="side-dock">
      <button class="dock-ai" @tap="onAiGen">AI</button>
      <button class="dock-btn save" @tap="onSave">保存</button>
      <button class="dock-btn order" @tap="onOrder">下单</button>
    </view>

    <!-- 下单 / 支付 抽屉 -->
    <OrderSheet
      v-if="orderOpen"
      :default-design-name="printName ? `${printName} 袜款` : '未命名袜版'"
      @close="orderOpen = false"
      @submit="onOrderSubmit"
    />
    <PaymentSheet
      v-if="pendingOrder"
      :order="pendingOrder"
      @cancel="pendingOrder = null"
      @paid="onPaid"
    />
    <VariantSheet
      v-if="variantMode"
      :mode="variantMode"
      :base-prompt="printName"
      :base-design="{ patternId, printImage, colors, params }"
      @close="variantMode = null"
      @apply="onVariantApply"
      @save-all="onFamilySaveAll"
    />
    <ShareSheet
      v-if="shareOpen"
      :design="{ name: printName ? `${printName} 袜款` : '我的袜版', printName }"
      :cover="printImage"
      @close="shareOpen = false"
      @shared="onShared"
    />

    <custom-tab-bar current="editor" />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  COLOR_PALETTES, BASE_COLOR_PRESETS,
} from '@aisock/common'
import { navigateTo, reLaunch } from '@aisock/common/utils'
import { useUserStore } from '@aisock/composition'
import { aiApi, designApi, uploadApi } from '@aisock/service'
import { useCatalog, type EditorPattern } from '@/composables/useCatalog'
import SockCanvas from '@/components/editor/SockCanvas.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import OrderSheet from '@/components/editor/OrderSheet.vue'
import PaymentSheet from '@/components/editor/PaymentSheet.vue'
import VariantSheet from '@/components/editor/VariantSheet.vue'
import ShareSheet from '@/components/editor/ShareSheet.vue'
import type { DesignVariant } from '@/composables/useVariants'
import { toRegions, fromRegions } from '../../components/editor/designSnapshot'

const userStore = useUserStore()
const { socks: sockTypes, patterns, defaultSockId, ensureLoaded: ensureCatalog } = useCatalog()
const palettes = COLOR_PALETTES
const baseColors = BASE_COLOR_PRESETS

const tabs = [
  { key: 'print', label: '印花' },
  { key: 'adjust', label: '调节' },
  { key: 'color', label: '颜色' },
  { key: 'palette', label: '推荐色' },
]
const colorRegions = [
  { key: 'body', label: '袜身底色', field: 'bodyHex' as const },
  { key: 'welt', label: '螺口', field: 'weltHex' as const },
  { key: 'heel', label: '袜跟+袜头', field: 'heelHex' as const },
]

const tab = ref('print')
const sockTypeId = ref(defaultSockId)
const printImage = ref<string | null>(null)
const patternId = ref<string | null>(null)
const printName = ref('')
const params = reactive({ density: 100, rotation: 0, singleMode: true, tileDensity: 3 })
const colors = reactive<{ bodyHex: string | null; weltHex: string | null; heelHex: string | null; toeHex: string | null }>({
  bodyHex: null, weltHex: null, heelHex: null, toeHex: null,
})
const paletteId = ref<string | null>(null)
const quota = reactive({ limit: 5, remaining: 5 })
const canvasRef = ref<{ exportImage?: () => Promise<string> } | null>(null)
const orderOpen = ref(false)
const pendingOrder = ref<PendingOrder | null>(null)
const variantMode = ref<'derive' | 'family' | null>(null)
const shareOpen = ref(false)
/** 当前正在编辑的已存设计 id（从"我的设计"打开时有值，保存走更新而非新建） */
const currentDesignId = ref<number | null>(null)

interface OrderSubmit {
  designName: string
  sizes: Record<string, number>
  total: number
  material: string
  materialValue: string
  craft: string
  craftValue: string
  contact: string
  phone: string
  address: string
  note: string
}

/** 传给 PaymentSheet 的订单数据（含尺码/地址/封面/设计 id） */
interface PendingOrder {
  designName: string
  total: number
  material: string
  materialValue: string
  craft: string
  craftValue: string
  sizes: Record<string, number>
  address: string
  note: string
  designId?: number
  coverUrl?: string
}

const hasPrint = computed(() => !!printImage.value || !!patternId.value)

/** 从"我的设计"打开（storage 传 id）→ 拉取并回填整套设计 */
async function loadDesignIfRequested() {
  const id = Number(uni.getStorageSync('aisock_edit_design_id'))
  if (!id) return
  uni.removeStorageSync('aisock_edit_design_id')
  try {
    const res = await designApi.getDesign(id)
    const snap = fromRegions(res.data.regions)
    currentDesignId.value = id
    if (snap.sockTypeId) sockTypeId.value = snap.sockTypeId
    if (snap.patternId !== undefined) patternId.value = snap.patternId
    if (snap.printImage !== undefined) printImage.value = snap.printImage
    if (snap.printName !== undefined) printName.value = snap.printName
    if (snap.params) Object.assign(params, snap.params)
    if (snap.colors) Object.assign(colors, snap.colors)
    if (snap.paletteId !== undefined) paletteId.value = snap.paletteId
    uni.showToast({ title: `继续编辑：${res.data.name}`, icon: 'none' })
  } catch {
    /* 忽略，按空白新建 */
  }
}

onShow(async () => {
  ensureCatalog()
  await loadDesignIfRequested()
  if (userStore.isLogin) {
    try {
      const res = await aiApi.getQuota()
      quota.limit = res.data.limit
      quota.remaining = res.data.remaining
    } catch {
      /* 忽略 */
    }
  }
})

function ensureLogin(): boolean {
  if (!userStore.isLogin) {
    reLaunch('/pages/login/index')
    return false
  }
  return true
}

function applyPattern(p: EditorPattern) {
  if (p.kind === 'image') {
    // 后端图片印花：走贴图渲染
    printImage.value = p.imageUrl ?? null
    patternId.value = null
  } else {
    // 内置矢量花型：走 canvas 引擎
    patternId.value = p.patternId ?? null
    printImage.value = null
  }
  printName.value = p.name
}
/** 网格项是否选中（图片款比 printImage，内置款比 patternId） */
function isPatternActive(p: EditorPattern): boolean {
  return p.kind === 'image' ? printImage.value === p.imageUrl : patternId.value === p.patternId
}
function onScale(e: any) { params.density = e.detail.value }
function onRotate(e: any) { params.rotation = e.detail.value }
function onTile(e: any) { params.tileDensity = e.detail.value }
function onRegionClick(region: string) {
  // 点击袜版区域 → 切到颜色 tab 并提示
  tab.value = 'color'
  const label = region === 'welt' ? '螺口' : region === 'heel' || region === 'toe' ? '袜跟/袜头' : '袜身'
  uni.showToast({ title: `调整${label}颜色`, icon: 'none', duration: 800 })
}
function setColor(field: 'bodyHex' | 'weltHex' | 'heelHex', hex: string | null) {
  colors[field] = hex
  if (field === 'heelHex') colors.toeHex = hex
}

async function onAiGen() {
  if (!ensureLogin()) return
  const res = await uni.showModal({ title: 'AI 生成花型', editable: true, placeholderText: '描述想要的花型' })
  if (!res.confirm || !res.content) return
  try {
    const r = await aiApi.generate({ type: 'text2img', prompt: res.content })
    const url = r.data.result_urls?.[0]
    if (url) {
      printImage.value = url
      patternId.value = null
      printName.value = res.content
    }
    const q = await aiApi.getQuota()
    quota.remaining = q.data.remaining
  } catch {
    /* 拦截器已提示 */
  }
}
function onAiExtend() {
  if (!ensureLogin()) return
  if (!hasPrint.value) {
    uni.showToast({ title: '请先选择印花', icon: 'none' })
    return
  }
  variantMode.value = 'derive'
}
function onFamily() {
  if (!ensureLogin()) return
  if (!hasPrint.value) {
    uni.showToast({ title: '请先选择印花', icon: 'none' })
    return
  }
  variantMode.value = 'family'
}
function onShare() {
  shareOpen.value = true
}
function onVariantApply(v: DesignVariant) {
  // 应用衍生款：一次性回填 印花(花型或AI图) + 四区颜色 + 调节参数
  patternId.value = v.patternId
  printImage.value = v.printImage
  printName.value = v.printName || v.scheme
  Object.assign(colors, v.colors)
  Object.assign(params, v.params)
  variantMode.value = null
  uni.showToast({ title: `已应用：${v.scheme}`, icon: 'none' })
}
async function onFamilySaveAll(vs: DesignVariant[]) {
  variantMode.value = null
  if (!vs.length) return
  uni.showLoading({ title: '保存套装中…', mask: true })
  let ok = 0
  for (const v of vs) {
    try {
      // 保存完整设计数据（regions），保证再次打开可还原编辑
      await designApi.createDesign({
        name: v.name,
        coverUrl: v.cover || undefined,
        regions: toRegions({
          sockTypeId: sockTypeId.value,
          patternId: v.patternId,
          printImage: v.printImage,
          printName: v.printName,
          params: { ...v.params },
          colors: { ...v.colors },
          paletteId: null,
        }),
      })
      ok += 1
    } catch {
      /* 单款失败不阻断其余 */
    }
  }
  uni.hideLoading()
  uni.showToast({ title: ok === vs.length ? '亲子套装已保存' : `已保存 ${ok}/${vs.length} 款`, icon: 'none' })
}
function onShared(target: string) {
  shareOpen.value = false
  uni.showToast({ title: `已分享到${target}`, icon: 'none' })
}
/** 当前编辑器状态打包成保存输入。封面：canvas 临时路径先上传换永久 URL，避免存库后失效 */
async function buildSavePayload() {
  const tempCover = (await canvasRef.value?.exportImage?.()) || ''
  let coverUrl: string | undefined
  if (tempCover) {
    try {
      const up = await uploadApi.uploadFile(tempCover)
      coverUrl = up.url
    } catch {
      coverUrl = undefined // 上传失败则不存封面，避免存入会失效的临时路径
    }
  } else if (printImage.value) {
    coverUrl = printImage.value
  }
  return {
    name: printName.value ? `${printName.value} 袜款` : '未命名袜版',
    sockModelId: undefined,
    coverUrl,
    regions: toRegions({
      sockTypeId: sockTypeId.value,
      patternId: patternId.value,
      printImage: printImage.value,
      printName: printName.value,
      params: { ...params },
      colors: { ...colors },
      paletteId: paletteId.value,
    }),
  }
}

async function onSave() {
  if (!ensureLogin()) return
  const payload = await buildSavePayload()
  try {
    if (currentDesignId.value) {
      await designApi.updateDesign(currentDesignId.value, payload)
      uni.showToast({ title: '已更新设计', icon: 'success' })
    } else {
      const res = await designApi.createDesign(payload)
      currentDesignId.value = res.data.id
      uni.showToast({ title: '已保存', icon: 'success' })
    }
  } catch {
    /* 拦截器已提示 */
  }
}
function onOrder() {
  if (!ensureLogin()) return
  if (!hasPrint.value) {
    uni.showToast({ title: '请先选择印花', icon: 'none' })
    return
  }
  orderOpen.value = true
}

async function onOrderSubmit(data: OrderSubmit) {
  orderOpen.value = false
  // 下单前先确保设计已保存，拿到 designId 和封面 URL 关联订单
  let coverUrl: string | undefined
  try {
    const payload = await buildSavePayload()
    coverUrl = payload.coverUrl
    if (currentDesignId.value) {
      await designApi.updateDesign(currentDesignId.value, payload)
    } else {
      const res = await designApi.createDesign(payload)
      currentDesignId.value = res.data.id
    }
  } catch {
    /* 保存失败不阻断下单 */
  }
  pendingOrder.value = {
    designName: data.designName,
    total: data.total,
    material: data.material,
    materialValue: data.materialValue,
    craft: data.craft,
    craftValue: data.craftValue,
    sizes: data.sizes,
    address: `${data.contact} ${data.phone} ${data.address}`.trim(),
    note: data.note,
    designId: currentDesignId.value ?? undefined,
    coverUrl,
  }
}

function onPaid(payment: { orderNo: string; real: boolean }) {
  pendingOrder.value = null
  uni.showToast({ title: payment.real ? '支付成功' : '支付成功（演示）', icon: 'success' })
  setTimeout(() => navigateTo('/pages/orders/index'), 800)
}
function goDesigns() {
  if (!ensureLogin()) return
  navigateTo('/pages/designs/index')
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.editor {
  height: 100vh;
  padding: 20rpx 24rpx 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.editor-scroll {
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  padding-bottom: 160rpx;
}
.sock-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 16rpx;
}
.bar-label {
  font-size: 24rpx;
  font-weight: 700;
  color: $mp-text-primary;
  flex-shrink: 0;
}
.sock-row {
  white-space: nowrap;
  flex: 1;
}
.sock-chip {
  display: inline-block;
  padding: 10rpx 24rpx;
  margin-right: 12rpx;
  border-radius: 999rpx;
  border: 1rpx solid $mp-border;
  font-size: 24rpx;
  color: $mp-text-secondary;
}
.sock-chip.active {
  background: $mp-primary;
  color: #fff;
  border-color: $mp-primary;
}
.mydesigns-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 24rpx;
  color: $mp-text-secondary;
  margin-bottom: 16rpx;
}
.arrow {
  color: $mp-text-muted;
}
.quick-row {
  display: flex;
  gap: 12rpx;
  margin: 16rpx 0;
}
.quick-btn {
  flex: 1;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: $mp-text-secondary;
  line-height: 64rpx;
  height: 64rpx;
  padding: 0;
}
.quick-btn[disabled] {
  opacity: 0.45;
}
.sheet-tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.sheet-tab {
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: $mp-text-secondary;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
}
.sheet-tab.active {
  background: $mp-primary;
  color: #fff;
  border-color: $mp-primary;
}
.sheet-card {
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 20rpx;
  padding: 24rpx;
}
.pattern-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.pattern-item {
  width: calc((100% - 48rpx) / 4);
  aspect-ratio: 1;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  border: 2rpx solid transparent;
  overflow: hidden;
  position: relative;
}
.pattern-item.active {
  border-color: $mp-primary;
}
.pattern-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.pattern-fg {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  opacity: 0.7;
}
.pattern-name {
  position: relative;
  z-index: 1;
  font-size: 20rpx;
  color: $mp-text-primary;
}
.pattern-item .pattern-img + .pattern-name {
  color: #fff;
  background: rgba(0, 0, 0, 0.35);
  padding: 0 8rpx;
  border-radius: 6rpx;
}
.ai-gen-entry {
  margin-top: 20rpx;
  background: $mp-primary;
  color: #fff;
  border-radius: 12rpx;
  font-size: 24rpx;
}
.slider-row {
  margin-bottom: 20rpx;
}
.slider-head {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: $mp-text-secondary;
}
.sv {
  color: $mp-primary;
  font-weight: 600;
}
.seg {
  display: flex;
  gap: 12rpx;
}
.seg-btn {
  flex: 1;
  text-align: center;
  line-height: 60rpx;
  border-radius: 12rpx;
  border: 1rpx solid $mp-border;
  font-size: 24rpx;
  color: $mp-text-secondary;
}
.seg-btn.active {
  background: $mp-primary;
  color: #fff;
  border-color: $mp-primary;
}
.color-block {
  margin-bottom: 20rpx;
}
.color-label {
  font-size: 24rpx;
  font-weight: 600;
  color: $mp-text-primary;
  display: block;
  margin-bottom: 12rpx;
}
.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.color-chip {
  width: 56rpx;
  height: 56rpx;
  border-radius: 10rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}
.color-chip.active {
  border: 4rpx solid $mp-primary;
}
.color-chip.auto {
  background: repeating-linear-gradient(45deg, #eee, #eee 6rpx, #fff 6rpx, #fff 12rpx);
}
.chip-auto {
  font-size: 18rpx;
  color: $mp-text-secondary;
}
.palette-tip {
  font-size: 22rpx;
  color: $mp-text-muted;
  margin-bottom: 12rpx;
}
.palette-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  border: 1rpx solid $mp-border;
  border-radius: 16rpx;
  margin-bottom: 12rpx;
}
.palette-item.active {
  border-color: $mp-primary;
  box-shadow: 0 0 0 2rpx $mp-primary-soft;
}
.palette-item.disabled {
  opacity: 0.5;
}
.palette-swatches {
  display: flex;
  flex-shrink: 0;
}
.ps {
  width: 22rpx;
  height: 44rpx;
}
.palette-name {
  font-size: 24rpx;
  font-weight: 600;
  color: $mp-text-primary;
  display: block;
}
.palette-desc {
  font-size: 20rpx;
  color: $mp-text-muted;
}
.side-dock {
  position: fixed;
  right: 20rpx;
  bottom: 180rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  z-index: 50;
}
.dock-ai {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(180deg, #946d60, #b99d92);
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  padding: 0;
  box-shadow: 0 8rpx 24rpx rgba(148, 109, 96, 0.4);
}
.dock-btn {
  width: 88rpx;
  height: 72rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  padding: 0;
  line-height: 72rpx;
  box-shadow: 0 8rpx 24rpx rgba(94, 60, 30, 0.18);
}
.dock-btn.save {
  background: $mp-bg-card;
  color: $mp-primary;
  border: 1rpx solid $mp-primary;
}
.dock-btn.order {
  background: $mp-primary;
  color: #fff;
}
</style>
