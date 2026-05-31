<template>
  <div class="od" v-if="order">
    <button class="back" @click="$router.back()">‹ 返回订单列表</button>

    <!-- 状态进度 -->
    <div class="card status-card">
      <div class="status-head">
        <span class="status-name">{{ statusText(order.status) }}</span>
        <span class="order-no">{{ order.order_no }}</span>
      </div>
      <div v-if="order.status !== 'cancelled'" class="flow">
        <div
          v-for="(s, i) in flowSteps"
          :key="s.key"
          :class="['flow-step', { done: i <= currentIdx }]"
        >
          <span class="flow-dot">{{ i <= currentIdx ? '✓' : i + 1 }}</span>
          <span class="flow-label">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- 订单信息 -->
    <div class="card">
      <div class="sec-head">
        <h3 class="sec-title">订单信息</h3>
        <button v-if="canEdit" class="edit-btn" @click="toggleEdit">{{ editing ? '保存' : '编辑' }}</button>
        <span v-else-if="isLocked" class="edit-locked">已进入生产，不可修改</span>
      </div>
      <div class="row"><span>设计名称</span><b>{{ order.design_name || '袜款设计' }}</b></div>
      <div class="row"><span>数量</span><b>{{ order.quantity }} 双</b></div>
      <div class="row"><span>金额</span><b class="amt">¥{{ order.total_amount }}</b></div>
      <div class="row"><span>材质 / 工艺</span><b>{{ order.material || '-' }} / {{ order.craft || '-' }}</b></div>
      <div v-if="sizeText" class="row"><span>尺码分布</span><b>{{ sizeText }}</b></div>

      <template v-if="editing">
        <label class="edit-field">
          <span>收货信息</span>
          <textarea v-model="draftAddress" rows="2" placeholder="收货人 电话 详细地址" />
        </label>
        <label class="edit-field">
          <span>备注</span>
          <textarea v-model="draftRemark" rows="2" placeholder="包装要求、加急说明、修改建议等" />
        </label>
      </template>
      <template v-else>
        <div class="row"><span>收货信息</span><b>{{ order.address || '-' }}</b></div>
        <div class="row"><span>备注</span><b>{{ order.remark || '-' }}</b></div>
      </template>

      <div class="row"><span>下单时间</span><b>{{ order.created_at }}</b></div>
      <div v-if="order.paid_at" class="row"><span>支付时间</span><b>{{ order.paid_at }}</b></div>
    </div>

    <!-- 订单附件 -->
    <div class="card">
      <OrderAttachments :order-id="order.id" :editable="canEdit" @toast="showToast" />
    </div>

    <!-- 物流 -->
    <div v-if="shipment && (shipment.tracking_no || (shipment.traces && shipment.traces.length))" class="card">
      <h3 class="sec-title">物流跟踪</h3>
      <div v-if="shipment.tracking_no" class="row">
        <span>{{ shipment.carrier || '快递' }}</span><b>{{ shipment.tracking_no }}</b>
      </div>
      <div class="traces">
        <div v-for="(t, i) in shipment.traces || []" :key="i" class="trace">
          <span class="trace-dot" :class="{ first: i === 0 }" />
          <div class="trace-body">
            <div class="trace-desc">{{ t.desc }}</div>
            <div class="trace-time">{{ t.time }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作 -->
    <div class="actions">
      <button class="cta secondary" @click="onContact">联系客服</button>
      <button v-if="order.status === 'pending'" class="cta primary" :disabled="paying" @click="onPay">
        {{ paying ? '支付中…' : '去支付' }}
      </button>
    </div>

    <Transition name="toast">
      <div v-if="toast" class="od-toast">{{ toast }}</div>
    </Transition>
  </div>

  <div v-else class="loading">加载中…</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { orderApi, type Order, type Shipment } from '@/api'
import { payExistingOrder } from '@/composables/useOrderPay'
import { SUPPORT_PHONE } from '@/data/order'
import OrderAttachments from '@/components/order/OrderAttachments.vue'

const route = useRoute()
const router = useRouter()

const order = ref<Order | null>(null)
const shipment = ref<Shipment | null>(null)
const paying = ref(false)
const editing = ref(false)
const draftRemark = ref('')
const draftAddress = ref('')
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

// 仅待付款 / 已付款（未进入生产）可编辑备注、地址与附件
const canEdit = computed(() => ['pending', 'paid'].includes(order.value?.status || ''))
const isLocked = computed(() => ['producing', 'shipped', 'done'].includes(order.value?.status || ''))

function showToast(msg: string) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2000)
}

