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

    <!-- 袜版预览 -->
    <SockPreview :print-image="printImage" :pattern-id="patternId" :params="params" :colors="colors" />

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
            :key="p.id"
            :class="['pattern-item', { active: patternId === p.id }]"
            :style="{ background: p.bg }"
            @tap="applyPattern(p.id, p.name)"
          >
            <view class="pattern-fg" :style="{ background: p.fg }" />
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

    <!-- 右侧固定 保存/下单 dock -->
    <view class="side-dock">
      <button class="dock-ai" @tap="onAiGen">AI</button>
      <button class="dock-btn save" @tap="onSave">保存</button>
      <button class="dock-btn order" @tap="onOrder">下单</button>
    </view>

    <custom-tab-bar current="editor" />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  SOCK_TYPES, DEFAULT_SOCK_TYPE_ID, PATTERN_LIST, COLOR_PALETTES, BASE_COLOR_PRESETS,
} from '@aisock/common'
import { navigateTo, reLaunch } from '@aisock/common/utils'
import { useUserStore } from '@aisock/composition'
import { aiApi, designApi } from '@aisock/service'
import SockPreview from '@/components/SockPreview.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'

const userStore = useUserStore()
const sockTypes = SOCK_TYPES
const patterns = PATTERN_LIST
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
const sockTypeId = ref(DEFAULT_SOCK_TYPE_ID)
const printImage = ref<string | null>(null)
const patternId = ref<string | null>(null)
const printName = ref('')
const params = reactive({ density: 100, rotation: 0, singleMode: true })
const colors = reactive<{ bodyHex: string | null; weltHex: string | null; heelHex: string | null; toeHex: string | null }>({
  bodyHex: null, weltHex: null, heelHex: null, toeHex: null,
})
const paletteId = ref<string | null>(null)
const quota = reactive({ limit: 5, remaining: 5 })

const hasPrint = computed(() => !!printImage.value || !!patternId.value)

onShow(async () => {
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

function applyPattern(id: string, name: string) {
  patternId.value = id
  printImage.value = null
  printName.value = name
}
function onScale(e: any) { params.density = e.detail.value }
function onRotate(e: any) { params.rotation = e.detail.value }
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
  uni.showToast({ title: '款式衍生（接 AI 图生图）', icon: 'none' })
}
function onFamily() {
  uni.showToast({ title: '亲子袜衍生（接 AI 图生图）', icon: 'none' })
}
function onShare() {
  uni.showToast({ title: '已唤起分享', icon: 'none' })
}
async function onSave() {
  if (!ensureLogin()) return
  await designApi.createDesign({
    name: printName.value ? `${printName.value} 袜款` : '未命名袜版',
    sockModelId: undefined,
    coverUrl: printImage.value || undefined,
  })
  uni.showToast({ title: '已保存', icon: 'success' })
}
function onOrder() {
  if (!ensureLogin()) return
  navigateTo('/pages/orders/index')
}
function goDesigns() {
  if (!ensureLogin()) return
  navigateTo('/pages/designs/index')
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.editor {
  min-height: 100vh;
  padding: 20rpx 24rpx 160rpx;
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
}
.pattern-item.active {
  border-color: $mp-primary;
}
.pattern-fg {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  opacity: 0.7;
}
.pattern-name {
  font-size: 20rpx;
  color: $mp-text-primary;
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
