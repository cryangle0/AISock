<template>
  <view class="sock-canvas">
    <canvas
      type="2d"
      :id="canvasId"
      class="sock-cvs"
      :style="{ width: cssSize + 'px', height: cssSizeH + 'px' }"
      @tap="onTap"
    />
    <view v-if="!ready" class="cvs-loading">
      <view class="cvs-spinner" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick, getCurrentInstance } from 'vue'
import { drawSock, type SockColors, type SockParams } from './sockShape'
import { drawPatternTexture } from './patternDraw'

const props = defineProps<{
  printImage?: string | null
  patternId?: string | null
  params: SockParams
  colors: SockColors
  sockTypeId?: string | null
}>()

const emit = defineEmits<{ regionClick: [region: string]; ready: [] }>()

const canvasId = 'sockCvs'
const cssSize = 240
const cssSizeH = 320
const ready = ref(false)
const instance = getCurrentInstance()

let canvasNode: any = null
let ctx: any = null
let dpr = 1
let pxW = cssSize
let pxH = cssSizeH
let printImgObj: any = null

function initCanvas(): Promise<void> {
  return new Promise((resolve) => {
    const query = (uni.createSelectorQuery() as any).in(instance)
    query
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res: any) => {
        const info = res?.[0]
        if (!info?.node) {
          resolve()
          return
        }
        canvasNode = info.node
        ctx = canvasNode.getContext('2d')
        dpr = (uni.getSystemInfoSync().pixelRatio as number) || 2
        pxW = cssSize * dpr
        pxH = cssSizeH * dpr
        canvasNode.width = pxW
        canvasNode.height = pxH
        ctx.scale(dpr, dpr)
        resolve()
      })
  })
}

/** 加载印花图为 canvas 图源 */
function loadPrint(url: string): Promise<any> {
  return new Promise((resolve) => {
    if (!canvasNode) return resolve(null)
    const img = canvasNode.createImage()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** 内置花型 → 离屏纹理图源（矢量自绘，兼容性最好） */
function buildPatternImage(patternId: string): any {
  try {
    const size = 200
    const off = (uni as any).createOffscreenCanvas?.({ type: '2d', width: size, height: size })
    if (off) {
      const octx = off.getContext('2d')
      drawPatternTexture(off, octx, size, patternId)
      return off
    }
  } catch {
    /* 回退到无印花 */
  }
  return null
}

async function render() {
  if (!ctx) return
  let img = printImgObj
  if (!img && props.patternId) {
    img = buildPatternImage(props.patternId)
  }
  drawSock(ctx, cssSize, cssSizeH, props.colors, props.params, img, props.sockTypeId)
}

watch(
  () => props.printImage,
  async (url) => {
    if (url) {
      printImgObj = await loadPrint(url)
    } else {
      printImgObj = null
    }
    render()
  },
)
watch(() => props.patternId, render)
watch(() => props.sockTypeId, render)
watch(() => [props.colors, props.params], render, { deep: true })

function onTap(e: any) {
  // 命中分区：按 y 比例划分 螺口/袜身/脚掌
  const y = e.detail?.y ?? e.touches?.[0]?.y ?? 0
  const ratio = cssSizeH ? (y % cssSizeH) / cssSizeH : 0
  let region = 'body'
  if (ratio < 0.24) region = 'welt'
  else if (ratio > 0.7) region = 'heel'
  emit('regionClick', region)
}

/** 导出当前画布为临时文件路径（用于保存/下单封面） */
function exportImage(): Promise<string> {
  return new Promise((resolve) => {
    if (!canvasNode) return resolve('')
    ;(uni.canvasToTempFilePath as any)(
      {
        canvas: canvasNode,
        success: (r: any) => resolve(r.tempFilePath || ''),
        fail: () => resolve(''),
      },
      instance,
    )
  })
}

defineExpose({ exportImage })

onMounted(async () => {
  await nextTick()
  await initCanvas()
  ready.value = true
  if (props.printImage) printImgObj = await loadPrint(props.printImage)
  render()
  emit('ready')
})
</script>

<style scoped lang="scss">
.sock-canvas {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 0;
}
.sock-cvs {
  display: block;
}
.cvs-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cvs-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 6rpx solid #e8ded0;
  border-top-color: #946d60;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
