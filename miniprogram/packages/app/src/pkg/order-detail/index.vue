<template>
  <view class="od" v-if="order">
    <!-- 待支付提示 -->
    <view v-if="isPending" class="pay-banner">
      <text class="pay-banner-text">订单待支付，完成支付后进入生产排期</text>
    </view>

    <!-- 状态进度 -->
    <view class="card steps">
      <view
        v-for="(label, i) in statusLabels"
        :key="label"
        :class="['step', { done: i < currentIdx, active: i === currentIdx }]"
      >
        <view class="step-dot">{{ stepIcon(label) }}</view>
        <text class="step-label">{{ label }}</text>
        <view v-if="i < statusLabels.length - 1" class="step-line" />
      </view>
    </view>

    <!-- 设计稿 -->
    <view class="card">
      <view class="card-title">设计稿</view>
      <view class="design-cover">
        <image v-if="order.cover_url" :src="order.cover_url" mode="aspectFill" class="design-img" />
        <view v-else class="design-empty">无预览图</view>
      </view>
      <view class="row"><text>设计名称</text><text>{{ order.design_name || '袜款设计' }}</text></view>
      <view class="row"><text>材质</text><text>{{ materialLabel }}</text></view>
      <view class="row"><text>工艺</text><text>{{ craftLabel }}</text></view>
    </view>

    <!-- 尺码分布 -->
    <view class="card" v-if="sizeEntries.length">
      <view class="card-title">尺码分布 · 共 {{ order.quantity }} 双</view>
      <view v-for="[s, qty] in sizeEntries" :key="s" class="dist-row">
        <text class="dist-size">{{ s }}</text>
        <view class="dist-bar"><view class="dist-fill" :style="{ width: percent(qty) + '%' }" /></view>
        <text class="dist-qty">{{ qty }} 双 · {{ percent(qty) }}%</text>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="card">
      <view class="row"><text>订单号</text><text>{{ order.order_no }}</text></view>
      <view class="row"><text>下单时间</text><text>{{ order.created_at }}</text></view>
      <view class="row" v-if="order.pay_method"><text>支付方式</text><text>{{ order.pay_method }}</text></view>
      <view class="row" v-if="order.address"><text>收货地址</text><text class="addr">{{ order.address }}</text></view>
      <view class="row total"><text>订单金额</text><text>¥{{ Number(order.total_amount).toFixed(2) }}</text></view>
    </view>

    <!-- 物流轨迹 -->
    <view class="card" v-if="shipment">
      <view class="card-title">物流 · {{ shipment.carrier || '—' }} {{ shipment.tracking_no || '' }}</view>
      <view v-for="(t, i) in (shipment.traces || [])" :key="i" class="trace-row">
        <view class="trace-dot" :class="{ first: i === 0 }" />
        <view class="trace-body">
          <text class="trace-desc">{{ t.desc }}</text>
          <text class="trace-time">{{ t.time.slice(0, 19).replace('T', ' ') }}</text>
        </view>
      </view>
    </view>

    <!-- 备注 + 地址（待付款/已付款可编辑） -->
    <view class="card">
      <view class="card-title">
        订单信息编辑
        <text v-if="canEdit" class="edit-btn" @tap="toggleEdit">{{ editing ? '保存' : '编辑' }}</text>
        <text v-else class="edit-locked">已进入生产，不可修改</text>
      </view>
      <template v-if="editing">
        <text class="field-label">收货地址</text>
        <textarea v-model="draftAddress" class="note-edit" placeholder="收货人 电话 详细地址" />
        <text class="field-label">备注</text>
        <textarea v-model="draftNote" class="note-edit" placeholder="包装要求、加急说明、修改建议等" />
      </template>
      <template v-else>
        <view class="row"><text>收货地址</text><text class="addr" :class="{ muted: !order.address }">{{ order.address || '暂无' }}</text></view>
        <view class="row"><text>备注</text><text :class="{ muted: !order.remark }">{{ order.remark || '暂无' }}</text></view>
      </template>
    </view>

    <!-- 订单附件（补传设计稿 / 图片 / 文件） -->
    <view class="card">
      <OrderAttachments :order-id="order.id" :editable="canEdit" />
    </view>

    <!-- 操作 -->
    <view class="footer">
      <button v-if="isPending" class="cta secondary" :disabled="cancelling" @tap="onCancel">{{ cancelling ? '取消中…' : '取消订单' }}</button>
      <button v-else class="cta secondary" @tap="onContactSupport">联系客服</button>
      <button v-if="isPending" class="cta primary" :disabled="paying" @tap="onPay">{{ paying ? '支付中…' : '去支付' }}</button>
      <button v-else class="cta primary" @tap="goBack">返回列表</button>
    </view>
  </view>

  <view v-else class="empty">
    <text>订单不存在</text>
    <button class="cta primary" @tap="goBack">返回列表</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { orderApi } from '@aisock/service'
