<template>
  <view :class="['sock-canvas', { preview: mode === 'preview' }]">
    <!-- 预览态：离屏渲染成图片，避免 scroll-view 内原生 canvas 不随滚动（真机浮层固定） -->
    <image
      v-if="isPreviewSnapshot"
      class="sock-snapshot"
      :src="snapshotUrl"
      mode="aspectFit"
    />
    <canvas
      v-else
      type="2d"
      :id="canvasId"
      class="sock-cvs"
      :style="{ width: dispW, height: dispH }"
      @tap="onTap"
    />
    <view v-if="!ready" class="cvs-loading">
      <view class="cvs-spinner" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick, getCurrentInstance } from 'vue'
import { drawSock, type SockColors, type SockParams } from './sockShape'
import { drawVectorSock, buildPreviewPrintParams, type SockGeometry } from './sockVector'
import { drawPatternTexture } from './patternDraw'
import { useCatalog } from '@/composables/useCatalog'
import { imageProxyUrl } from '@aisock/service'

const props = defineProps<{
  printImage?: string | null
  patternId?: string | null
  params: SockParams
  colors: SockColors
  sockTypeId?: string | null
  mode?: 'editor' | 'preview'
  /** 预览态：是否为左上角浮层标签预留顶部空白（仅 inline canvas 回退时用） */
  reserveTagSpace?: boolean
}>()

const emit = defineEmits<{ regionClick: [region: string]; ready: [] }>()

const canvasId = 'sockCvs'
const cssSize = 240
const cssSizeH = 320
const dispW = computed(() => (props.mode === 'preview' ? '270rpx' : cssSize + 'px'))
const dispH = computed(() => (props.mode === 'preview' ? '360rpx' : cssSizeH + 'px'))
const ready = ref(false)
const snapshotUrl = ref('')
const isPreviewSnapshot = computed(() => props.mode === 'preview' && snapshotUrl.value)
const instance = getCurrentInstance()
const { getGeometry } = useCatalog()
const geo = ref<SockGeometry | null>(null)

let canvasNode: any = null
let ctx: any = null
let dpr = 1
let pxW = cssSize
let pxH = cssSizeH
let printImgObj: any = null

const PREVIEW_SNAPSHOT_SCALE = 2

function createOffscreen(w: number, h: number): any {
  return (uni as any).createOffscreenCanvas?.({ type: '2d', width: w, height: h }) ?? null
}

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
        const winInfo: any = (uni as any).getWindowInfo ? (uni as any).getWindowInfo() : uni.getSystemInfoSync()
        dpr = (winInfo.pixelRatio as number) || 2
        pxW = cssSize * dpr
        pxH = cssSizeH * dpr
        canvasNode.width = pxW
        canvasNode.height = pxH
        ctx.scale(dpr, dpr)
        resolve()
      })
  })
}

function loadPrintOn(canvas: any, url: string): Promise<any> {
  return new Promise((resolve) => {
    if (!canvas || !url) return resolve(null)
    const tryLoad = (src: string, canProxy: boolean) => {
      try {
        const img = canvas.createImage()
        img.onload = () => resolve(img)
        img.onerror = () => {
          if (canProxy && /^https?:\/\//i.test(url) && !src.includes('/image-proxy')) {
            tryLoad(imageProxyUrl(url), false)
          } else {
            resolve(null)
          }
        }
        img.src = src
      } catch {
        resolve(null)
      }
    }
    tryLoad(url, true)
  })
}

function loadPrint(url: string): Promise<any> {
  if (!canvasNode) return Promise.resolve(null)
  return loadPrintOn(canvasNode, url)
}

