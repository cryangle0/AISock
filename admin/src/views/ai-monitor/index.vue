<template>
  <div>
    <a-row :gutter="16">
      <a-col v-for="c in cards" :key="c.label" :span="6">
        <a-card class="stat-card" :bordered="false">
          <div class="stat-label">{{ c.label }}</div>
          <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="table-card" :bordered="false">
      <template #title>
        <a-space>
          <span>AI 生成任务</span>
          <a-select v-model="status" placeholder="全部状态" allow-clear :style="{ width: '140px' }" size="small" @change="onFilter">
            <a-option value="success">成功</a-option>
            <a-option value="failed">失败</a-option>
            <a-option value="running">进行中</a-option>
            <a-option value="pending">排队中</a-option>
          </a-select>
        </a-space>
      </template>
      <a-table :data="list" :loading="loading" :pagination="false" row-key="id">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="80" />
          <a-table-column title="用户" data-index="user_phone" :width="140" />
          <a-table-column title="类型" data-index="type" :width="100" />
          <a-table-column title="提示词" data-index="prompt" />
          <a-table-column title="状态" :width="100">
            <template #cell="{ record }">
              <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="时间" data-index="created_at" :width="170" />
        </template>
      </a-table>
      <div class="pager">
        <a-pagination :total="total" :current="pageNum" :page-size="pageSize" :page-size-options="[10, 20, 50, 100]" show-total show-page-size @change="onPage" @page-size-change="onPageSize" />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, ref } from 'vue'
import { listAiTasks, aiTaskStats, type AiTask } from '@/api/monitoring'

const stats = ref<Record<string, number>>({})
const list = ref<AiTask[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const status = ref<string | undefined>()

const cards = computed(() => [
  { label: '任务总数', value: stats.value.total ?? 0, color: '#8c5a3c' },
  { label: '成功', value: stats.value.success ?? 0, color: '#5a8a7d' },
  { label: '失败', value: stats.value.failed ?? 0, color: '#c5483c' },
  { label: '进行中', value: (stats.value.running ?? 0) + (stats.value.pending ?? 0), color: '#3a6fa3' },
])

function statusColor(s: string) {
  return { success: 'green', failed: 'red', running: 'blue', pending: 'orange' }[s] || 'gray'
}

async function fetchAll() {
  loading.value = true
  try {
    const [st, ls] = await Promise.all([
      aiTaskStats(),
      listAiTasks({ pageNum: pageNum.value, pageSize: pageSize.value, status: status.value }),
    ])
    stats.value = st.data
    list.value = ls.data.list
    total.value = ls.data.total
  } finally {
    loading.value = false
  }
}
function onFilter() {
  pageNum.value = 1
  fetchAll()
}
function onPage(p: number) {
  pageNum.value = p
  fetchAll()
}
function onPageSize(size: number) {
  pageSize.value = size
  pageNum.value = 1
  fetchAll()
}
// keep-alive 下首次激活与每次切回页面都会触发，保证数据不陈旧且首屏只拉一次
onActivated(fetchAll)
</script>

<style scoped lang="less">
.stat-card {
  border-radius: 12px;
}
.stat-label {
  font-size: 13px;
  color: var(--color-text-3);
}
.stat-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 800;
}
.table-card {
  margin-top: 16px;
  border-radius: 12px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
