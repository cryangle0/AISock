<template>
  <div class="sock-picker" @click.stop>
    <div class="sp-tabs">
      <button
        v-for="[fam] in families"
        :key="fam"
        :class="['sp-tab', { active: fam === activeFam }]"
        @click="activeFam = fam"
      >{{ fam }}</button>
    </div>
    <div v-if="loading" class="sp-hint">加载袜版中…</div>
    <div v-else-if="!current.length" class="sp-hint">暂无袜版</div>
    <div v-else class="sp-grid">
      <button
        v-for="s in current"
        :key="s.code"
        :class="['sp-item', { active: s.code === modelValue }]"
        :title="s.name"
        @click="pick(s.code)"
      >
        <span class="sp-thumb">
          <SockThumb :code="s.code" />
        </span>
        <span class="sp-name">{{ shortName(s) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSockCatalog } from '@/composables/useSockCatalog'
import type { SockModel } from '@/api'
import SockThumb from './SockThumb.vue'

const props = defineProps<{ modelValue: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [code: string]; select: [code: string] }>()

const { families, loading, load, findByCode } = useSockCatalog()
const activeFam = ref<string>('直板')

onMounted(load)

watch(
  () => [props.modelValue, families.value.length] as const,
  () => {
    const cur = props.modelValue ? findByCode(props.modelValue) : null
    if (cur?.family) activeFam.value = cur.family
    else if (families.value.length && !families.value.some(([f]) => f === activeFam.value)) activeFam.value = families.value[0][0]
  },
  { immediate: true },
)

const current = computed<SockModel[]>(() => families.value.find(([f]) => f === activeFam.value)?.[1] ?? [])

function shortName(s: SockModel) {
  return (s.name || s.code).replace(/^(直板|弯板)[·\s]*/, '')
}
function pick(code: string) {
  emit('update:modelValue', code)
  emit('select', code)
}
</script>

<style scoped>
.sock-picker { width: 320px; max-height: 420px; display: flex; flex-direction: column; }
.sp-tabs { display: flex; gap: 6px; padding: 4px; background: var(--surface); border-radius: var(--r-8); margin-bottom: 10px; }
.sp-tab { flex: 1; height: 32px; border-radius: var(--r-8); font-size: 13px; font-weight: 600; color: var(--text-3); transition: all 0.15s; }
.sp-tab.active { background: var(--bg-card); color: var(--primary); box-shadow: var(--shadow-sm); }
.sp-hint { padding: 30px 0; text-align: center; font-size: 13px; color: var(--text-3); }
.sp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; overflow-y: auto; padding: 2px; }
.sp-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border: none;
  border-radius: var(--r-8);
  background: transparent;
  transition: opacity 0.15s;
}
.sp-item:hover { opacity: 0.92; }
.sp-thumb {
  width: 100%;
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid var(--primary);
  border-radius: 8px;
  box-sizing: border-box;
  padding: 4px;
}
.sp-item.active .sp-thumb {
  border: 2px solid var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}
.sp-name { font-size: 11px; color: var(--text-2); text-align: center; line-height: 1.2; }
.sp-item.active .sp-name { color: var(--text-strong); font-weight: 600; }
</style>
