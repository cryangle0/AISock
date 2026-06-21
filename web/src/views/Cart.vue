<template>
  <div class="cart-page">
    <h1 class="page-title">购物车 / 订单</h1>
    <div v-if="loading" class="list">
      <div v-for="n in 3" :key="'sk' + n" class="order-skel" />
    </div>
    <div v-else-if="orders.length === 0" class="empty-card">
      <p>还没有订单，去设计一双吧</p>
      <button class="btn-primary" @click="$router.push({ name: 'Editor' })">开始设计</button>
    </div>
    <div v-else class="list">
      <div v-for="o in orders" :key="o.id" class="order-card" @click="goDetail(o.id)">
        <div class="oc-top">
          <span class="oc-no">{{ o.order_no }}</span>
          <span class="oc-status">{{ statusText(o.status) }}</span>
        </div>
        <div class="oc-mid">
          <span class="oc-name">{{ o.design_name || '袜款设计' }}</span>
          <span class="oc-amount num">¥{{ o.total_amount }}</span>
        </div>
        <div class="oc-foot">
          <span class="oc-qty">数量 {{ o.quantity }} · {{ o.created_at }}</span>
          <button v-if="o.status === 'pending'" class="pay-btn" @click.stop="openPay(o)">
            去支付
          </button>
        </div>
      </div>
    </div>

    <!-- 继续支付 -->
    <PaymentModal
      v-if="payOrder"
      :existing-order="{ id: payOrder.id, orderNo: payOrder.order_no, amount: Number(payOrder.total_amount), designName: payOrder.design_name || undefined }"
      @cancel="payOrder = null"
      @paid="onPaid"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi, type Order } from '@/api'
import PaymentModal from '@/components/order/PaymentModal.vue'

const router = useRouter()
const STATUS: Record<string, string> = {
  pending: '待支付', paid: '已支付', producing: '生产中', shipped: '已发货', done: '已完成', cancelled: '已取消',
}
const orders = ref<Order[]>([])
const payOrder = ref<Order | null>(null)
const loading = ref(true)

async function fetchList() {
  try {
    const res = await orderApi.list()
    orders.value = res.data
  } catch { /* 忽略 */ } finally {
    loading.value = false
  }
}
onMounted(fetchList)

function goDetail(id: number) {
  router.push({ name: 'OrderDetail', params: { id } })
}

function openPay(o: Order) {
  payOrder.value = o
}

async function onPaid() {
  payOrder.value = null
  await fetchList()
}

const statusText = (s: string) => STATUS[s] || s
</script>

<style scoped>
.cart-page { padding: 24px; }
.page-title { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 16px; }
.empty-card {
  background: var(--bg-card); border-radius: var(--r-card); box-shadow: var(--shadow-card);
  padding: 60px; text-align: center; color: var(--text-2);
}
.empty-card p { margin-bottom: 16px; }
.list { display: flex; flex-direction: column; gap: 12px; }
.order-skel {
  height: 96px; border-radius: var(--r-card);
  background: linear-gradient(100deg, var(--surface-2) 30%, var(--bg-hover) 50%, var(--surface-2) 70%);
  background-size: 280% 100%; animation: cart-sh 1.3s linear infinite;
}
@keyframes cart-sh { 0% { background-position: 180% 0; } 100% { background-position: -80% 0; } }
.order-card {
  background: var(--bg-card); border-radius: var(--r-card); box-shadow: var(--shadow-card);
  padding: 18px; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
}
.order-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.oc-top { display: flex; justify-content: space-between; }
.oc-no { font-size: 12px; color: var(--text-3); }
.oc-status { font-size: 12px; font-weight: 600; color: var(--primary); }
.oc-mid { display: flex; justify-content: space-between; align-items: baseline; margin: 10px 0; }
.oc-name { font-size: 16px; font-weight: 700; color: var(--text); }
.oc-amount { font-size: 18px; font-weight: 800; color: var(--ink); }
.oc-foot { display: flex; justify-content: space-between; align-items: center; }
.oc-qty { font-size: 12px; color: var(--text-3); }
.pay-btn {
  background: var(--primary); color: #fff; border-radius: 999px;
  font-size: 13px; font-weight: 600; padding: 7px 18px;
  transition: background 0.16s;
}
.pay-btn:hover { background: var(--primary-hover); }
.pay-btn:disabled { opacity: 0.6; }
</style>
