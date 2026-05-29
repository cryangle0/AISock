<template>
  <div class="base-color" :class="{ highlight }" :data-region="label">
    <div v-if="label" class="bc-label">{{ label }}</div>
    <div class="bc-filter">
      <div class="bc-cats">
        <button
          v-for="c in categories"
          :key="c.key"
          type="button"
          :class="['bc-cat', { active: cat === c.key }]"
          @click="cat = c.key"
        >
          {{ c.label }}
        </button>
      </div>
      <div class="bc-search">
        <input v-model="query" placeholder="搜颜色" />
      </div>
    </div>
    <div class="bc-grid">
      <button
        v-for="p in presets"
        :key="p.value"
        type="button"
        :class="['bc-chip', { active: isActive(p), auto: p.hex == null }]"
        :style="p.hex ? { background: p.hex } : undefined"
        :title="p.label"
        @click="$emit('change', p.hex)"
      >
        <span v-if="isActive(p)" class="bc-check">✓</span>
        <span v-else-if="p.hex == null" class="bc-auto">自动</span>
      </button>
      <div v-if="presets.length === 0" class="bc-empty">没有匹配的颜色</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { BASE_COLOR_PRESETS, COLOR_CATEGORIES, type ColorPreset } from '@/data/editor'

const props = withDefaults(
  defineProps<{ label?: string; value: string | null; allowAuto?: boolean; highlight?: boolean }>(),
  { allowAuto: true, highlight: false },
)
defineEmits<{ change: [hex: string | null] }>()

const categories = COLOR_CATEGORIES
const cat = ref('all')
const query = ref('')

const presets = computed<ColorPreset[]>(() => {
  let list = props.allowAuto ? BASE_COLOR_PRESETS : BASE_COLOR_PRESETS.filter((p) => p.value !== 'auto')
  if (cat.value !== 'all') list = list.filter((p) => p.category === cat.value || p.category === 'auto')
  if (query.value) list = list.filter((p) => p.label.includes(query.value))
  return list
})

function isActive(p: ColorPreset): boolean {
  return (p.hex == null && props.value == null) || (!!p.hex && p.hex === props.value)
}
</script>

<style scoped>
.base-color {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.base-color.highlight {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.bc-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}
.bc-filter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.bc-cats {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.bc-cat {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  border: none;
  background: var(--bg-hover);
  color: var(--text-2);
}
.bc-cat.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}
.bc-search input {
  width: 100%;
  height: 26px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0 8px;
  font-size: 11px;
}
.bc-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
}
.bc-chip {
  aspect-ratio: 1;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  position: relative;
}
.bc-chip.auto {
  background: repeating-linear-gradient(45deg, #eee, #eee 4px, #fff 4px, #fff 8px);
}
.bc-chip.active {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}
.bc-check {
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  font-weight: 700;
}
.bc-auto {
  color: var(--text-2);
  font-size: 9px;
}
.bc-empty {
  grid-column: 1 / -1;
  font-size: 11px;
  color: var(--text-3);
  text-align: center;
  padding: 8px 0;
}
</style>
