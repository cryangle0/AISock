<template>
  <div class="page-container">
    <div class="page-toolbar">
      <h2>物流管理</h2>
      <a-space>
        <a-input-search v-model="keyword" placeholder="搜索订单号 / 运单号 / 承运商" :style="{ width: '280px' }" allow-clear @input="onSearch" />
        <a-button type="primary" @click="openUpsertModal">
          <template #icon><icon-plus /></template>
          录入运单
        </a-button>
      </a-space>
    </div>

    <a-table :data="pagedList" :loading="loading" :pagination="false" row-key="id">
      <template #columns>
        <a-table-column title="订单ID" data-index="order_id" :width="100" />
        <a-table-column title="承运商" data-index="carrier" :width="120" />
        <a-table-column title="运单号" data-index="tracking_no" />
        <a-table-column title="状态" :width="120">
          <template #cell="{ record }">
            <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" :width="160" fixed="right">
          <template #cell="{ record }">
            <a-button type="text" size="small" @click="openTrace(record)">追加轨迹</a-button>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <div :style="{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }">
      <a-pagination
        :total="filtered.length"
        :current="pageNum"
        :page-size="pageSize"
        :page-size-options="[10, 20, 50, 100]"
        show-total
        show-page-size
        @change="(p) => (pageNum = p)"
        @page-size-change="onPageSize"
      />
    </div>

    <a-modal v-model:visible="modalVisible" title="录入运单" :on-before-ok="onUpsert" @cancel="modalVisible = false">
      <a-form :model="form" layout="vertical">
        <a-form-item label="订单 ID"><a-input-number v-model="form.orderId" :min="1" style="width:100%" /></a-form-item>
        <a-form-item label="承运商">
          <a-select v-model="form.carrier">
            <a-option v-for="c in carriers" :key="c" :value="c">{{ c }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="运单号"><a-input v-model="form.trackingNo" /></a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="traceVisible" title="追加物流轨迹" :on-before-ok="onTrace" @cancel="traceVisible = false">
      <a-form :model="traceForm" layout="vertical">
        <a-form-item label="轨迹描述"><a-input v-model="traceForm.desc" placeholder="如：已到达分拨中心" /></a-form-item>
        <a-form-item label="更新状态">
          <a-select v-model="traceForm.status" allow-clear>
            <a-option value="in-transit">运输中</a-option>
            <a-option value="delivered">已签收（订单转完成）</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listShipments, upsertShipment, appendTrace, type Shipment } from '@/api/monitoring'

const carriers = ['顺丰速运', '京东物流', '中通快递', '圆通速递', '韵达快递']
const list = ref<Shipment[]>([])
const loading = ref(false)
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter((s) => `${s.order_id} ${s.tracking_no ?? ''} ${s.carrier ?? ''}`.toLowerCase().includes(kw))
})
const pagedList = computed(() => filtered.value.slice((pageNum.value - 1) * pageSize.value, pageNum.value * pageSize.value))
function onSearch() {
  pageNum.value = 1
}
function onPageSize(size: number) {
  pageSize.value = size
  pageNum.value = 1
}
const modalVisible = ref(false)
const traceVisible = ref(false)
const form = reactive({ orderId: undefined as number | undefined, carrier: '顺丰速运', trackingNo: '' })
const traceForm = reactive({ orderId: 0, desc: '', status: '' })

function statusText(s: string) {
  return { pending: '待发货', 'in-transit': '运输中', delivered: '已签收' }[s] || s
}
function statusColor(s: string) {
  return { pending: 'gray', 'in-transit': 'blue', delivered: 'green' }[s] || 'gray'
}

async function fetchList() {
  loading.value = true
  try {
    const res = await listShipments()
    list.value = res.data
  } finally {
    loading.value = false
  }
}
function openUpsertModal() {
  form.orderId = undefined
  form.carrier = '顺丰速运'
  form.trackingNo = ''
  modalVisible.value = true
}
async function onUpsert(): Promise<boolean> {
  if (!form.orderId || !form.trackingNo) {
    Message.warning('订单 ID 和运单号必填')
    return false
  }
  try {
    await upsertShipment({ orderId: form.orderId, carrier: form.carrier, trackingNo: form.trackingNo })
    Message.success('已录入')
  } catch {
    // 如「订单未支付不可发货」：保持弹窗打开，表单不丢失
    return false
  }
  fetchList()
  return true
}
function openTrace(r: Shipment) {
  traceForm.orderId = r.order_id
  traceForm.desc = ''
  traceForm.status = ''
  traceVisible.value = true
}
async function onTrace(): Promise<boolean> {
  if (!traceForm.desc) {
    Message.warning('轨迹描述必填')
    return false
  }
  try {
    await appendTrace(traceForm.orderId, traceForm.desc, traceForm.status || undefined)
    Message.success('已追加')
  } catch {
    return false
  }
  fetchList()
  return true
}
// keep-alive 下首次激活与每次切回页面都会触发，保证数据不陈旧且首屏只拉一次
onActivated(fetchList)
</script>
