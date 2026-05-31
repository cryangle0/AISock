<template>
  <div class="ai-tab">
    <!-- 文生图 -->
    <div class="ai-hint">
      描述想要的花型，AI 先帮你优化意图再生成
      <span v-if="quota.loaded" class="ai-quota">今日剩 {{ quota.remaining }} 次</span>
    </div>
    <textarea
      v-model="prompt"
      class="ai-textarea"
      placeholder="如：春日樱花飘落，粉色为主，少量金色点缀"
      :disabled="busy"
    />
    <button class="ai-submit" :disabled="!prompt.trim() || busy" @click="onGenerate">
      {{ generating && mode === 'gen' ? '生成中…' : '✨ 生成花型' }}
    </button>
    <div class="ai-presets">
      <button v-for="p in presets" :key="p" class="ai-preset" :disabled="busy" @click="prompt = p">{{ p }}</button>
    </div>

    <!-- 指令改色 / 改背景（基于当前印花图）-->
    <div v-if="currentImage" class="ai-recolor">
      <div class="ai-recolor-head">
        <span class="ai-recolor-title">🎨 指令改色 / 改背景</span>
        <span class="ai-recolor-sub">基于当前印花图</span>
      </div>
      <img :src="currentImage" alt="当前印花" class="ai-recolor-thumb" />
      <input
        v-model="recolorPrompt"
        class="ai-recolor-input"
        placeholder="如：背景换成米白色 / 整体偏冷色调"
        :disabled="busy"
      />
      <button class="ai-recolor-btn" :disabled="!recolorPrompt.trim() || busy" @click="onRecolor">
        {{ generating && mode === 'recolor' ? '改色中…' : '套用指令改色' }}
      </button>
    </div>

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
import { computed, ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { AI_PRESETS } from '@/data/editor'
import { useAiDesign } from '@/composables/useAiDesign'

const props = defineProps<{
  /** 当前画布印花图，用于「指令改色」的参考图；无则隐藏改色入口 */
  currentImage?: string | null
}>()

const emit = defineEmits<{
  /** 生成 / 改色成功：url 结果图，prompt 描述 */
  generated: [url: string, prompt: string]
  toast: [msg: string]
}>()

const presets = AI_PRESETS
const prompt = ref('')
const recolorPrompt = ref('')
const mode = ref<'gen' | 'recolor'>('gen')

const { quota, generating, refreshQuota, optimize, generate, recolor } = useAiDesign()
refreshQuota()

const busy = computed(() => generating.value || optimizeModal.value.open)
const currentImage = computed(() => props.currentImage ?? null)

// ── 意图分析确认弹窗（Promise 化，等待用户选择）──
const optimizeModal = ref<{ open: boolean; original: string; optimized: string }>({
  open: false,
  original: '',
  optimized: '',
})
let optimizeResolver: ((useOptimized: boolean) => void) | null = null

function resolveOptimize(useOptimized: boolean) {
  optimizeModal.value.open = false
  optimizeResolver?.(useOptimized)
  optimizeResolver = null
}

/** 意图分析：优化提示词，若有变化则弹窗让用户确认，返回最终采用的提示词 */
async function confirmPrompt(raw: string): Promise<string> {
  const optimized = await optimize(raw)
  if (!optimized || optimized === raw) return raw
  return new Promise<string>((resolve) => {
    optimizeModal.value = { open: true, original: raw, optimized }
    optimizeResolver = (useOptimized) => resolve(useOptimized ? optimized : raw)
  })
}

async function onGenerate() {
  const raw = prompt.value.trim()
  if (!raw || busy.value) return
  mode.value = 'gen'
  try {
    const finalPrompt = await confirmPrompt(raw)
    const url = await generate(finalPrompt)
    if (url) emit('generated', url, raw)
    else emit('toast', '生成失败，请重试')
  } catch (e) {
    emit('toast', (e as Error).message || '生成失败')
  }
}

async function onRecolor() {
  const ref0 = currentImage.value
  const instruction = recolorPrompt.value.trim()
  if (!ref0 || !instruction || busy.value) return
  mode.value = 'recolor'
  try {
    const url = await recolor(ref0, instruction)
    if (url) {
      emit('generated', url, instruction)
      recolorPrompt.value = ''
    } else {
      emit('toast', '改色失败，请重试')
    }
  } catch (e) {
    emit('toast', (e as Error).message || '改色失败')
  }
}
</script>

<style scoped>
.ai-tab {
  display: flex;
  flex-direction: column;
}
.ai-hint {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.ai-quota {
  font-size: 11px;
  color: var(--primary);
  background: var(--primary-soft);
  padding: 2px 8px;
  border-radius: 999px;
  flex-shrink: 0;
}
.ai-textarea {
  width: 100%;
  height: 90px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px;
  font-size: 12px;
  resize: vertical;
  font-family: inherit;
}
.ai-submit {
  width: 100%;
  height: 36px;
  margin-top: 10px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.ai-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ai-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.ai-preset {
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-2);
  cursor: pointer;
}
.ai-preset:disabled {
  opacity: 0.5;
}
/* 指令改色 */
.ai-recolor {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ai-recolor-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.ai-recolor-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-1);
}
.ai-recolor-sub {
  font-size: 10px;
  color: var(--text-3);
}
.ai-recolor-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--border);
}
.ai-recolor-input {
  width: 100%;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 10px;
  font-size: 12px;
}
.ai-recolor-btn {
  height: 34px;
  border: 1px solid var(--primary);
  background: var(--bg-card);
  color: var(--primary);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.ai-recolor-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
/* 意图分析弹窗 */
.opt-block + .opt-block {
  margin-top: 12px;
}
.opt-label {
  font-size: 11px;
  color: var(--text-3);
  margin-bottom: 4px;
}
.opt-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-1);
}
.opt-text.muted {
  color: var(--text-2);
}
.opt-btn {
  flex: 1;
  height: 38px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.opt-btn.ghost {
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-2);
}
.opt-btn.primary {
  border: none;
  background: var(--primary);
  color: #fff;
}
</style>
