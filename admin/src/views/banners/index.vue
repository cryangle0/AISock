<template>
  <div class="page-container">
    <div class="page-toolbar">
      <h2>Banner 管理</h2>
      <a-button type="primary" @click="openCreate">
        <template #icon><icon-plus /></template>
        新增 Banner
      </a-button>
    </div>

    <a-table :data="list" :loading="loading" :pagination="false" row-key="id">
      <template #columns>
        <a-table-column title="标题" data-index="title" :width="160" />
        <a-table-column title="副标题" data-index="subtitle" />
        <a-table-column title="排序" data-index="sort" :width="80" />
        <a-table-column title="状态" :width="90">
          <template #cell="{ record }">
            <a-tag :color="record.status === 1 ? 'green' : 'gray'">{{ record.status === 1 ? '上线' : '下线' }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" :width="160" fixed="right">
          <template #cell="{ record }">
            <a-space>
              <a-button type="text" size="small" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm content="确定删除？" @ok="onDelete(record.id)">
                <a-button type="text" status="danger" size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <a-modal v-model:visible="modalVisible" :title="editing ? '编辑 Banner' : '新增 Banner'" @ok="onSubmit" @cancel="modalVisible = false">
      <a-form :model="form" layout="vertical">
        <a-form-item label="标题"><a-input v-model="form.title" /></a-form-item>
        <a-form-item label="副标题"><a-input v-model="form.subtitle" /></a-form-item>
        <a-form-item label="图片 URL"><a-input v-model="form.imageUrl" /></a-form-item>
        <a-form-item label="跳转链接"><a-input v-model="form.link" /></a-form-item>
        <a-row :gutter="12">
          <a-col :span="12"><a-form-item label="排序"><a-input-number v-model="form.sort" :min="0" /></a-form-item></a-col>
          <a-col :span="12">
            <a-form-item label="状态">
              <a-switch v-model="form.status" :checked-value="1" :unchecked-value="0" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listBanners, createBanner, updateBanner, deleteBanner, type Banner } from '@/api/banners'

const list = ref<Banner[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const editing = ref<Banner | null>(null)
const form = reactive<{ title: string; subtitle: string; imageUrl: string; link: string; sort: number; status: number }>({
  title: '', subtitle: '', imageUrl: '', link: '', sort: 0, status: 1,
})

async function fetchList() {
  loading.value = true
  try {
    const res = await listBanners()
    list.value = res.data
  } finally {
    loading.value = false
  }
}

function reset() {
  Object.assign(form, { title: '', subtitle: '', imageUrl: '', link: '', sort: 0, status: 1 })
}

function openCreate() {
  editing.value = null
  reset()
  modalVisible.value = true
}

function openEdit(record: Banner) {
  editing.value = record
  Object.assign(form, {
    title: record.title, subtitle: record.subtitle || '', imageUrl: record.image_url || '',
    link: record.link || '', sort: record.sort, status: record.status,
  })
  modalVisible.value = true
}

async function onSubmit() {
  if (!form.title) {
    Message.warning('标题必填')
    return
  }
  if (editing.value) {
    await updateBanner(editing.value.id, form)
    Message.success('已更新')
  } else {
    await createBanner(form)
    Message.success('已创建')
  }
  modalVisible.value = false
  fetchList()
}

async function onDelete(id: number) {
  await deleteBanner(id)
  Message.success('已删除')
  fetchList()
}

onMounted(fetchList)
</script>
