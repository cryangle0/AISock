<template>
  <div class="page-container">
    <div class="page-toolbar">
      <h2>袜型管理</h2>
      <a-button type="primary" @click="openCreate">
        <template #icon><icon-plus /></template>
        新增袜型
      </a-button>
    </div>

    <a-table :data="list" :loading="loading" :pagination="false" row-key="id">
      <template #columns>
        <a-table-column title="编码" data-index="code" :width="120" />
        <a-table-column title="名称" data-index="name" :width="120" />
        <a-table-column title="工艺" data-index="craft" :width="100" />
        <a-table-column title="起订量" data-index="min_order" :width="90" />
        <a-table-column title="单价(元)" data-index="unit_price" :width="100" />
        <a-table-column title="推荐DPI" data-index="recommend_dpi" :width="90" />
        <a-table-column title="状态" :width="90">
          <template #cell="{ record }">
            <a-tag :color="record.status === 1 ? 'green' : 'gray'">
              {{ record.status === 1 ? '启用' : '停用' }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" :width="160" fixed="right">
          <template #cell="{ record }">
            <a-space>
              <a-button type="text" size="small" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm content="确定删除该袜型？" @ok="onDelete(record.id)">
                <a-button type="text" status="danger" size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <a-modal
      v-model:visible="modalVisible"
      :title="editing ? '编辑袜型' : '新增袜型'"
      @ok="onSubmit"
      @cancel="modalVisible = false"
    >
      <a-form :model="form" layout="vertical">
        <a-row :gutter="12">
          <a-col :span="12"><a-form-item label="编码"><a-input v-model="form.code" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="名称"><a-input v-model="form.name" /></a-form-item></a-col>
        </a-row>
        <a-row :gutter="12">
          <a-col :span="12"><a-form-item label="工艺"><a-input v-model="form.craft" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="起订量"><a-input-number v-model="form.min_order" :min="1" /></a-form-item></a-col>
        </a-row>
        <a-row :gutter="12">
          <a-col :span="12"><a-form-item label="单价(元)"><a-input-number v-model="form.unit_price" :min="0" :precision="2" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="推荐DPI"><a-input-number v-model="form.recommend_dpi" :min="72" /></a-form-item></a-col>
        </a-row>
        <a-row :gutter="12">
          <a-col :span="12"><a-form-item label="物理宽(mm)"><a-input-number v-model="form.phys_width_mm" :min="0" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="物理高(mm)"><a-input-number v-model="form.phys_height_mm" :min="0" /></a-form-item></a-col>
        </a-row>
        <a-form-item label="状态">
          <a-switch v-model="form.status" :checked-value="1" :unchecked-value="0" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listSocks, createSock, updateSock, deleteSock, type SockModel } from '@/api/socks'

const list = ref<SockModel[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const editing = ref<SockModel | null>(null)

const form = reactive<{
  code: string
  name: string
  craft: string
  min_order: number
  unit_price: number
  recommend_dpi: number
  phys_width_mm: number | undefined
  phys_height_mm: number | undefined
  status: number
}>({
  code: '', name: '', craft: '', min_order: 1, unit_price: 0, recommend_dpi: 150,
  phys_width_mm: undefined, phys_height_mm: undefined, status: 1,
})

async function fetchList() {
  loading.value = true
  try {
    const res = await listSocks()
    list.value = res.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { code: '', name: '', craft: '', min_order: 1, unit_price: 0, recommend_dpi: 150, phys_width_mm: undefined, phys_height_mm: undefined, status: 1 })
  modalVisible.value = true
}

function openEdit(record: SockModel) {
  editing.value = record
  Object.assign(form, {
    code: record.code,
    name: record.name,
    craft: record.craft ?? '',
    min_order: record.min_order,
    unit_price: record.unit_price,
    recommend_dpi: record.recommend_dpi ?? 150,
    phys_width_mm: record.phys_width_mm ?? undefined,
    phys_height_mm: record.phys_height_mm ?? undefined,
    status: record.status,
  })
  modalVisible.value = true
}

async function onSubmit() {
  if (!form.code || !form.name) {
    Message.warning('编码和名称必填')
    return
  }
  if (editing.value) {
    await updateSock(editing.value.id, form)
    Message.success('已更新')
  } else {
    await createSock(form)
    Message.success('已创建')
  }
  modalVisible.value = false
  fetchList()
}

async function onDelete(id: number) {
  await deleteSock(id)
  Message.success('已删除')
  fetchList()
}

onMounted(fetchList)
</script>
