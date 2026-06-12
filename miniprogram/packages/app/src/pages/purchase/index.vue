<template>
  <view class="purchase">
    <!-- 纯棕标题栏 -->
    <NavBar title="定制袜版" show-back variant="solid" />

    <scroll-view class="ph-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
      <view class="ph-body">
        <!-- 商品概要 -->
        <view class="card summary">
          <view class="sock-thumb" :style="{ background: heroBg }">
            <image v-if="cover" class="thumb-img" :src="cover" mode="aspectFill" />
          </view>
          <view class="summary-info">
            <view class="price-row">
              <text class="price-cur">¥</text>
              <text class="price-num">{{ displayPrice }}</text>
            </view>
            <view class="tag-row">
              <text class="mini-tag">定制不退换</text>
              <text class="mini-tag">包邮</text>
            </view>
            <view class="stepper">
              <view class="step-btn" @tap="changeQty(-1)"><AppIcon name="minus" :size="28" color="#8e4f43" /></view>
              <text class="step-val">{{ quantity }}</text>
              <view class="step-btn" @tap="changeQty(1)"><AppIcon name="plus" :size="28" color="#8e4f43" /></view>
            </view>
          </view>
        </view>

        <!-- 已选信息 -->
        <view class="card">
          <text class="card-title">已选信息</text>
          <view class="info-box">
            <view class="info-lines">
              <text class="info-line">版型 : {{ sockTypeName }}</text>
              <text class="info-line">材质 : 精梳棉（75%棉 23%锦纶 2%氨纶）</text>
            </view>
          </view>
        </view>

        <!-- 选择工艺 -->
        <view class="card">
          <text class="card-title">选择工艺</text>
          <view class="chip-wrap">
            <view
              v-for="c in craftChips"
              :key="c.label"
              :class="['pill', { active: craftLabel === c.label }]"
              @tap="selectCraft(c)"
            >{{ c.label }}</view>
          </view>
        </view>

        <!-- 选择鞋码 -->
        <view class="card">
          <text class="card-title">选择鞋码</text>
          <view class="chip-wrap">
            <view
              v-for="s in shoeSizes"
              :key="s"
              :class="['pill', { active: size === s }]"
              @tap="size = s"
            >{{ s }}</view>
          </view>
        </view>

        <!-- 阶梯价 -->
        <view class="card">
          <view class="card-title-row">
            <text class="card-title">阶梯价</text>
            <text class="card-sub">数量越多，单价越低</text>
          </view>
          <view class="tier">
            <view class="tier-head">
              <text class="tier-c1">数量区间</text>
              <text class="tier-c2">单价（元/双）</text>
            </view>
            <view
              v-for="(t, i) in tiers"
              :key="i"
              :class="['tier-row', { hit: t.hit }]"
            >
              <text class="tier-c1">{{ t.range }}</text>
              <text class="tier-c2">¥{{ t.price }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作 -->
    <view class="action-bar">
      <view class="act-btn ghost" @tap="onAddCart">加入购物车</view>
      <view class="act-btn solid" @tap="onNext">下一步</view>
    </view>

    <PaymentSheet
      v-if="payOpen"
      :order="orderForm"
      @cancel="payOpen = false"
      @paid="onPaid"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { navigateTo, switchTab } from '@aisock/common/utils'
import { MATERIALS } from '@aisock/common'
import { useUserStore } from '@aisock/composition'
import { orderApi, designApi } from '@aisock/service'
import { toRegions } from '@/components/editor/designSnapshot'
import NavBar from '@/components/ui/NavBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PaymentSheet from '@/components/editor/PaymentSheet.vue'

const userStore = useUserStore()

const materials = MATERIALS
const shoeSizes = ['12-18', '19-26', '27-34', '35-42']

// 工艺 chips：按 Figma 文案展示，value 映射到后端工艺（定价以服务端为准）
interface CraftChip { label: string; value: string }
const craftChips: CraftChip[] = [
  { label: '喷墨', value: 'uv' },
  { label: '印花', value: 'uv' },
  { label: '绣花', value: 'jacquard' },
  { label: '点胶', value: '3d' },
  { label: '针织提花', value: 'jacquard' },
]
const craftLabel = ref('喷墨')

const designName = ref('定制袜版')
const designId = ref<number | undefined>(undefined)
const cover = ref<string | null>('/static/images/purchase-sock.jpg')
const heroBg = 'linear-gradient(160deg,#d8c4a6 0%,#a4675a 100%)'

const quantity = ref(1)
const craft = ref('uv')
const material = ref(MATERIALS[0].value)
const size = ref(shoeSizes[1])
const sockTypeName = ref('中筒袜')

const activeMaterial = computed(() => materials.find((m) => m.value === material.value) || materials[0])

// 阶梯价（展示用，与 Figma 一致；命中行高亮）
const TIERS = [
  { min: 1, max: 9, price: 998, range: '1 – 9' },
  { min: 10, max: 49, price: 768, range: '10 – 49' },
  { min: 50, max: Infinity, price: 598, range: '≥ 50' },
]
const tiers = computed(() =>
  TIERS.map((t) => ({ ...t, hit: quantity.value >= t.min && quantity.value <= t.max })),
)
const displayPrice = computed(() => {
  const t = TIERS.find((x) => quantity.value >= x.min && quantity.value <= x.max) || TIERS[0]
  return t.price
})

const payOpen = ref(false)
const orderForm = computed(() => ({
  designName: designName.value,
  total: quantity.value,
  sizes: { [size.value]: quantity.value } as Record<string, number>,
  material: activeMaterial.value.label,
  materialValue: material.value,
  craft: craftLabel.value,
  craftValue: craft.value,
  address: '',
  note: `鞋码 ${size.value}`,
  designId: designId.value,
}))

onLoad((q?: Record<string, string>) => {
  if (q?.designId) designId.value = Number(q.designId)
  if (q?.name) designName.value = decodeURIComponent(q.name)
  if (q?.cover) cover.value = decodeURIComponent(q.cover)
})

function changeQty(d: number) {
  quantity.value = Math.max(1, quantity.value + d)
}

function selectCraft(c: { label: string; value: string }) {
  craftLabel.value = c.label
  craft.value = c.value
}

function ensureLogin(): boolean {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => switchTab('/pages/mine/index'), 600)
    return false
  }
  return true
}

