<template>
  <aside class="params-panel">
    <!-- 当前印花 -->
    <section class="ps">
      <div class="ps-title">
        <span>当前印花</span>
        <span v-if="hasPrint" class="badge">{{ printName || '自定义' }}</span>
      </div>
      <div class="print-preview">
        <img v-if="printImageUrl" :src="printImageUrl" alt="印花" />
        <div v-else-if="printPatternId" class="print-swatch"><PatternSwatch :pattern-id="printPatternId" uid="preview" :rounded="false" /></div>
        <div v-else class="print-empty">尚未设置印花</div>
      </div>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
      <button class="btn primary" @click="pickFile">⬆ {{ hasPrint ? '更换印花图片' : '上传印花图片' }}</button>
    </section>

    <!-- 印花调节 -->
    <section class="ps">
      <div class="ps-title">印花调节</div>
      <div class="slider-row" :class="{ disabled: !hasPrint }">
        <div class="slider-head"><span>图片缩放</span><span class="sv">{{ params.density }}%</span></div>
        <input type="range" min="50" max="300" :value="params.density" :disabled="!hasPrint" @input="up('density', +($event.target as HTMLInputElement).value)" />
      </div>
      <div class="slider-row" :class="{ disabled: !hasPrint }">
        <div class="slider-head"><span>图片旋转</span><span class="sv">{{ params.rotation }}°</span></div>
        <input type="range" min="0" max="360" :value="params.rotation" :disabled="!hasPrint" @input="up('rotation', +($event.target as HTMLInputElement).value)" />
      </div>
      <div class="seg">
        <button :class="{ active: params.singleMode }" @click="up('singleMode', true)">单张</button>
        <button :class="{ active: !params.singleMode }" @click="up('singleMode', false)">平铺</button>
      </div>
      <div v-if="!params.singleMode" class="slider-row" :class="{ disabled: !hasPrint }">
        <div class="slider-head"><span>平铺密度</span><span class="sv">{{ params.tileDensity }}×</span></div>
        <input type="range" min="2" max="8" :value="params.tileDensity" :disabled="!hasPrint" @input="up('tileDensity', +($event.target as HTMLInputElement).value)" />
      </div>
      <label class="debug-toggle">
        <input type="checkbox" :checked="params.debugMode" @change="up('debugMode', ($event.target as HTMLInputElement).checked)" />
        <span>查看可印蒙版（调试）</span>
      </label>
    </section>

    <!-- 颜色 -->
    <section class="ps">
      <div class="ps-title">颜色 <span class="muted">单击袜版可定位区域</span></div>
      <BaseColorPicker label="袜身底色" :value="colors.bodyHex" allow-auto :highlight="activeRegion === 'body'" @change="upColor('bodyHex', $event)" />
      <BaseColorPicker label="螺口" :value="colors.weltHex" :highlight="activeRegion === 'welt'" @change="upColor('weltHex', $event)" />
      <BaseColorPicker label="袜跟+袜头" :value="colors.heelHex" :highlight="activeRegion === 'toe' || activeRegion === 'heel'" @change="upHeelToe" />
    </section>

    <!-- 色卡映射 -->
    <section class="ps">
      <div class="ps-title">色卡映射 <span v-if="!hasPrint" class="muted">需先设置印花</span></div>
      <div class="palette-list" :class="{ disabled: !hasPrint }">
        <button
          v-for="p in palettes"
          :key="p.id"
          :class="['palette', { active: paletteId === p.id }]"
          :disabled="!hasPrint"
          @click="$emit('update:paletteId', paletteId === p.id ? null : p.id)"
        >
          <div class="palette-swatches">
            <span v-for="(c, i) in p.colors.slice(0, 8)" :key="i" :style="{ background: c }" />
          </div>
          <div class="palette-meta">
            <span class="palette-name">{{ p.name }}</span>
            <span class="palette-desc">{{ p.desc }}</span>
          </div>
        </button>
      </div>
      <div v-if="paletteId" class="strength">
        <div class="slider-head"><span>映射强度</span><span class="sv">{{ paletteStrength }}%</span></div>
        <input type="range" min="0" max="100" :value="paletteStrength" @input="$emit('update:paletteStrength', +($event.target as HTMLInputElement).value)" />
      </div>
    </section>

    <!-- 操作 -->
    <section class="ps">
      <div class="ps-title">操作</div>
      <div class="act-row">
        <button class="btn ghost" :disabled="!hasPrint" @click="$emit('aiExtend')" title="基于当前设计生成全新款式">✨ 款式衍生</button>
        <button class="btn ghost" :disabled="!hasPrint" @click="$emit('familyPair')" title="衍生亲子袜">♥ 亲子袜</button>
      </div>
      <div class="act-row">
        <button class="btn ghost" @click="$emit('reset')">↺ 重置参数</button>
        <button class="btn ghost" @click="$emit('share')">↗ 分享</button>
      </div>
      <button class="btn ghost" :disabled="!hasPrint" style="width:100%" @click="$emit('clear')">⌫ 清除印花</button>

      <div class="export-row">
        <span class="export-label">导出袜版</span>
        <button class="btn ghost" :disabled="!hasPrint" @click="$emit('export', 'png')">PNG</button>
        <button class="btn ghost" :disabled="!hasPrint" @click="$emit('export', 'jpg')">JPG</button>
      </div>
    </section>

    <!-- 保存 / 下单 -->
    <section class="ps actions">
      <div class="act-row">
        <button class="btn ghost" @click="$emit('save')">💾 保存</button>
        <button class="btn primary" @click="$emit('order')">🛒 下单</button>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseColorPicker from './BaseColorPicker.vue'