async function toggleEdit() {
  if (!order.value) return
  if (editing.value) {
    try {
      await orderApi.update(order.value.id, { remark: draftRemark.value, address: draftAddress.value })
      order.value.remark = draftRemark.value
      order.value.address = draftAddress.value
      editing.value = false
      showToast('已保存')
    } catch (e) {
      showToast((e as Error).message || '保存失败')
    }
  } else {
    draftRemark.value = order.value.remark || ''
    draftAddress.value = order.value.address || ''
    editing.value = true
  }
}

const STATUS: Record<string, string> = {
  pending: '待支付', paid: '待生产', producing: '生产中', shipped: '已发货', done: '已完成', cancelled: '已取消',
}
const flowSteps = [
  { key: 'paid', label: '已支付' },
  { key: 'producing', label: '生产中' },
  { key: 'shipped', label: '已发货' },
  { key: 'done', label: '已完成' },
]
const currentIdx = computed(() => Math.max(0, flowSteps.findIndex((s) => s.key === order.value?.status)))
const sizeText = computed(() => {
  const s = order.value?.sizes
  if (!s || typeof s !== 'object') return ''
  return Object.entries(s).filter(([, v]) => Number(v) > 0).map(([k, v]) => `${k}×${v}`).join('，')
})

const statusText = (s: string) => STATUS[s] || s

async function load() {
  const id = Number(route.params.id)
  if (!id) return
  try {
    const res = await orderApi.get(id)
    order.value = res.data
  } catch {
    /* 忽略 */
  }
  try {
    const sh = await orderApi.shipment(id)
    shipment.value = sh.data
  } catch {
    /* 无物流忽略 */
  }
}

async function onPay() {
  if (!order.value || paying.value) return
  paying.value = true
  try {
    const r = await payExistingOrder(order.value.id, order.value.order_no)
    if (r.paid) {
      await load()
    } else {
      alert('请在微信内完成支付')
    }
  } catch (e) {
    alert((e as Error).message || '支付失败，请重试')
  } finally {
    paying.value = false
  }
}

function onContact() {
  alert(`客服电话：${SUPPORT_PHONE}`)
}

onMounted(load)
</script>

<style scoped>
.od {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
}
.back {
  border: none;
  background: none;
  color: var(--text-2);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 12px;
}
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}
.status-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}
.status-name {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary);
}
.order-no {
  font-size: 12px;
  color: var(--text-3);
}
.flow {
  display: flex;
  justify-content: space-between;
}
.flow-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
}
.flow-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg-hover);
  color: var(--text-3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}
.flow-step.done .flow-dot {
  background: var(--primary);
  color: #fff;
}
.flow-label {
  font-size: 12px;
  color: var(--text-2);
}
.sec-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
}
.sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.sec-head .sec-title {
  margin-bottom: 0;
}
.edit-btn {
  border: 1px solid var(--primary);
  background: var(--bg-card);
  color: var(--primary);
  border-radius: 999px;
  font-size: 12px;
  padding: 4px 14px;
  cursor: pointer;
}
.edit-locked {
  font-size: 12px;
  color: var(--text-3);
}
.edit-field {
  display: block;
  margin: 10px 0;
}
.edit-field span {
  display: block;
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 6px;
}
.edit-field textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  background: var(--bg);
}
.od-toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(43, 31, 20, 0.9);
  color: #fff;
  padding: 10px 22px;
  border-radius: 999px;
  font-size: 14px;
  z-index: 400;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  font-size: 14px;
  color: var(--text-2);
}
.row b {
  color: var(--text);
  font-weight: 600;
  text-align: right;
  max-width: 70%;
}
.row .amt {
  color: var(--pink);
  font-size: 16px;
}
.traces {
  margin-top: 10px;
}
.trace {
  display: flex;
  gap: 10px;
  padding: 6px 0;
}
.trace-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--border);
  margin-top: 4px;
  flex-shrink: 0;
}
.trace-dot.first {
  background: var(--primary);
}
.trace-desc {
  font-size: 13px;
  color: var(--text);
}
.trace-time {
  font-size: 11px;
  color: var(--text-3);
}
.actions {
  display: flex;
  gap: 12px;
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
.cta.primary:disabled {
  opacity: 0.6;
}
.loading {
  text-align: center;
  padding: 80px;
  color: var(--text-3);
}
</style>