/** 是否为可用作设计封面的真实远程图（上传得到的 http URL） */
function isRemoteCover(): boolean {
  return !!cover.value && /^https?:/i.test(cover.value)
}

/**
 * 确保有可下单的 designId：
 * - 已带 designId（编辑器/我的设计进入）→ 直接用
 * - 带真实上传图 → 据此建一个设计，拿到 designId（让「上传→购买」闭环可成单）
 * - 否则返回 null（交由 guideCustomize 引导先定制，避免无设计成单失败）
 */
async function ensureDesignId(): Promise<number | null> {
  if (designId.value) return designId.value
  if (!isRemoteCover()) return null
  try {
    const res = await designApi.createDesign({
      name: designName.value,
      coverUrl: cover.value as string,
      regions: toRegions({
        sockTypeId: 'crew',
        patternId: null,
        printImage: cover.value,
        printName: designName.value,
        params: { density: 100, rotation: 0, singleMode: true, tileDensity: 3 },
        colors: { bodyHex: null, weltHex: null, heelHex: null, toeHex: null },
        paletteId: null,
      }),
    })
    designId.value = res.data.id
    return designId.value
  } catch {
    return null
  }
}

/** 无设计时引导用户先去定制（避免无设计下单失败） */
function guideCustomize() {
  uni.showModal({
    title: '先定制袜版',
    content: '下单前需要先定制你的专属袜版，是否现在去定制？',
    confirmText: '去定制',
    cancelText: '再看看',
    success: (r) => {
      if (!r.confirm) return
      if (isRemoteCover()) uni.setStorageSync('aisock_upload_image', cover.value)
      navigateTo('/pages/upload/index')
    },
  })
}

async function onAddCart() {
  if (!ensureLogin()) return
  const did = await ensureDesignId()
  if (!did) {
    guideCustomize()
    return
  }
  try {
    await orderApi.createOrder({
      designId: did,
      designName: designName.value,
      sizes: orderForm.value.sizes,
      quantity: quantity.value,
      material: material.value,
      craft: craft.value,
      remark: orderForm.value.note,
    })
    uni.showToast({ title: '已加入购物车', icon: 'success' })
    setTimeout(() => switchTab('/pages/cart/index'), 800)
  } catch {
    /* 拦截器已提示 */
  }
}

