<template>
  <view class="orders">
    <NavBar title="订单管理" show-back variant="solid" />
    <scroll-view class="orders-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
    <view class="tabs">
      <text
        v-for="t in statusTabs"
        :key="t.key"
        :class="['tab', { active: activeStatus === t.key }]"
        @tap="onSwitch(t.key)"
      >
        {{ t.label }}
      </text>
    </view>

    <view v-if="list.length === 0" class="empty">
      <view class="empty-icon"><AppIcon name="bag" :size="72" color="#c8b89a" /></view>
      <text class="empty-text">暂无订单</text>
    </view>
    <view v-else class="list">
      <view v-for="o in list" :key="o.id" class="order-card" @tap="goDetail(o.id)">
        <view class="order-top">
          <text class="order-no">{{ o.order_no }}</text>
          <text class="order-status">{{ statusText(o.status) }}</text>
        </view>
        <view class="order-mid">
          <text class="order-name">{{ o.design_name || '袜款设计' }}</text>
          <text class="order-amount">¥{{ o.total_amount }}</text>
        </view>
        <view class="order-foot">
          <text class="order-qty">数量 {{ o.quantity }}</text>
          <view v-if="o.status === 'pending'" class="foot-btns">
            <button class="cancel-btn" :disabled="cancelling === o.id" @tap.stop="onCancel(o)">
              {{ cancelling === o.id ? '取消中…' : '取消' }}
            </button>
            <button class="pay-btn" :disabled="paying === o.id" @tap.stop="onPay(o)">
              {{ paying === o.id ? '支付中…' : '去支付' }}
            </button>
          </view>
        </view>
      </view>
    </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { orderApi } from '@aisock/service'
import { ORDER_STATUS_TEXT } from '@aisock/common/constants'
import type { Order } from '@aisock/common/types'
import { payOrderById, pollOrderPaid } from '@/composables/usePayment'
import NavBar from '@/components/ui/NavBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const statusTabs = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'paid', label: '待生产' },
  { key: 'producing', label: '生产中' },
  { key: 'shipped', label: '已发货' },
  { key: 'done', label: '已完成' },
]

const activeStatus = ref('')
const list = ref<Order[]>([])
const paying = ref<number | null>(null)
const cancelling = ref<number | null>(null)

async function fetchList() {
  try {
    const res = await orderApi.listOrders(activeStatus.value || undefined)
    list.value = res.data
  } catch {
    /* 忽略 */
  }
}

onShow(fetchList)

function onSwitch(key: string) {
  activeStatus.value = key
  fetchList()
}

/** 待支付订单走真实预下单 → 微信支付 / 演示落库（不再直接标记已付） */
async function onPay(o: Order) {
  if (paying.value) return
  paying.value = o.id
  try {
    const result = await payOrderById(o.id, o.order_no)
    if (!result.paid) {
      uni.showToast({ title: '支付未完成', icon: 'none' })
      return
    }
    if (result.real) {
      // 真实支付由微信异步回调落库，轮询确认最终状态
      uni.showLoading({ title: '确认支付结果…' })
      const ok = await pollOrderPaid(o.id)
      uni.hideLoading()
      uni.showToast({ title: ok ? '支付成功' : '支付处理中，请稍后刷新', icon: 'none' })
    } else {
      uni.showToast({ title: '支付成功', icon: 'success' })
    }
    fetchList()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '支付失败，请重试', icon: 'none' })
  } finally {
    paying.value = null
  }
}

const statusText = (s: string) => ORDER_STATUS_TEXT[s] || s

/** 取消待支付订单 */
async function onCancel(o: Order) {
  if (cancelling.value) return
  const r = await uni.showModal({ title: '取消订单', content: '确定取消该订单吗？取消后不可恢复。' })
  if (!r.confirm) return
  cancelling.value = o.id
  try {
    await orderApi.cancelOrder(o.id)
    uni.showToast({ title: '订单已取消', icon: 'none' })
    fetchList()
  } catch {
    /* 拦截器已提示 */
  } finally {
    cancelling.value = null
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pkg/order-detail/index?id=${id}` })
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.orders {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.orders-scroll {
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  padding: 24rpx 32rpx;
}
.tabs {
  display: flex;
  gap: 10rpx;
  margin-bottom: 24rpx;
}
.tab {
  flex: 1;
  text-align: center;
  white-space: nowrap;
  padding: 14rpx 0;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: $mp-text-secondary;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
}
.tab.active {
  background: $mp-primary;
  color: #fff;
  border-color: $mp-primary;
}
.empty {
  margin-top: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.empty-icon {
  font-size: 80rpx;
}
.empty-text {
  font-size: 26rpx;
  color: $mp-text-muted;
}
.order-card {
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.order-top {
  display: flex;
  justify-content: space-between;
}
.order-no {
  font-size: 22rpx;
  color: $mp-text-muted;
}
.order-status {
  font-size: 22rpx;
  color: $mp-primary;
}
.order-mid {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 12rpx 0;
}
.order-name {
  font-size: 28rpx;
  font-weight: 700;
  color: $mp-text-primary;
}
.order-amount {
  font-size: 30rpx;
  font-weight: 800;
  color: $mp-pink;
}
.order-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-qty {
  font-size: 22rpx;
  color: $mp-text-muted;
}
.foot-btns {
  display: flex;
  gap: 12rpx;
}
.cancel-btn {
  background: $mp-bg-card;
  color: $mp-text-secondary;
  border: 1rpx solid $mp-border;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 54rpx;
  height: 56rpx;
  padding: 0 28rpx;
}
.cancel-btn[disabled] {
  opacity: 0.6;
}
.pay-btn {
  background: $mp-primary;
  color: #fff;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 56rpx;
  height: 56rpx;
  padding: 0 32rpx;
}
.pay-btn[disabled] {
  opacity: 0.6;
}
</style>