import PatternSwatch from '@/components/PatternSwatch.vue'
import { COLOR_PALETTES } from '@/data/editor'
import type { SockColors, SockParams } from '@/engine'

const props = defineProps<{
  printImageUrl: string | null
  printPatternId: string | null
  printName: string
  params: SockParams
  colors: SockColors
  paletteId: string | null
  paletteStrength: number
  activeRegion: string | null
}>()

const emit = defineEmits<{
  'update:params': [v: SockParams]
  'update:colors': [v: SockColors]
  'update:paletteId': [v: string | null]
  'update:paletteStrength': [v: number]
  uploadFile: [file: File]
  clear: []
  reset: []
  save: []
  order: []
  aiExtend: []
  familyPair: []
  share: []
  export: [format: 'png' | 'jpg']
}>()

const palettes = COLOR_PALETTES
const fileInput = ref<HTMLInputElement | null>(null)
const hasPrint = computed(() => !!props.printImageUrl || !!props.printPatternId)

function up<K extends keyof typeof props.params>(k: K, v: (typeof props.params)[K]) {
  emit('update:params', { ...props.params, [k]: v })
}
function upColor<K extends keyof typeof props.colors>(k: K, v: string | null) {
  emit('update:colors', { ...props.colors, [k]: v })
}
function upHeelToe(v: string | null) {
  emit('update:colors', { ...props.colors, heelHex: v, toeHex: v })
}
function pickFile() {
  fileInput.value?.click()
}
function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) emit('uploadFile', f)
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<style scoped>
.params-panel {
  width: 300px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  overflow-y: auto;
  padding: 14px;
}
.ps {
  margin-bottom: 18px;
}
.ps-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
}
.muted {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-3);
  background: var(--bg-hover);
  padding: 2px 6px;
  border-radius: 4px;
}
.badge {
  margin-left: auto;
  font-size: 10px;
  color: var(--primary);
  background: var(--primary-soft);
  padding: 2px 8px;
  border-radius: 999px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.print-preview {
  aspect-ratio: 16 / 10;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  margin-bottom: 10px;
}
.print-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.print-swatch {
  width: 100%;
  height: 100%;
}
.print-empty {
  font-size: 12px;
  color: var(--text-3);
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  width: 100%;
}
.btn.primary {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.btn.ghost {
  background: var(--bg-hover);
}
.btn:disabled {
  opacity: 0.45;
}
.slider-row {
  margin-bottom: 12px;
}
.slider-row.disabled {
  opacity: 0.5;
}
.slider-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 4px;
}
.sv {
  color: var(--primary);
  font-weight: 600;
}
.slider-row input,
.strength input {
  width: 100%;
  accent-color: var(--primary);
}
.seg {
  display: flex;
  gap: 6px;
}
.seg button {
  flex: 1;
  height: 32px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-2);
}
.seg button.active {
  background: var(--primary-soft);
  color: var(--primary);
  border-color: var(--primary);
  font-weight: 600;
}
.debug-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 11px;
  color: var(--text-3);
  cursor: pointer;
}
.debug-toggle input {
  accent-color: var(--primary);
}
.palette-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.palette-list.disabled {
  opacity: 0.5;
}
.palette {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  text-align: left;
}
.palette.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-soft);
}
.palette-swatches {
  display: flex;
  flex-shrink: 0;
}
.palette-swatches span {
  width: 12px;
  height: 24px;
}
.palette-swatches span:first-child {
  border-radius: 4px 0 0 4px;
}
.palette-swatches span:last-child {
  border-radius: 0 4px 4px 0;
}
.palette-name {
  display: block;
  font-size: 12px;
  font-weight: 600;
}
.palette-desc {
  font-size: 10px;
  color: var(--text-3);
}
.strength {
  margin-top: 10px;
}
.act-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.actions {
  border-top: 1px solid var(--border);
  padding-top: 14px;
}
.export-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.export-label {
  font-size: 12px;
  color: var(--text-3);
  margin-right: auto;
}
.export-row .btn {
  flex: 0 0 auto;
  padding: 0 18px;
  width: auto;
}
</style>
