<template>
  <span class="app-icon" :style="{ width: size + 'px', height: size + 'px', color }" v-html="svg" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ICONS } from './icons'

const props = withDefaults(defineProps<{ name: string; size?: number; color?: string }>(), {
  size: 24,
  color: 'currentColor',
})

const svg = computed(() => {
  const def = ICONS[props.name]
  if (!def) return ''
  return `<svg viewBox="${def.vb}" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">${def.body}</svg>`
})
</script>

<style scoped>
.app-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
}
.app-icon :deep(svg) {
  display: block;
}
</style>
