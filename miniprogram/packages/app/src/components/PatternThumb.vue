<template>
  <view class="pattern-thumb" :style="{ background: def.bg }">
    <view class="pt-shape" :style="shapeStyle" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PATTERN_LIST } from '@aisock/common'

const props = defineProps<{ patternId: string }>()
const def = computed(() => PATTERN_LIST.find((p) => p.id === props.patternId) || PATTERN_LIST[0])

const shapeStyle = computed(() => {
  const fg = def.value.fg
  const id = def.value.id
  if (id === 'p-stripe') return { background: `repeating-linear-gradient(90deg, ${fg} 0, ${fg} 8rpx, transparent 8rpx, transparent 16rpx)`, width: '100%', height: '100%', borderRadius: '0' }
  if (id === 'p-checker') return { background: `repeating-conic-gradient(${fg} 0% 25%, transparent 0% 50%) 0 / 24rpx 24rpx`, width: '100%', height: '100%', borderRadius: '0' }
  if (id === 'p-mono') return { background: fg, width: '100%', height: '100%', borderRadius: '0', opacity: '0.3' }
  // 默认：中央圆点（碎花/大花/圆点/蓝花/金色/薄荷）
  return { background: fg, width: '48rpx', height: '48rpx', borderRadius: '50%', opacity: '0.75' }
})
</script>

<style scoped lang="scss">
.pattern-thumb {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.pt-shape {
  flex-shrink: 0;
}
</style>
