<template>
  <BottomSheet :title="title" :subtitle="subtitle" size="tall" :closable="!loading" @close="$emit('close')">
    <!-- 款式衍生：选数量 -->
    <view v-if="mode === 'derive'" class="count-row">
      <view v-for="n in [1, 2, 4]" :key="n" :class="['count-btn', { active: count === n }]" @tap="changeCount(n)">{{ n }} 款</view>
    </view>

    <view class="variant-grid">
      <template v-if="loading">
        <view v-for="i in (mode === 'family' ? 2 : count)" :key="i" class="variant-card skeleton">
          <view class="variant-thumb" />
          <view class="variant-line" />
        </view>
      </template>
      <template v-else>
        <view
          v-for="v in variants"
          :key="v.id"
          :class="['variant-card', { active: picked === v.id }]"
          @tap="picked = v.id"
        >
          <image v-if="v.cover" :src="v.cover" mode="aspectFit" class="variant-thumb" />
          <view v-else class="variant-thumb placeholder">🧦</view>
          <text class="variant-name">{{ v.pattern }}</text>
          <text class="variant-scheme">{{ v.scheme }}</text>
        </view>
      </template>
    </view>

    <view v-if="loading" class="loading-tip">AI 正在创作并渲染预览…</view>

    <template #footer>
      <view class="footer-row">
        <button class="cta secondary" :disabled="loading" @tap="$emit('close')">取消</button>
        <button v-if="mode === 'family'" class="cta primary" :disabled="loading" @tap="saveAll">保存套装</button>
        <button v-else class="cta primary" :disabled="loading || !picked" @tap="apply">应用此款</button>
      </view>
    </template>
  </BottomSheet>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'
import { deriveVariants, deriveFamily, type MiniVariant } from './variantGen'
import type { SockColors, SockParams } from './sockShape'

const props = defineProps<{
  mode: 'derive' | 'family'
  basePrompt: string
  baseDesign?: { patternId?: string | null; colors?: Partial<SockColors>; params?: Partial<SockParams> }
}>()
const emit = defineEmits<{ close: []; apply: [v: MiniVariant]; saveAll: [vs: MiniVariant[]] }>()

const count = ref(2)
const variants = ref<MiniVariant[]>([])
const picked = ref<string | null>(null)
const loading = ref(true)

const title = computed(() => (props.mode === 'family' ? '亲子袜' : '款式衍生'))
const subtitle = computed(() => (props.mode === 'family' ? '一键生成成人 + 儿童两款' : '基于当前设计 AI 推荐变体'))

async function load() {
  loading.value = true
  try {
    const base = { printName: props.basePrompt, ...props.baseDesign }
    const res = props.mode === 'family' ? await deriveFamily(base) : await deriveVariants(base, count.value)
    variants.value = res
    picked.value = res[0]?.id ?? null
  } finally {
    loading.value = false
  }
}

function changeCount(n: number) {
  count.value = n
}
watch(count, load)
onMounted(load)

function apply() {
  const v = variants.value.find((x) => x.id === picked.value)
  if (v) emit('apply', v)
}
function saveAll() {
  emit('saveAll', variants.value)
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.count-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.count-btn {
  flex: 1;
  text-align: center;
  line-height: 64rpx;
  border-radius: 12rpx;
  border: 1rpx solid $mp-border;
  font-size: 24rpx;
  color: $mp-text-secondary;
}
.count-btn.active {
  background: $mp-primary;
  color: #fff;
  border-color: $mp-primary;
}
.variant-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.variant-card {
  width: calc(50% - 8rpx);
  border: 1rpx solid $mp-border;
  border-radius: 16rpx;
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.variant-card.active {
  border-color: $mp-primary;
  box-shadow: 0 0 0 2rpx $mp-primary-soft;
}
.variant-thumb {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
  background: $mp-bg;
}
.variant-thumb.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
}
.variant-card.skeleton .variant-thumb {
  background: $mp-bg;
}
.variant-line {
  width: 60%;
  height: 20rpx;
  border-radius: 999rpx;
  background: $mp-bg;
}
.variant-name {
  font-size: 24rpx;
  font-weight: 600;
  color: $mp-text-primary;
  text-align: center;
}
.variant-scheme {
  font-size: 20rpx;
  color: $mp-text-muted;
}
.loading-tip {
  text-align: center;
  font-size: 22rpx;
  color: $mp-text-muted;
  margin-top: 16rpx;
}
.footer-row {
  display: flex;
  gap: 16rpx;
}
.cta {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  padding: 0;
}
.cta.secondary {
  background: $mp-bg;
  color: $mp-text-secondary;
}
.cta.primary {
  background: $mp-primary;
  color: #fff;
}
.cta.primary[disabled] {
  opacity: 0.5;
}
</style>
