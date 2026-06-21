<template>
  <BaseModal
    :title="mode === 'family' ? '亲子袜' : '款式衍生'"
    :subtitle="mode === 'family' ? '一键生成成人 + 儿童两款' : '基于当前设计 AI 推荐整套变体'"
    size="lg"
    :closable="!loading"
    @close="$emit('close')"
  >
    <div v-if="mode === 'derive'" class="count-row">
      <button v-for="n in counts" :key="n" :class="['count-btn', { active: count === n }]" @click="count = n">
        {{ n }} 款
      </button>
    </div>

    <div class="variant-grid">
      <template v-if="loading">
        <div v-for="i in (mode === 'family' ? 2 : count)" :key="i" class="variant-card skeleton">
          <div class="variant-thumb" />
          <div class="sk-line" />
        </div>
      </template>
      <template v-else>
        <button
          v-for="v in variants"
          :key="v.id"
          :class="['variant-card', { active: picked === v.id }]"
          @click="picked = v.id"
        >
          <div class="variant-thumb">
            <img v-if="v.cover" :src="v.cover" :alt="v.pattern" />
            <span v-else class="thumb-fallback">🧦</span>
          </div>
          <div class="variant-name">{{ v.pattern }}</div>
          <div class="variant-scheme">{{ v.scheme }}</div>
        </button>
      </template>
    </div>
    <p v-if="loading" class="loading-tip">AI 正在基于当前设计图创作并渲染预览…</p>
    <div v-if="error" class="error-box">
      <span>{{ error }}</span>
      <button type="button" @click="load">重试</button>
    </div>

    <template #footer>
      <button class="cta secondary" :disabled="loading" @click="$emit('close')">取消</button>
      <button v-if="mode === 'family'" class="cta primary" :disabled="loading || !variants.length" @click="$emit('saveAll', variants)">
        保存套装到我的设计
      </button>
      <button v-else class="cta primary" :disabled="loading || !picked" @click="apply">应用此款</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { aiApi } from '@/api'
import {
  DEFAULT_COLORS,
  DEFAULT_PARAMS,
  renderVectorSockToDataURL,
  STYLE_VARIANT_COUNTS,
  type DesignVariant,
  type SockColors,
  type SockParams,
  type ParsedGeometry,
} from '@/engine'

const props = defineProps<{
  mode: 'derive' | 'family'
  baseDesign: { printName: string; colors: SockColors; params: SockParams }
  referenceImage: string
  geometry: ParsedGeometry | null
}>()
const emit = defineEmits<{ close: []; apply: [v: DesignVariant]; saveAll: [vs: DesignVariant[]] }>()

const counts = STYLE_VARIANT_COUNTS
const count = ref(2)
const variants = ref<DesignVariant[]>([])
const picked = ref<string | null>(null)
const loading = ref(true)
const error = ref('')

const DERIVE_PROMPTS = [
  '在保持参考袜版整体气质和主色调的基础上，衍生一款新的袜身印花图案。输出可直接用于袜身印花的高清图案，不要文字、不要水印、不要袜子轮廓、不要边框。',
  '参考当前袜版设计，生成一款同系列但花纹构成不同的袜身印花图案。保留相近配色与风格，图案适合平铺到袜身，不要出现袜子模型、人物、文字。',
  '基于参考图做款式延展，生成更精致的袜身图案素材。要求主题一致、细节更丰富、适合织造印花，纯图案输出，不要产品场景。',
  '将参考袜版设计改造成同系列新款图案，强调可量产的袜身装饰纹样。只输出印花图案本身，不要袜子外形、背景、文字。',
]

const FAMILY_PROMPTS = [
  {
    tag: 'adult',
    scheme: '成人款',
    prompt: '基于参考袜版设计，生成亲子袜套装中的成人款袜身印花图案。保持当前设计的成熟质感和主色调，图案适合袜身印花，不要文字、水印、袜子轮廓或背景。',
  },
  {
    tag: 'kid',
    scheme: '儿童款',
    prompt: '基于参考袜版设计，生成亲子袜套装中的儿童款袜身印花图案。与成人款同系列，但更活泼柔和、元素更圆润可爱，适合儿童袜身印花，不要文字、水印、袜子轮廓或背景。',
  },
]

function baseColors(): SockColors {
  return { ...DEFAULT_COLORS, ...(props.baseDesign.colors || {}) }
}

