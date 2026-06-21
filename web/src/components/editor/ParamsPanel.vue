<template>
  <aside class="params-panel">
    <!-- 上传印花 -->
    <section class="ps">
      <div class="ps-title"><span>上传印花</span></div>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
      <div v-if="hasPrint" class="print-preview" @click="pickFile">
        <img v-if="printImageUrl" :src="printImageUrl" alt="印花" />
        <div v-else-if="printPatternId" class="print-swatch"><PatternSwatch :pattern-id="printPatternId" uid="preview" :rounded="false" /></div>
        <span class="print-replace">点击更换</span>
      </div>
      <button v-else class="upload-box" @click="pickFile">
        <span class="upload-ico"><AppIcon name="upload" :size="20" color="var(--primary)" /></span>
        <span class="upload-main">上传印花图片</span>
        <span class="upload-sub">支持 PNG, JPG（最大 10MB）</span>
      </button>
    </section>

    <!-- 印花调节 -->
    <section class="ps">
      <div class="ps-title">印花调节</div>
      <div class="slider-row" :class="{ disabled: !hasPrint }">
        <div class="slider-head"><span>图片缩放</span><span class="sv num">{{ params.density }}%</span></div>
        <input type="range" min="50" max="300" :value="params.density" :disabled="!hasPrint" @input="up('density', +($event.target as HTMLInputElement).value)" />
      </div>
      <div class="slider-row" :class="{ disabled: !hasPrint }">
        <div class="slider-head"><span>图片旋转</span><span class="sv num">{{ params.rotation }}°</span></div>
        <input type="range" min="0" max="360" :value="params.rotation" :disabled="!hasPrint" @input="up('rotation', +($event.target as HTMLInputElement).value)" />
      </div>
      <div class="ps-subtitle">排列模式</div>
      <div class="seg">
        <button :class="{ active: params.singleMode }" @click="up('singleMode', true)">单张</button>
        <button :class="{ active: !params.singleMode }" @click="up('singleMode', false)">平铺</button>
      </div>
      <div v-if="!params.singleMode" class="slider-row" :class="{ disabled: !hasPrint }">
        <div class="slider-head"><span>平铺密度</span><span class="sv num">{{ params.tileDensity }}×</span></div>
        <input type="range" min="2" max="8" :value="params.tileDensity" :disabled="!hasPrint" @input="up('tileDensity', +($event.target as HTMLInputElement).value)" />
      </div>
      <label class="debug-toggle">
        <input type="checkbox" :checked="params.debugMode" @change="up('debugMode', ($event.target as HTMLInputElement).checked)" />
        <span>查看可印蒙版（调试）</span>
      </label>
    </section>

    <!-- 颜色 -->
    <section class="ps">
      <div class="ps-title">颜色 <span class="muted">提示: 单击袜板定位</span></div>
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
        <div class="slider-head"><span>映射强度</span><span class="sv num">{{ paletteStrength }}%</span></div>
        <input type="range" min="0" max="100" :value="paletteStrength" @input="$emit('update:paletteStrength', +($event.target as HTMLInputElement).value)" />
      </div>
    </section>

    <!-- 操作 -->
    <section class="ps">
      <div class="ps-title">操作</div>
      <div class="act-row">
        <button class="btn ghost" :disabled="!hasPrint" @click="$emit('aiExtend')" title="基于当前设计生成全新款式"><AppIcon name="sparkle" :size="16" /> 款式衍生</button>
        <button class="btn ghost" :disabled="!hasPrint" @click="$emit('familyPair')" title="衍生亲子袜"><AppIcon name="bolt" :size="16" /> 亲子袜</button>
      </div>
      <div class="act-row">
        <button class="btn ghost" @click="$emit('reset')"><AppIcon name="undo" :size="16" /> 重置参数</button>
        <button class="btn ghost" @click="$emit('share')"><AppIcon name="chevron-right" :size="16" /> 分享</button>
      </div>
      <button class="btn ghost" :disabled="!hasPrint" style="width:100%" @click="$emit('clear')"><AppIcon name="close" :size="16" /> 清除印花</button>

      <div class="export-row">
        <span class="export-label">导出袜版</span>
        <button class="btn ghost" :disabled="!hasPrint" @click="$emit('export', 'png')">PNG</button>
        <button class="btn ghost" :disabled="!hasPrint" @click="$emit('export', 'jpg')">JPG</button>
      </div>
    </section>

    <!-- 保存 / 下单 -->
    <section class="ps actions">
      <div class="act-row">
        <button class="btn ghost" @click="$emit('save')"><AppIcon name="check" :size="16" /> 保存</button>
        <button class="btn primary" @click="$emit('order')"><AppIcon name="cart" :size="16" color="#fff" /> 下单</button>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseColorPicker from './BaseColorPicker.vue'
