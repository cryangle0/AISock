<template>
  <svg viewBox="0 0 480 640" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <defs>
      <clipPath :id="`mc-body-${uid}`">
        <path :d="sockPath" />
      </clipPath>
    </defs>
    <g :clip-path="`url(#mc-body-${uid})`">
      <rect x="100" y="60" width="280" height="44" :fill="regions.welt" />
      <rect x="100" y="104" width="280" height="56" :fill="regions.cuff" />
      <rect x="100" y="160" width="280" height="320" :fill="regions.body" />
      <rect x="100" y="478" width="280" height="120" :fill="regions.toe" />
    </g>
    <path :d="sockPath" fill="none" stroke="rgba(43,31,20,0.14)" stroke-width="1.5" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  uid: string
  regions: { welt: string; cuff: string; body: string; toe: string }
}>()

const sockPath =
  'M100 60 L380 60 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z'
</script>
