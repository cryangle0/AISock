<template>
  <div class="ai-tab">
    <!-- 快速选择（单选） -->
    <div class="qs-card">
      <div class="qs-head"><span class="qs-title">快速选择</span><span class="qs-sub">（单选）</span></div>
      <div class="qs-chips">
        <button
          v-for="s in STYLE_CHIPS"
          :key="s"
          :class="['qs-chip', { on: selected === s }]"
          :disabled="busy"
          @click="selectStyle(s)"
        >{{ s }}</button>
        <button class="qs-chip custom" :disabled="busy" @click="focusPrompt">
          <AppIcon name="plus" :size="10" /> 自定义
        </button>
      </div>
    </div>

    <!-- 上传参考图 + 描述 -->
    <div class="up-card">
      <div class="up-head">
        <button class="up-row" :disabled="busy || refImages.length >= MAX_REF" @click="pickRef">
          <span class="up-ico"><AppIcon name="plus" :size="16" color="var(--primary)" /></span>
          <span class="up-label">上传参考图</span>
          <span v-if="refImages.length" class="up-count">{{ refImages.length }}/{{ MAX_REF }}</span>
        </button>
        <span class="up-hint">最多 {{ MAX_REF }} 张，按顺序作为多图参考</span>
      </div>
      <div v-if="refImages.length" class="ref-grid">
        <div v-for="(img, i) in refImages" :key="`${i}-${img.slice(0, 24)}`" class="ref-item">
          <img :src="img" :alt="`参考图 ${i + 1}`" />
          <span class="ref-badge">{{ i + 1 }}</span>
          <button type="button" class="ref-remove" :disabled="busy" aria-label="移除" @click="removeRef(i)">×</button>
        </div>
        <button
          v-if="refImages.length < MAX_REF"
          type="button"
          class="ref-add"
          :disabled="busy"
          aria-label="继续添加"
          @click="pickRef"
        >
          <AppIcon name="plus" :size="18" color="var(--primary)" />
        </button>
      </div>
      <textarea
        ref="promptEl"
        v-model="prompt"
        class="up-textarea"
        placeholder="如：春日樱花飘落，粉色为主，少量金色点缀"
        :disabled="busy"
      />
      <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onRefFiles" />
    </div>

    <!-- 生成花型 -->
    <button class="gen-btn" :disabled="busy || !hasInput" @click="onGenerate">
      {{ generating ? '生成中…' : '生成花型' }}
    </button>

    <!-- 意图分析确认 -->
    <BaseModal
      v-if="optimizeModal.open"
      title="AI 已优化你的描述"
      subtitle="可直接采用优化版，或保留原文"
      size="sm"
      @close="resolveOptimize(false)"
    >
      <div class="opt-block">
        <div class="opt-label">原文</div>
        <p class="opt-text muted">{{ optimizeModal.original }}</p>
      </div>
      <div class="opt-block">
        <div class="opt-label">优化后</div>
        <p class="opt-text">{{ optimizeModal.optimized }}</p>
      </div>
      <template #footer>
        <button class="opt-btn ghost" @click="resolveOptimize(false)">用原文</button>
        <button class="opt-btn primary" @click="resolveOptimize(true)">用优化版</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAiDesign } from '@/composables/useAiDesign'

defineProps<{
  /** 当前画布印花图（保留 prop 兼容上层调用，AI 生成以参考图/描述为准） */
  currentImage?: string | null
}>()

const emit = defineEmits<{
  generated: [url: string, prompt: string]
  toast: [msg: string]
}>()

/** wan2.7-image-pro 官方多图参考上限 */
const MAX_REF = 9

/** 设计稿快速选择风格（单选） */
const STYLE_CHIPS = ['春日樱花', '复古条纹', '蓝色清爽', '简约几何', '金色奢华', '薄荷清新']

const selected = ref('')
const prompt = ref('')
const refImages = ref<string[]>([])
const promptEl = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const { generating, refreshQuota, optimize, generate, remix } = useAiDesign()
refreshQuota()

const busy = computed(() => generating.value || optimizeModal.value.open)
const hasInput = computed(() => !!prompt.value.trim() || !!selected.value)

function selectStyle(s: string) {
  selected.value = selected.value === s ? '' : s
}
function focusPrompt() { nextTick(() => promptEl.value?.focus()) }
function pickRef() {
  if (refImages.value.length >= MAX_REF) {
    emit('toast', `最多上传 ${MAX_REF} 张参考图`)
    return
  }
  fileInput.value?.click()
}
function onRefFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = [...(input.files || [])]
  input.value = ''
  if (!files.length) return
  const room = MAX_REF - refImages.value.length
  if (room <= 0) return
  for (const f of files.slice(0, room)) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      if (url && refImages.value.length < MAX_REF) refImages.value.push(url)
    }
    reader.readAsDataURL(f)
  }
}
function removeRef(i: number) {
  refImages.value.splice(i, 1)
}

/** 选中风格 + 自定义描述合成最终提示词 */
function buildPrompt(): string {
  const parts = selected.value ? [selected.value] : []
  const custom = prompt.value.trim()
  if (custom) parts.push(custom)
  return parts.join('，')
}