import { navigateBack } from '@aisock/common/utils'
import { SUPPORT_PHONE } from '@aisock/common/constants'
import { MATERIALS, CRAFTS } from '@aisock/common'
import type { Order } from '@aisock/common/types'
import OrderAttachments from '@/components/order/OrderAttachments.vue'
import { payOrderById, pollOrderPaid } from '@/composables/usePayment'

const statusFlow = ['paid', 'producing', 'shipped', 'done']
const statusText: Record<string, string> = { paid: '待生产', producing: '生产中', shipped: '已发货', done: '已完成' }
const statusLabels = statusFlow.map((s) => statusText[s])

const order = ref<(Order & { material?: string; craft?: string; address?: string; remark?: string; pay_method?: string; cover_url?: string; sizes?: Record<string, number> }) | null>(null)
const shipment = ref<{ carrier: string | null; tracking_no: string | null; traces: Array<{ time: string; desc: string }> | null } | null>(null)
const editing = ref(false)
const draftNote = ref('')
const draftAddress = ref('')
const paying = ref(false)
const cancelling = ref(false)

// 落库的是枚举 key（cotton/uv 等），展示时映射为用户文案
const materialLabel = computed(() => {
  const v = order.value?.material
  return MATERIALS.find((m) => m.value === v)?.label || v || '棉'
})
const craftLabel = computed(() => {
  const v = order.value?.craft
  return CRAFTS.find((c) => c.value === v)?.label || v || 'UV 印花'
})

// 待支付（未进入生产流程）：步骤条不点亮任一节点，单独引导支付
const isPending = computed(() => order.value?.status === 'pending')
const currentIdx = computed(() => statusFlow.indexOf(order.value?.status || ''))
const sizeEntries = computed(() => Object.entries(order.value?.sizes || {}))
// 仅待付款 / 已付款（未进入生产）可编辑备注、地址与附件
const canEdit = computed(() => ['pending', 'paid'].includes(order.value?.status || ''))

async function reload() {
  if (!order.value) return
  const res = await orderApi.getOrder(order.value.id)
  order.value = res.data as typeof order.value
}

onLoad(async (q) => {
  const id = Number((q as { id?: string }).id)
  if (!id) return
  try {
    const res = await orderApi.getOrder(id)
    order.value = res.data as typeof order.value
    const sh = await orderApi.getShipment(id)
    shipment.value = sh.data
  } catch {
    /* 忽略 */
  }
})

/** 待支付订单去支付（与订单列表一致：真实预下单 → 微信支付 / 演示落库） */
async function onPay() {
  if (!order.value || paying.value) return
  paying.value = true
  try {
    const result = await payOrderById(order.value.id, order.value.order_no)
    if (!result.paid) {
      uni.showToast({ title: '支付未完成', icon: 'none' })
      return
    }
    if (result.real) {
      uni.showLoading({ title: '确认支付结果…' })
      const ok = await pollOrderPaid(order.value.id)
      uni.hideLoading()
      uni.showToast({ title: ok ? '支付成功' : '支付处理中，请稍后刷新', icon: 'none' })
    } else {
      uni.showToast({ title: '支付成功', icon: 'success' })
    }
    await reload()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '支付失败，请重试', icon: 'none' })
  } finally {
    paying.value = false
  }
}

/** 取消订单（仅待付款）：确认后调服务端，状态机校验本人 + pending */
async function onCancel() {
  if (!order.value || cancelling.value) return
  const r = await uni.showModal({ title: '取消订单', content: '确定取消该订单吗？取消后不可恢复。' })
  if (!r.confirm) return
  cancelling.value = true
  try {
    await orderApi.cancelOrder(order.value.id)
    uni.showToast({ title: '订单已取消', icon: 'none' })
    await reload()
  } catch {
    /* 拦截器已提示 */
  } finally {
    cancelling.value = false
  }
}

function stepIcon(label: string) {
  return { 待生产: '⏱', 生产中: '📦', 已发货: '🚚', 已完成: '✓' }[label] || '•'
}
function percent(qty: number) {
  const total = order.value?.quantity || 0
  return total ? Math.round((qty / total) * 100) : 0
}
async function toggleEdit() {
  if (!order.value) return
  if (editing.value) {
    try {
      await orderApi.updateOrder(order.value.id, { remark: draftNote.value, address: draftAddress.value })
      order.value.remark = draftNote.value
      order.value.address = draftAddress.value
      editing.value = false
      uni.showToast({ title: '已保存', icon: 'none' })
    } catch {
      /* 拦截器已提示（如已进入生产） */
    }
  } else {
    draftNote.value = order.value.remark || ''
    draftAddress.value = order.value.address || ''
    editing.value = true
  }
}
function goBack() {
  navigateBack()
}

