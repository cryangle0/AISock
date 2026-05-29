<template>
  <svg :viewBox="`0 0 60 60`" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern :id="pid" patternUnits="userSpaceOnUse" :width="tile" :height="tile">
        <rect :width="tile" :height="tile" :fill="def.bg" />
        <!-- 碎花 / 大花 -->
        <template v-if="def.id === 'p-floral' || def.id === 'p-flower-big'">
          <circle :cx="tile / 2" :cy="tile / 2" :r="tile / 5" :fill="def.fg" />
          <circle :cx="tile / 2" :cy="tile / 2 - tile / 4" :r="tile / 9" :fill="def.fg" opacity="0.7" />
          <circle :cx="tile / 2 + tile / 4" :cy="tile / 2" :r="tile / 9" :fill="def.fg" opacity="0.7" />
          <circle :cx="tile / 2" :cy="tile / 2 + tile / 4" :r="tile / 9" :fill="def.fg" opacity="0.7" />
          <circle :cx="tile / 2 - tile / 4" :cy="tile / 2" :r="tile / 9" :fill="def.fg" opacity="0.7" />
        </template>
        <!-- 条纹 -->
        <template v-else-if="def.id === 'p-stripe'">
          <rect :width="tile / 2" :height="tile" :fill="def.fg" opacity="0.85" />
        </template>
        <!-- 圆点 -->
        <template v-else-if="def.id === 'p-dots' || def.id === 'p-blue'">
          <circle :cx="tile / 2" :cy="tile / 2" :r="tile / 4" :fill="def.fg" />
        </template>
        <!-- 方格 -->
        <template v-else-if="def.id === 'p-checker'">
          <rect :width="tile / 2" :height="tile / 2" :fill="def.fg" opacity="0.85" />
          <rect :x="tile / 2" :y="tile / 2" :width="tile / 2" :height="tile / 2" :fill="def.fg" opacity="0.85" />
        </template>
        <!-- 单色 -->
        <template v-else-if="def.id === 'p-mono'">
          <rect :width="tile" :height="tile" :fill="def.fg" opacity="0.3" />
        </template>
        <!-- 金色 / 薄荷：菱格 -->
        <template v-else>
          <path :d="`M${tile / 2} 0 L${tile} ${tile / 2} L${tile / 2} ${tile} L0 ${tile / 2} Z`" :fill="def.fg" opacity="0.6" />
        </template>
      </pattern>
    </defs>
    <rect width="60" height="60" :rx="rounded ? 8 : 0" :fill="`url(#${pid})`" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PATTERN_LIST, type PatternDef } from '@/data/editor'

const props = withDefaults(
  defineProps<{ patternId: string; uid: string; rounded?: boolean }>(),
  { rounded: true },
)

const def = computed<PatternDef>(
  () => PATTERN_LIST.find((p) => p.id === props.patternId) || PATTERN_LIST[0],
)
const pid = computed(() => `pat-${props.patternId}-${props.uid}`)
const tile = computed(() => (def.value.id === 'p-flower-big' ? 30 : 15))
</script>