// ── 意图分析确认弹窗 ──
const optimizeModal = ref<{ open: boolean; original: string; optimized: string }>({ open: false, original: '', optimized: '' })
let optimizeResolver: ((useOptimized: boolean) => void) | null = null
function resolveOptimize(useOptimized: boolean) {
  optimizeModal.value.open = false
  optimizeResolver?.(useOptimized)
  optimizeResolver = null
}
async function confirmPrompt(raw: string): Promise<string> {
  const optimized = await optimize(raw)
  if (!optimized || optimized === raw) return raw
  return new Promise<string>((resolve) => {
    optimizeModal.value = { open: true, original: raw, optimized }
    optimizeResolver = (useOptimized) => resolve(useOptimized ? optimized : raw)
  })
}

async function onGenerate() {
  const raw = buildPrompt()
  if (!raw || busy.value) return
  try {
    if (refImages.value.length) {
      const url = await remix([...refImages.value], raw)
      if (url) emit('generated', url, raw)
      else emit('toast', '生成失败，请重试')
    } else {
      const finalPrompt = await confirmPrompt(raw)
      const url = await generate(finalPrompt)
      if (url) emit('generated', url, raw)
      else emit('toast', '生成失败，请重试')
    }
  } catch (e) {
    emit('toast', (e as Error).message || '生成失败')
  }
}
</script>

<style scoped>
.ai-tab { display: flex; flex-direction: column; gap: 12px; }

/* 快速选择卡 r16 #f5faf9 */
.qs-card { background: var(--surface); border-radius: var(--r-card); padding: 16px; }
.qs-head { display: flex; align-items: baseline; gap: 4px; margin-bottom: 12px; }
.qs-title { font-size: 13px; font-weight: 600; color: var(--ink); }
.qs-sub { font-size: 12px; color: #999999; }
.qs-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.qs-chip {
  height: 30px; padding: 0 14px; border-radius: 9999px;
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--text-strong);
  background: var(--bg-card); border: 1px solid var(--border-strong);
  transition: all 0.15s;
}
.qs-chip:hover { border-color: var(--primary); }
.qs-chip.on { background: var(--primary); color: #fff; border-color: var(--primary); }
.qs-chip.custom { color: var(--text-2); }
.qs-chip:disabled { opacity: 0.6; }

/* 上传参考图 + 描述 r16 虚线卡 */
.up-card {
  border: 1.5px dashed var(--border-strong); border-radius: var(--r-card);
  padding: 14px; display: flex; flex-direction: column; gap: 12px;
  min-height: 300px;
}
.up-head { display: flex; flex-direction: column; gap: 6px; }
.up-row { display: flex; align-items: center; gap: 12px; text-align: left; }
.up-ico {
  width: 40px; height: 40px; border-radius: var(--r-12);
  background: var(--surface); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.up-label { font-size: 14px; font-weight: 500; color: var(--text-strong); }
.up-count {
  margin-left: auto; font-size: 11px; font-weight: 600; color: var(--primary);
  background: rgba(46, 125, 90, 0.1); padding: 2px 8px; border-radius: 999px;
}
.up-hint { font-size: 11px; color: var(--text-3); padding-left: 52px; }

.ref-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.ref-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--r-8);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
}
.ref-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ref-badge {
  position: absolute; left: 6px; top: 6px;
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 999px; background: rgba(0,0,0,0.55); color: #fff;
  font-size: 10px; font-weight: 600; line-height: 18px; text-align: center;
}
.ref-remove {
  position: absolute; right: 4px; top: 4px;
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(0,0,0,0.55); color: #fff; font-size: 14px; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.15s;
}
.ref-item:hover .ref-remove { opacity: 1; }
.ref-add {
  aspect-ratio: 1;
  border-radius: var(--r-8);
  border: 1.5px dashed var(--border-strong);
  background: var(--surface);
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.15s, background 0.15s;
}
.ref-add:hover { border-color: var(--primary); background: #fff; }

.up-textarea {
  flex: 1; min-height: 80px; border: none; background: transparent; resize: none;
  font-size: 12px; line-height: 1.6; color: var(--text); font-family: inherit;
}
.up-textarea::placeholder { color: #c9c9c9; }

/* 生成花型 r16 绿 */
.gen-btn {
  height: 47px; border-radius: var(--r-card);
  background: var(--primary); color: #fff; font-size: 12px; font-weight: 500;
  transition: background 0.16s;
}
.gen-btn:hover { background: var(--primary-hover); }
.gen-btn:disabled { opacity: 0.5; }

/* 意图分析弹窗 */
.opt-block + .opt-block { margin-top: 12px; }
.opt-label { font-size: 11px; color: var(--text-3); margin-bottom: 4px; }
.opt-text { font-size: 13px; line-height: 1.5; color: var(--text); }
.opt-text.muted { color: var(--text-2); }
.opt-btn { flex: 1; height: 38px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.opt-btn.ghost { border: 1px solid var(--border); background: #fff; color: var(--text-2); }
.opt-btn.primary { background: var(--primary); color: #fff; }
</style>
