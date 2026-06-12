<template>
  <image
    class="app-icon"
    :src="dataUri"
    mode="aspectFit"
    :style="{ width: sizePx, height: sizePx }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ICONS } from './icons'

const props = withDefaults(
  defineProps<{
    /** 图标名（见 icons.ts 注册表） */
    name: string
    /** 尺寸（rpx） */
    size?: number
    /** 颜色（默认主色） */
    color?: string
  }>(),
  { size: 32, color: '#8e4f43' },
)

const sizePx = computed(() => `${props.size}rpx`)

/**
 * 把注册的 SVG（含 {C} 颜色占位）拼成完整 svg，替换颜色后转 data URI。
 * 用 encodeURIComponent 而非 base64，体积更小、调试更直观，mp-weixin <image> 完整支持。
 */
const dataUri = computed(() => {
  const def = ICONS[props.name]
  if (!def) return ''
  const body = def.body.split('{C}').join(props.color)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${def.vb}" fill="none">${body}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
})
</script>

<style scoped>
.app-icon {
  display: block;
}
</style>