import PatternSwatch from '@/components/PatternSwatch.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
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
function pickFile() { fileInput.value?.click() }
function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) emit('uploadFile', f)
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<style scoped>
/* 右侧属性面板 282 白，padding 24 */
.params-panel {
  width: 282px;
  flex-shrink: 0;
  background: var(--bg-card);
  overflow-y: auto;
  padding: 24px;
}
.ps { margin-bottom: 24px; }
.ps-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--ink); margin-bottom: 16px; }
.muted { font-size: 12px; font-weight: 400; color: #f97316; background: #f973161a; padding: 2px 8px; border-radius: 4px; }

.print-preview {
  position: relative; aspect-ratio: 16 / 10; border-radius: var(--r-12);
  overflow: hidden; display: flex; align-items: center; justify-content: center;
  background: var(--surface); margin-bottom: 10px; cursor: pointer;
}
.print-preview img, .print-swatch { width: 100%; height: 100%; object-fit: cover; }
.print-replace { position: absolute; bottom: 8px; right: 8px; font-size: 11px; color: #fff; background: rgba(0,0,0,.45); padding: 2px 10px; border-radius: 999px; }

/* 上传区 r24，图标块 48 r12 #e9f5f3 */
.upload-box {
  width: 100%; border: 1.5px dashed var(--border-2); border-radius: 24px;
  background: var(--surface); padding: 28px 16px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  transition: border-color 0.16s;
}
.upload-box:hover { border-color: var(--primary); }
.upload-ico { width: 48px; height: 48px; border-radius: var(--r-12); background: var(--surface-2); display: inline-flex; align-items: center; justify-content: center; }
.upload-main { font-size: 14px; font-weight: 500; color: var(--ink); }
.upload-sub { font-size: 12px; color: var(--text-3); }

.ps-subtitle { font-size: 12px; font-weight: 400; color: var(--text-2); margin: 16px 0 8px; }

/* 滑块：细轨 + 绿色 */
.slider-row { margin-bottom: 16px; }
.slider-row.disabled { opacity: 0.5; }
.slider-head { display: flex; justify-content: space-between; font-size: 12px; color: var(--ink); margin-bottom: 8px; }
.sv { color: var(--ink); font-weight: 500; }
.slider-row input[type='range'], .strength input[type='range'] {
  width: 100%; height: 4px; border-radius: 8px; background: var(--border-2);
  accent-color: var(--primary); cursor: pointer;
}

/* 段控 #f5faf9 白选中 */
.seg { display: flex; gap: 0; background: var(--surface); border-radius: var(--r-8); padding: 3px; }
.seg button { flex: 1; height: 22px; border-radius: 4px; font-size: 12px; color: var(--text-2); transition: all 0.15s; }
.seg button.active { background: var(--bg-card); color: var(--text-strong); box-shadow: var(--shadow-sm); }

.debug-toggle { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 11px; color: var(--text-3); cursor: pointer; }
.debug-toggle input { accent-color: var(--primary); }

.palette-list { display: flex; flex-direction: column; gap: 8px; }
.palette-list.disabled { opacity: 0.5; }
.palette { display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid var(--border); border-radius: var(--r-nav); background: var(--bg-card); text-align: left; }
.palette.active { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-soft); }
.palette-swatches { display: flex; flex-shrink: 0; }
.palette-swatches span { width: 12px; height: 24px; }
.palette-swatches span:first-child { border-radius: 4px 0 0 4px; }
.palette-swatches span:last-child { border-radius: 0 4px 4px 0; }
.palette-name { display: block; font-size: 12px; font-weight: 600; color: var(--text); }
.palette-desc { font-size: 10px; color: var(--text-3); }
.strength { margin-top: 10px; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 36px; border-radius: var(--r-8); font-size: 13px; font-weight: 600;
  border: 1px solid var(--border); background: var(--bg-card); color: var(--text); width: 100%;
}
.btn.primary { background: var(--primary); color: #fff; border-color: var(--primary); }
.btn.ghost { background: var(--surface); }
.btn:disabled { opacity: 0.45; }
.act-row { display: flex; gap: 8px; margin-bottom: 8px; }
.actions { border-top: 1px solid var(--border); padding-top: 16px; }
.export-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.export-label { font-size: 12px; color: var(--text-3); margin-right: auto; }
.export-row .btn { flex: 0 0 auto; padding: 0 18px; width: auto; }
</style>
