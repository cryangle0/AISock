<template>
  <BaseModal
    :title="mode === 'family' ? '亲子袜' : '款式衍生'"
    :subtitle="mode === 'family' ? '一键生成成人 + 儿童两款' : '基于当前设计 AI 推荐整套变体'"
    size="lg"
    :closable="!loading"
    @close="$emit('close')"
  >
    <div v-if="mode === 'derive'" class="count-row">
      <button v-for="n in counts" :key="n" :class="['count-btn', { active: count === n }]" @click="count = n">
        {{ n }} 款
      </button>
    </div>

    <div class="variant-grid">
      <template v-if="loading">
        <div v-for="i in (mode === 'family' ? 2 : count)" :key="i" class="variant-card skeleton">
          <div class="variant-thumb" />
          <div class="sk-line" />
        </div>
      </template>
      <template v-else>
        <button
          v-for="v in variants"
          :key="v.id"
          :class="['variant-card', { active: picked === v.id }]"
          @click="picked = v.id"
        >
          <div class="variant-thumb">
            <img v-if="v.cover" :src="v.cover" :alt="v.pattern" />
            <span v-else class="thumb-fallback">🧦</span>
          </div>
          <div class="variant-name">{{ v.pattern }}</div>
          <div class="variant-scheme">{{ v.scheme }}</div>
        </button>
      </template>
    </div>
    <p v-if="loading" class="loading-tip">AI 正在创作并渲染预览…</p>

    <template #footer>
      <button class="cta secondary" :disabled="loading" @click="$emit('close')">取消</button>
      <button v-if="mode === 'family'" class="cta primary" :disabled="loading" @click="$emit('saveAll', variants)">
        保存套装到我的设计
      </button>
      <button v-else class="cta primary" :disabled="loading || !picked" @click="apply">应用此款</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import {
  deriveStyleVariants,
  deriveFamilyPair,
  STYLE_VARIANT_COUNTS,
  type DesignVariant,
  type SockColors,
  type SockParams,
  type SockResources,
} from '@/engine'

const props = defineProps<{
  mode: 'derive' | 'family'
  baseDesign: { printName: string; colors: SockColors; params: SockParams }
  resources: SockResources | null
}>()
const emit = defineEmits<{ close: []; apply: [v: DesignVariant]; saveAll: [vs: DesignVariant[]] }>()

const counts = STYLE_VARIANT_COUNTS
const count = ref(2)
const variants = ref<DesignVariant[]>([])
const picked = ref<string | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const res =
      props.mode === 'family'
        ? await deriveFamilyPair(props.baseDesign, props.resources)
        : await deriveStyleVariants(props.baseDesign, count.value, props.resources)
    variants.value = res
    picked.value = res[0]?.id ?? null
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
  cursor: pointer;
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
  cursor: pointer;
}
.variant-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-soft);
}
.variant-thumb {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  overflow: hidden;
}
.variant-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.thumb-fallback {
  font-size: 40px;
}
.variant-card.skeleton .variant-thumb {
  background: var(--bg-hover);
  animation: pulse 1.2s ease-in-out infinite;
}
.sk-line {
  width: 60%;
  height: 12px;
  border-radius: 6px;
  background: var(--bg-hover);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  50% {
    opacity: 0.5;
  }
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
.cta {
  flex: 1;
  height: 44px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.cta.secondary {
  background: var(--bg-hover);
  color: var(--text-2);
}
.cta.primary {
  background: var(--primary);
  color: #fff;
}
.cta:disabled {
  opacity: 0.5;
}
</style>