function baseParams(): SockParams {
  return { ...DEFAULT_PARAMS, ...(props.baseDesign.params || {}) }
}

function paramsFor(index: number, tag?: string): SockParams {
  const base = baseParams()
  if (tag === 'kid') {
    return {
      ...base,
      density: Math.max(60, Math.round((base.density || 100) * 0.82)),
      singleMode: false,
      tileDensity: Math.max(4, base.tileDensity || 4),
    }
  }
  if (props.mode === 'derive') {
    return {
      ...base,
      rotation: [0, 12, -12, 24][index % 4],
      tileDensity: Math.max(2, (base.tileDensity || 3) + (index % 2)),
    }
  }
  return base
}

function colorsFor(tag?: string): SockColors {
  const colors = baseColors()
  if (tag === 'kid') {
    return {
      ...colors,
      bodyHex: colors.bodyHex || '#f6f1e7',
      weltHex: '#a4d4b9',
      heelHex: '#a4d4b9',
      toeHex: '#a4d4b9',
    }
  }
  return colors
}

async function createVariant(options: {
  id: string
  prompt: string
  label: string
  scheme: string
  pattern: string
  index?: number
  tag?: string
}): Promise<DesignVariant> {
  const res = await aiApi.remix([props.referenceImage], options.prompt)
  const printImage = res.data.result_urls?.[0]
  if (!printImage) throw new Error('AI 未返回生成图')
  const colors = colorsFor(options.tag)
  const params = paramsFor(options.index || 0, options.tag)
  const cover = props.geometry?.ready
    ? await renderVectorSockToDataURL(props.geometry, printImage, colors, params)
    : printImage
  return {
    id: options.id,
    label: options.label,
    scheme: options.scheme,
    pattern: options.pattern,
    printImage,
    printName: options.label,
    colors,
    params,
    cover,
    tag: options.tag,
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!props.referenceImage) throw new Error('当前设计图为空，请重新打开衍生功能')
    const baseName = props.baseDesign.printName || '当前设计'
    const res =
      props.mode === 'family'
        ? await Promise.all(
            FAMILY_PROMPTS.map((item, index) =>
              createVariant({
                id: item.tag,
                prompt: item.prompt,
                label: `${baseName} · ${item.scheme}`,
                scheme: item.scheme,
                pattern: `${baseName} ${item.scheme}`,
                index,
                tag: item.tag,
              }),
            ),
          )
        : await Promise.all(
            DERIVE_PROMPTS.slice(0, count.value).map((prompt, index) =>
              createVariant({
                id: `derive-${index + 1}`,
                prompt,
                label: `${baseName} · 衍生 ${index + 1}`,
                scheme: 'AI 图生图',
                pattern: `衍生 ${index + 1}`,
                index,
              }),
            ),
          )
    variants.value = res
    picked.value = res[0]?.id ?? null
  } catch (e) {
    variants.value = []
    picked.value = null
    error.value = e instanceof Error ? e.message : '生成失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
watch(count, load)
onMounted(load)

function apply() {
  const v = variants.value.find((x) => x.id === picked.value)
  if (v) emit('apply', v)
}
</script>

<style scoped>
.count-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.count-btn {
  flex: 1;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
}
.count-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.variant-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.variant-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: var(--bg-card);
  cursor: pointer;
}
.variant-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-soft);
}
.variant-thumb {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  overflow: hidden;
}
.variant-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.thumb-fallback {
  font-size: 40px;
}
.variant-card.skeleton .variant-thumb {
  background: var(--bg-hover);
  animation: pulse 1.2s ease-in-out infinite;
}
.sk-line {
  width: 60%;
  height: 12px;
  border-radius: 6px;
  background: var(--bg-hover);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
.variant-name {
  font-size: 13px;
  font-weight: 600;
}
.variant-scheme {
  font-size: 11px;
  color: var(--text-3);
}
.loading-tip {
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 14px;
}
.error-box {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(196, 90, 74, 0.08);
  color: #c45a4a;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.error-box button {
  padding: 6px 12px;
  border-radius: 999px;
  background: #c45a4a;
  color: #fff;
  font-size: 12px;
  border: none;
  cursor: pointer;
}
.cta {
  flex: 1;
  height: 44px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.cta.secondary {
  background: var(--bg-hover);
  color: var(--text-2);
}
.cta.primary {
  background: var(--primary);
  color: #fff;
}
.cta:disabled {
  opacity: 0.5;
}
</style>
