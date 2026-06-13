<template>
  <div class="page-container">
    <div class="page-toolbar">
      <h2>用户管理</h2>
      <a-input-search v-model="keyword" placeholder="手机号 / 昵称" :style="{ width: '220px' }" @search="onFilter" />
    </div>

    <a-table :data="list" :loading="loading" :pagination="false" row-key="id">
      <template #columns>
        <a-table-column title="ID" data-index="id" :width="80" />
        <a-table-column title="手机号" data-index="phone" :width="140" />
        <a-table-column title="昵称" data-index="nickname" :width="140" />
        <a-table-column title="每日生图配额" :width="160">
          <template #cell="{ record }">
            <a-input-number
              :model-value="record.ai_quota_daily"
              :min="0"
              size="small"
              :style="{ width: '100px' }"
              @change="(v) => onChangeQuota(record, v as number)"
            />
          </template>
        </a-table-column>
        <a-table-column title="状态" :width="100">
          <template #cell="{ record }">
            <a-switch
              :model-value="record.status"
              :checked-value="1"
              :unchecked-value="0"
              @change="(v) => onChangeStatus(record, v as number)"
            />
          </template>
        </a-table-column>
        <a-table-column title="注册时间" data-index="created_at" :width="170" />
      </template>
    </a-table>

    <div class="pager">
      <a-pagination :total="total" :current="pageNum" :page-size="pageSize" :page-size-options="[10, 20, 50, 100]" show-total show-page-size @change="onPageChange" @page-size-change="onPageSizeChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onActivated, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listUsers, updateUserStatus, updateUserQuota, type AdminUser } from '@/api/users'

const list = ref<AdminUser[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const keyword = ref('')

async function fetchList() {
  loading.value = true
  try {
    const res = await listUsers({ pageNum: pageNum.value, pageSize: pageSize.value, keyword: keyword.value || undefined })
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

async function onChangeStatus(record: AdminUser, status: number) {
  await updateUserStatus(record.id, status)
  record.status = status
  Message.success('状态已更新')
}

async function onChangeQuota(record: AdminUser, quota: number) {
  await updateUserQuota(record.id, quota)
  record.ai_quota_daily = quota
  Message.success('配额已更新')
}

// keep-alive 下首次激活与每次切回页面都会触发，保证数据不陈旧且首屏只拉一次
onActivated(fetchList)
</script>

<style scoped lang="less">
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
