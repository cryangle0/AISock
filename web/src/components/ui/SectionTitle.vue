<template>
  <div class="sec-title">
    <span class="sec-line" :style="lineStyle" />
    <div class="sec-mid">
      <h2 class="sec-text" :style="{ color }">{{ title }}</h2>
      <p v-if="subtitle" class="sec-sub">{{ subtitle }}</p>
    </div>
    <span class="sec-line" :style="lineStyle" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    color?: string
    lineWidth?: number
  }>(),
  { color: '#8e4f43', lineWidth: 36 },
)

const lineStyle = computed(() => ({
  width: `${props.lineWidth}px`,
  background: props.color,
}))
</script>

<style scoped>
.sec-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.sec-line {
  height: 2px;
  flex-shrink: 0;
  opacity: 0.7;
  border-radius: 1px;
}
.sec-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.sec-text {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  font-family: var(--font-art);
  letter-spacing: 0.04em;
}
.sec-sub {
  margin: 0;
  font-size: 12px;
  color: var(--text-3);
  letter-spacing: 0.08em;
}
</style>