function buildPatternImage(patternId: string): any {
  try {
    const size = 200
    const off = createOffscreen(size, size)
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

function previewVectorOpts() {
  return {
    bg: null,
    padRatio: 0.03,
    fitContent: true,
    topReserveRatio: props.reserveTagSpace ? 0.12 : 0.05,
    noStroke: true,
    previewPrint: true,
  }
}

async function resolvePrintImg(canvas: any): Promise<any> {
  if (props.printImage) {
    const loaded = await loadPrintOn(canvas, props.printImage)
    if (loaded) return loaded
  }
  if (props.patternId) return buildPatternImage(props.patternId)
  return printImgObj
}

function drawToContext(targetCtx: any, img: any) {
  const preview = props.mode === 'preview'
  if (geo.value) {
    drawVectorSock(
      targetCtx, cssSize, cssSizeH, geo.value, props.colors, props.params, img,
      preview ? previewVectorOpts() : undefined,
    )
  } else {
    drawSock(
      targetCtx, cssSize, cssSizeH, props.colors,
      preview ? buildPreviewPrintParams(props.params, { w: cssSize, h: cssSizeH }, 1) : props.params,
      img, props.sockTypeId, preview ? null : undefined,
    )
  }
}

async function renderPreviewSnapshot(): Promise<boolean> {
  const scale = PREVIEW_SNAPSHOT_SCALE
  const off = createOffscreen(cssSize * scale, cssSizeH * scale)
  if (!off) return false
  const octx = off.getContext('2d')
  octx.scale(scale, scale)
  const img = await resolvePrintImg(off)
  drawToContext(octx, img)
  const path = await new Promise<string>((resolve) => {
    ;(uni.canvasToTempFilePath as any)({
      canvas: off,
      success: (r: any) => resolve(r.tempFilePath || ''),
      fail: () => resolve(''),
    })
  })
  if (path) snapshotUrl.value = path
  return true
}

async function renderInline() {
  if (!ctx) return
  let img = printImgObj
  if (!img && props.patternId) img = buildPatternImage(props.patternId)
  const preview = props.mode === 'preview'
  if (geo.value) {
    drawVectorSock(
      ctx, cssSize, cssSizeH, geo.value, props.colors, props.params, img,
      preview ? previewVectorOpts() : undefined,
    )
  } else {
    drawSock(
      ctx, cssSize, cssSizeH, props.colors,
      preview ? buildPreviewPrintParams(props.params, { w: cssSize, h: cssSizeH }, 1) : props.params,
      img, props.sockTypeId, preview ? null : undefined,
    )
  }
}

async function render() {
  if (props.mode === 'preview') {
    ready.value = false
    snapshotUrl.value = ''
    const ok = await renderPreviewSnapshot()
    if (!ok) {
      await initCanvas()
      if (props.printImage) printImgObj = await loadPrint(props.printImage)
      await renderInline()
    }
    ready.value = true
    return
  }
  await renderInline()
}

watch(
  () => props.printImage,
  async (url) => {
    if (props.mode === 'preview') {
      render()
      return
    }
    if (url) printImgObj = await loadPrint(url)
    else printImgObj = null
    render()
  },
)
watch(() => props.patternId, render)
watch(() => props.sockTypeId, async (code) => {
  geo.value = code ? await getGeometry(code) : null
  render()
})
watch(() => [props.colors, props.params], render, { deep: true })

function onTap(e: any) {
  const y = e.detail?.y ?? e.touches?.[0]?.y ?? 0
  const ratio = cssSizeH ? (y % cssSizeH) / cssSizeH : 0
  let region = 'body'
  if (ratio < 0.24) region = 'welt'
  else if (ratio > 0.7) region = 'heel'
  emit('regionClick', region)
}

async function exportImage(fileType: 'png' | 'jpg' = 'png'): Promise<string> {
  if (props.mode === 'preview') {
    ready.value = false
    const ok = await renderPreviewSnapshot()
    ready.value = true
    if (ok && snapshotUrl.value) return snapshotUrl.value
  }
  return new Promise((resolve) => {
    if (!canvasNode) return resolve('')
    ;(uni.canvasToTempFilePath as any)(
      {
        canvas: canvasNode,
        fileType,
        quality: fileType === 'jpg' ? 0.92 : 1,
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
  if (props.sockTypeId) geo.value = await getGeometry(props.sockTypeId)
  if (props.mode === 'preview') {
    await render()
    emit('ready')
    return
  }
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
.sock-canvas.preview {
  padding: 0;
  pointer-events: none;
  width: 270rpx;
  height: 360rpx;
}
.sock-snapshot {
  width: 270rpx;
  height: 360rpx;
  display: block;
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
  border-top-color: #8e4f43;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
