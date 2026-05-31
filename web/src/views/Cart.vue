<template>
  <div>
    <h1 class="page-title">购物车 / 订单</h1>
    <div v-if="orders.length === 0" class="empty card">
      <p>还没有订单，去设计一双吧</p>
      <button class="btn-primary" @click="$router.push({ name: 'Editor' })">开始设计</button>
    </div>
    <div v-else class="list">
      <div v-for="o in orders" :key="o.id" class="order card" @click="goDetail(o.id)">
        <div class="order-top">
          <span class="order-no">{{ o.order_no }}</span>
          <span class="order-status">{{ statusText(o.status) }}</span>
        </div>
        <div class="order-mid">
          <span class="order-name">{{ o.design_name || '袜款设计' }}</span>
          <span class="order-amount">¥{{ o.total_amount }}</span>
        </div>
        <div class="order-foot">
          <span class="order-qty">数量 {{ o.quantity }} · {{ o.created_at }}</span>
          <button v-if="o.status === 'pending'" class="pay-btn" :disabled="payingId === o.id" @click.stop="onPay(o)">
            {{ payingId === o.id ? '支付中…' : '去支付' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi, type Order } from '@/api'
import { payExistingOrder } from '@/composables/useOrderPay'

const router = useRouter()
const STATUS: Record<string, string> = {
  pending: '待支付', paid: '已支付', producing: '生产中', shipped: '已发货', done: '已完成', cancelled: '已取消',
}
const orders = ref<Order[]>([])
const payingId = ref<number | null>(null)

async function fetchList() {
  try {
    const res = await orderApi.list()
    orders.value = res.data
  } catch {
    /* 忽略 */
  }
}
onMounted(fetchList)

function goDetail(id: number) {
  router.push({ name: 'OrderDetail', params: { id } })
}

async function onPay(o: Order) {
  if (payingId.value) return
  payingId.value = o.id
  try {
    const r = await payExistingOrder(o.id, o.order_no)
    if (r.paid) {
      await fetchList()
    } else {
      alert('请在微信内完成支付')
    }
  } catch (e) {
    alert((e as Error).message || '支付失败，请重试')
  } finally {
    payingId.value = null
  }
}

const statusText = (s: string) => STATUS[s] || s
</script>

<style scoped>
.page-title {
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 20px;
}
.empty {
  padding: 60px;
  text-align: center;
  color: var(--text-2);
}
.empty p {
  margin-bottom: 16px;
}
.order {
  padding: 18px;
  margin-bottom: 14px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.order:hover {
  box-shadow: 0 6px 18px rgba(94, 60, 30, 0.1);
}
.order-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pay-btn {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 13px;
  padding: 6px 18px;
  cursor: pointer;
}
.pay-btn:disabled {
  opacity: 0.6;
}
.order-top {
  display: flex;
  justify-content: space-between;
}
.order-no {
  font-size: 12px;
  color: var(--text-3);
}
.order-status {
  font-size: 12px;
  color: var(--primary);
}
.order-mid {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 10px 0;
}
.order-name {
  font-size: 16px;
  font-weight: 700;
}
.order-amount {
  font-size: 18px;
  font-weight: 800;
  color: var(--pink);
}
.order-qty {
  font-size: 12px;
  color: var(--text-3);
}
</style>
