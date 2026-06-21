<template>
  <canvas ref="canvasEl" class="sock-thumb-canvas" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { renderVectorSock, DEFAULT_COLORS, DEFAULT_PARAMS } from '@/engine'
import { useSockCatalog } from '@/composables/useSockCatalog'

const props = defineProps<{ code: string }>()

const { getGeometry } = useSockCatalog()
const canvasEl = ref<HTMLCanvasElement | null>(null)

async function draw() {
  const geo = await getGeometry(props.code)
  if (geo?.ready && canvasEl.value) {
    renderVectorSock(canvasEl.value, geo, null, DEFAULT_COLORS, DEFAULT_PARAMS, 0.45)
  }
}

onMounted(draw)
watch(() => props.code, draw)
</script>

<style scoped>
.sock-thumb-canvas {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}
</style>
