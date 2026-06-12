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
        <a-table-column title="操作" :width="200" fixed="right">
          <template #cell="{ record }">
            <a-space>
              <a-button type="text" size="small" @click="openDetail(record.id)">详情</a-button>
              <a-dropdown v-if="nextStatuses(record.status).length" @select="(v) => onChangeStatus(record.id, v as string)">
                <a-button type="text" size="small">改状态<icon-down /></a-button>
                <template #content>
                  <a-doption v-for="key in nextStatuses(record.status)" :key="key" :value="key">{{ STATUS_MAP[key] }}</a-doption>
                </template>
              </a-dropdown>
              <span v-else class="status-end">—</span>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <div class="pager">
      <a-pagination :total="total" :current="pageNum" :page-size="pageSize" :page-size-options="[10, 20, 50, 100]" show-total show-page-size @change="onPageChange" @page-size-change="onPageSizeChange" />
    </div>

    <!-- 订单详情抽屉 -->
    <a-drawer v-model:visible="detailVisible" title="订单详情" :width="420" :footer="false">
      <a-spin :loading="detailLoading" style="width: 100%">
        <a-descriptions v-if="detail" :column="1" bordered size="medium">
          <a-descriptions-item label="订单号">{{ detail.order_no }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="statusColor(detail.status)">{{ STATUS_MAP[detail.status] || detail.status }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="设计名称">{{ detail.design_name || '-' }}</a-descriptions-item>
          <a-descriptions-item label="用户">{{ detail.user_nickname || '-' }}（{{ detail.user_phone || '-' }}）</a-descriptions-item>
          <a-descriptions-item label="数量">{{ detail.quantity }} 双</a-descriptions-item>
          <a-descriptions-item label="金额">¥ {{ detail.total_amount }}</a-descriptions-item>
          <a-descriptions-item label="材质 / 工艺">{{ detail.material || '-' }} / {{ detail.craft || '-' }}</a-descriptions-item>
          <a-descriptions-item label="收货信息">{{ detail.address || '-' }}</a-descriptions-item>
          <a-descriptions-item label="尺码分布">{{ sizeText }}</a-descriptions-item>
          <a-descriptions-item label="备注">{{ detail.remark || '-' }}</a-descriptions-item>
          <a-descriptions-item label="支付方式">{{ detail.pay_method || '-' }}</a-descriptions-item>
          <a-descriptions-item label="支付时间">{{ detail.paid_at || '-' }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ detail.created_at }}</a-descriptions-item>
        </a-descriptions>

        <!-- 用户补传的附件（设计稿 / 图片 / 文件） -->
        <div v-if="detail" class="att-block">
          <div class="att-title">订单附件（{{ detail.attachments?.length || 0 }}）</div>
          <div v-if="detail.attachments && detail.attachments.length" class="att-grid">
            <a
              v-for="f in detail.attachments"
              :key="f.id"
              :href="f.url"
              target="_blank"
              rel="noopener"
              class="att-item"
              :title="f.name"
            >
              <img v-if="isImage(f)" :src="f.url" :alt="f.name" class="att-thumb" />
              <span v-else class="att-file">📄</span>
              <span class="att-name">{{ f.name }}</span>
            </a>
          </div>
          <a-empty v-else description="用户暂未上传附件" />
        </div>
      </a-spin>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listOrders, getOrder, updateOrderStatus, type AdminOrder, type OrderAttachment } from '@/api/orders'

const STATUS_MAP: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  producing: '生产中',
  shipped: '已发货',
  done: '已完成',
  cancelled: '已取消',
}

/** 合法状态流转（与后端 STATUS_FLOW 一致），改状态下拉只列出可达状态 */
const STATUS_FLOW: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['producing', 'cancelled'],
  producing: ['shipped', 'cancelled'],
  shipped: ['done'],
  done: [],
  cancelled: [],
}
function nextStatuses(s: string): string[] {
  return STATUS_FLOW[s] || []
}

const list = ref<AdminOrder[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const status = ref<string | undefined>()
const keyword = ref('')

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<AdminOrder | null>(null)

const sizeText = computed(() => {
  const s = detail.value?.sizes
  if (!s || typeof s !== 'object') return '-'
  const entries = Object.entries(s).filter(([, v]) => Number(v) > 0)
  return entries.length ? entries.map(([k, v]) => `${k}×${v}`).join('，') : '-'
})

async function openDetail(id: number) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await getOrder(id)
    detail.value = res.data
  } finally {
    detailLoading.value = false
  }
}

function statusColor(s: string): string {
  return { pending: 'orange', paid: 'blue', producing: 'cyan', shipped: 'purple', done: 'green', cancelled: 'gray' }[s] || 'gray'
}

function isImage(f: OrderAttachment): boolean {
  return (f.mime || '').startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(f.name)
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

function onPageSizeChange(size: number) {
  pageSize.value = size
  pageNum.value = 1
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
.status-end {
  color: var(--color-text-3);
  font-size: 12px;
  padding: 0 8px;
}
.att-block {
  margin-top: 20px;
}
.att-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}
.att-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px;
}
.att-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-decoration: none;
}
.att-thumb,
.att-file {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--color-border-2);
  background: var(--color-fill-2);
  font-size: 32px;
}
.att-name {
  font-size: 11px;
  color: var(--color-text-3);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