/** 联系客服：复制客服电话并提示拨打 */
function onContactSupport() {
  uni.showModal({
    title: '联系客服',
    content: `客服电话：${SUPPORT_PHONE}`,
    confirmText: '拨打',
    success: (r) => {
      if (r.confirm) uni.makePhoneCall({ phoneNumber: SUPPORT_PHONE, fail: () => {} })
    },
  })
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.od {
  min-height: 100vh;
  padding: 24rpx 32rpx 40rpx;
}
.pay-banner {
  background: $mp-primary-soft;
  border: 1rpx solid $mp-primary;
  border-radius: 16rpx;
  padding: 18rpx 24rpx;
  margin-bottom: 20rpx;
}
.pay-banner-text {
  font-size: 24rpx;
  color: $mp-primary-deep;
  font-weight: 600;
}
.card {
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.card-title {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  font-weight: 700;
  color: $mp-text-primary;
  margin-bottom: 16rpx;
}
.edit-btn {
  margin-left: auto;
  font-size: 22rpx;
  color: $mp-primary;
}
.edit-locked {
  margin-left: auto;
  font-size: 20rpx;
  color: $mp-text-muted;
}
.field-label {
  display: block;
  font-size: 22rpx;
  color: $mp-text-muted;
  margin: 12rpx 0 8rpx;
}
.steps {
  display: flex;
  justify-content: space-between;
  position: relative;
}
.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  position: relative;
}
.step-dot {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: $mp-bg;
  border: 1rpx solid $mp-border;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  color: $mp-text-muted;
  z-index: 1;
}
.step.done .step-dot,
.step.active .step-dot {
  background: $mp-primary;
  color: #fff;
  border-color: $mp-primary;
}
.step-label {
  font-size: 20rpx;
  color: $mp-text-muted;
}
.step.active .step-label {
  color: $mp-primary;
  font-weight: 600;
}
.step-line {
  position: absolute;
  top: 24rpx;
  left: 60%;
  width: 80%;
  height: 2rpx;
  background: $mp-border;
  z-index: 0;
}
.step.done .step-line {
  background: $mp-primary;
}
.design-cover {
  width: 100%;
  height: 320rpx;
  border-radius: 14rpx;
  overflow: hidden;
  background: $mp-bg;
  margin-bottom: 16rpx;
}
.design-img {
  width: 100%;
  height: 100%;
}
.design-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $mp-text-muted;
  font-size: 24rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
  color: $mp-text-secondary;
  padding: 10rpx 0;
}
.row text:first-child {
  color: $mp-text-muted;
}
.row .addr {
  max-width: 60%;
  text-align: right;
}
.row.total text:last-child {
  color: $mp-pink;
  font-weight: 700;
  font-size: 30rpx;
}
.muted {
  color: $mp-text-tertiary;
}
.trace-row {
  display: flex;
  gap: 16rpx;
  padding: 8rpx 0;
}
.trace-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: $mp-border;
  margin-top: 8rpx;
  flex-shrink: 0;
}
.trace-dot.first {
  background: $mp-primary;
}
.trace-body {
  flex: 1;
}
.trace-desc {
  font-size: 24rpx;
  color: $mp-text-primary;
}
.trace-time {
  display: block;
  font-size: 20rpx;
  color: $mp-text-muted;
  margin-top: 4rpx;
}
.dist-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.dist-size {
  width: 50rpx;
  font-size: 24rpx;
  color: $mp-text-primary;
}
.dist-bar {
  flex: 1;
  height: 14rpx;
  border-radius: 999rpx;
  background: $mp-bg;
  overflow: hidden;
}
.dist-fill {
  height: 100%;
  background: $mp-primary;
}
.dist-qty {
  font-size: 20rpx;
  color: $mp-text-muted;
  width: 150rpx;
  text-align: right;
}
.note-edit {
  width: 100%;
  height: 140rpx;
  background: $mp-bg;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 24rpx;
  box-sizing: border-box;
}
.footer {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}
.cta {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  padding: 0;
}
.cta.secondary {
  background: $mp-bg-card;
  color: $mp-text-secondary;
  border: 1rpx solid $mp-border;
}
.cta.primary {
  background: $mp-primary;
  color: #fff;
}
.empty {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  font-size: 26rpx;
  color: $mp-text-secondary;
}
</style>
