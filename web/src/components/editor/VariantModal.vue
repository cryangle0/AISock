<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-head">
        <div>
          <h3 class="modal-title">{{ mode === 'family' ? '亲子袜' : '款式衍生' }}</h3>
          <p class="modal-sub">{{ mode === 'family' ? '一键生成成人 + 儿童两款' : '基于当前设计 AI 推荐变体' }}</p>
        </div>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="mode === 'derive'" class="count-row">
          <button v-for="n in [1, 2, 4]" :key="n" :class="['count-btn', { active: count === n }]" @click="count = n">{{ n }} 款</button>
        </div>
        <div class="variant-grid">
          <template v-if="loading">
            <div v-for="i in (mode === 'family' ? 2 : count)" :key="i" class="variant-card skeleton">
              <div class="variant-thumb" />
            </div>
          </template>
          <template v-else>
            <button v-for="(v, i) in variants" :key="v.id" :class="['variant-card', { active: picked === v.id }]" @click="picked = v.id">
              <div class="variant-thumb" :style="{ background: thumbBg(i) }">🧦</div>
              <div class="variant-name">{{ v.pattern }}</div>
              <div class="variant-scheme">{{ v.scheme }}</div>
            </button>
          </template>
        </div>
        <p v-if="loading" class="loading-tip">AI 正在创作中…</p>
      </div>

      <div class="modal-foot">
        <button class="btn-ghost" :disabled="loading" @click="$emit('close')">取消</button>
        <button v-if="mode === 'family'" class="btn-primary" :disabled="loading" @click="$emit('saveAll', variants)">保存套装</button>
        <button v-else class="btn-primary" :disabled="loading || !picked" @click="apply">应用此款</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { aiApi, type StyleVariant } from '@/api'

const props = defineProps<{ mode: 'derive' | 'family'; basePrompt: string }>()
const emit = defineEmits<{ close: []; apply: [v: StyleVariant]; saveAll: [vs: StyleVariant[]] }>()

const count = ref(2)
const variants = ref<StyleVariant[]>([])
const picked = ref<string | null>(null)
const loading = ref(true)

const COLORS = ['#C9B89A', '#A8C4B0', '#D6A87A', '#bcb0c0']
const thumbBg = (i: number) => `linear-gradient(180deg, ${COLORS[i % COLORS.length]}, #d4b796)`

async function load() {
  loading.value = true
  try {
    const res = props.mode === 'family' ? await aiApi.family(props.basePrompt) : await aiApi.derive(props.basePrompt, count.value)
    variants.value = res.data
    picked.value = res.data[0]?.id ?? null
  } catch {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}
watch(count, load)
onMounted(load)

function apply() {
  const v = variants.value.find((x) => x.id === picked.value)
  if (v) emit('apply', v)
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(43, 31, 20, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal {
  width: 520px;
  max-width: 92vw;
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}
.modal-title {
  font-size: 18px;
  font-weight: 800;
  font-family: var(--font-art);
}
.modal-sub {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 4px;
}
.modal-close {
  border: none;
  background: none;
  font-size: 18px;
  color: var(--text-3);
}
.modal-body {
  padding: 20px 24px;
}
.count-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.count-btn {
  flex: 1;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  font-size: 13px;
  color: var(--text-2);
}
.count-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.variant-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.variant-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: var(--bg-card);
}
.variant-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-soft);
}
.variant-thumb {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}
.variant-card.skeleton .variant-thumb {
  background: var(--bg-hover);
}
.variant-name {
  font-size: 13px;
  font-weight: 600;
}
.variant-scheme {
  font-size: 11px;
  color: var(--text-3);
}
.loading-tip {
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 14px;
}
.modal-foot {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}
.modal-foot button {
  flex: 1;
}
</style>
