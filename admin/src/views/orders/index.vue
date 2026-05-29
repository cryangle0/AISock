<template>
  <div class="page-container">
    <div class="page-toolbar">
      <h2>订单管理</h2>
      <a-space>
        <a-select v-model="status" placeholder="全部状态" allow-clear :style="{ width: '140px' }" @change="onFilter">
          <a-option v-for="(label, key) in STATUS_MAP" :key="key" :value="key">{{ label }}</a-option>
        </a-select>
        <a-input-search v-model="keyword" placeholder="订单号 / 设计名" :style="{ width: '220px' }" @search="onFilter" />
      </a-space>
    </div>

    <a-table :data="list" :loading="loading" :pagination="false" row-key="id">
      <template #columns>
        <a-table-column title="订单号" data-index="order_no" :width="180" />
        <a-table-column title="设计" data-index="design_name" :width="120" />
        <a-table-column title="用户" :width="130">
          <template #cell="{ record }">{{ record.user_nickname || record.user_phone || '-' }}</template>
        </a-table-column>
        <a-table-column title="数量" data-index="quantity" :width="80" />
        <a-table-column title="金额(元)" data-index="total_amount" :width="100" />
        <a-table-column title="状态" :width="100">
          <template #cell="{ record }">
            <a-tag :color="statusColor(record.status)">{{ STATUS_MAP[record.status] || record.status }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="创建时间" data-index="created_at" :width="170" />
        <a-table-column title="操作" :width="140" fixed="right">
          <template #cell="{ record }">
            <a-dropdown @select="(v) => onChangeStatus(record.id, v as string)">
              <a-button type="text" size="small">改状态<icon-down /></a-button>
              <template #content>
                <a-doption v-for="(label, key) in STATUS_MAP" :key="key" :value="key">{{ label }}</a-doption>
              </template>
            </a-dropdown>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <div class="pager">
      <a-pagination :total="total" :current="pageNum" :page-size="pageSize" show-total @change="onPageChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listOrders, updateOrderStatus, type AdminOrder } from '@/api/orders'

const STATUS_MAP: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  producing: '生产中',
  shipped: '已发货',
  done: '已完成',
  cancelled: '已取消',
}

const list = ref<AdminOrder[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const status = ref<string | undefined>()
const keyword = ref('')

function statusColor(s: string): string {
  return { pending: 'orange', paid: 'blue', producing: 'cyan', shipped: 'purple', done: 'green', cancelled: 'gray' }[s] || 'gray'
}

async function fetchList() {
  loading.value = true
  try {
    const res = await listOrders({
      pageNum: pageNum.value, pageSize: pageSize.value,
      status: status.value, keyword: keyword.value || undefined,
    })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function onFilter() {
  pageNum.value = 1
  fetchList()
}

function onPageChange(p: number) {
  pageNum.value = p
  fetchList()
}

async function onChangeStatus(id: number, newStatus: string) {
  await updateOrderStatus(id, newStatus)
  Message.success('状态已更新')
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped lang="less">
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