async function onNext() {
  if (!ensureLogin()) return
  const did = await ensureDesignId()
  if (!did) {
    guideCustomize()
    return
  }
  payOpen.value = true
}

function onPaid() {
  payOpen.value = false
  uni.showToast({ title: '支付成功', icon: 'success' })
  setTimeout(() => navigateTo('/pages/orders/index'), 800)
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.purchase {
  height: 100vh;
  background: $mp-bg;
  display: flex;
  flex-direction: column;
}
.ph-hero {
  position: relative;
}
.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(43, 31, 20, 0.25), transparent);
}
.ph-scroll {
  flex: 1;
  min-height: 0;
}
.ph-body {
  padding: 24rpx 32rpx calc(160rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.card {
  background: $mp-bg-card;
  border-radius: $mp-radius-lg;
  padding: 28rpx;
  box-shadow: $mp-shadow-sm;
}
.card-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $mp-text-primary;
  font-family: $mp-font-serif;
}
.card-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.card-sub {
  font-size: 20rpx;
  color: $mp-text-muted;
}

/* 概要 */
.summary {
  display: flex;
  gap: 24rpx;
}
.sock-thumb {
  width: 168rpx;
  height: 184rpx;
  border-radius: $mp-radius-md;
  overflow: hidden;
  flex-shrink: 0;
}
.thumb-img {
  width: 100%;
  height: 100%;
}
.summary-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.price-row {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  color: $mp-price;
  font-family: $mp-font-serif;
}
.price-cur {
  font-size: 28rpx;
  font-weight: 700;
}
.price-num {
  font-size: 52rpx;
  font-weight: 600;
}
.tag-row {
  display: flex;
  gap: 12rpx;
  margin: 12rpx 0;
}
.mini-tag {
  font-size: 20rpx;
  color: #9c7a4a;
  background: $mp-bg-tint;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
}
.stepper {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  border: 1rpx solid $mp-border;
  border-radius: $mp-radius-xs;
  overflow: hidden;
}
.step-btn {
  width: 60rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-val {
  min-width: 64rpx;
  text-align: center;
  font-size: 28rpx;
  color: $mp-primary;
  border-left: 1rpx solid $mp-border;
  border-right: 1rpx solid $mp-border;
  line-height: 56rpx;
}

/* 已选信息 */
.info-box {
  margin-top: 16rpx;
  background: $mp-bg;
  border-radius: $mp-radius-md;
  padding: 24rpx;
}
.info-line {
  display: block;
  font-size: 24rpx;
  color: $mp-text-strong;
  line-height: 1.9;
}

/* chips */
.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
}
.pill {
  padding: 12rpx 32rpx;
  border-radius: $mp-radius-pill;
  background: $mp-bg;
  color: #525252;
  font-size: 24rpx;
  font-family: $mp-font-serif;
}
.pill.active {
  background: $mp-primary;
  color: #fff;
}

/* 阶梯价 */
.tier {
  margin-top: 20rpx;
  border: 1rpx solid $mp-divider;
  border-radius: $mp-radius-md;
  overflow: hidden;
}
.tier-head,
.tier-row {
  display: flex;
  padding: 18rpx 24rpx;
}
.tier-head {
  background: #ede6d7;
}
.tier-row {
  border-top: 1rpx solid $mp-divider;
}
.tier-row.hit {
  background: $mp-primary-soft;
}
.tier-c1 {
  flex: 1;
  font-size: 24rpx;
  color: #404040;
}
.tier-c2 {
  font-size: 24rpx;
  color: $mp-primary-deep;
  font-weight: 700;
  text-align: right;
}
.tier-head .tier-c1,
.tier-head .tier-c2 {
  color: #525252;
  font-weight: 500;
}

/* 底部操作 */
.action-bar {
  display: flex;
  gap: 24rpx;
  padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background: $mp-bg-card;
  box-shadow: 0 -2rpx 24rpx rgba(94, 60, 30, 0.06);
}
.act-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 48rpx;
  font-size: 28rpx;
  font-weight: 700;
  font-family: $mp-font-serif;
}
.act-btn.ghost {
  color: $mp-gold;
  border: 2rpx solid $mp-gold;
}
.act-btn.solid {
  background: $mp-primary-deep;
  color: $mp-bg;
}
</style>
