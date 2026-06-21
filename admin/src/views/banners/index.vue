<template>
  <div class="page-container">
    <div class="page-toolbar">
      <h2>Banner 管理</h2>
      <a-space>
        <a-input-search v-model="keyword" placeholder="搜索标题 / 副标题" :style="{ width: '240px' }" allow-clear @input="onSearch" />
        <a-button type="primary" @click="openCreate">
          <template #icon><icon-plus /></template>
          新增 Banner
        </a-button>
      </a-space>
    </div>

    <a-table :data="pagedList" :loading="loading" :pagination="false" row-key="id">
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

    <a-modal v-model:visible="modalVisible" :title="editing ? '编辑 Banner' : '新增 Banner'" :on-before-ok="onSubmit" @cancel="modalVisible = false">
      <a-form :model="form" layout="vertical">
        <a-form-item label="标题"><a-input v-model="form.title" /></a-form-item>
        <a-form-item label="副标题"><a-input v-model="form.subtitle" /></a-form-item>
        <a-form-item label="图片 URL"><ImageUploadInput v-model="form.imageUrl" /></a-form-item>
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
import { computed, onActivated, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listBanners, createBanner, updateBanner, deleteBanner, type Banner } from '@/api/banners'
import ImageUploadInput from '@/components/ImageUploadInput.vue'

const list = ref<Banner[]>([])
const loading = ref(false)
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter((b) => `${b.title} ${b.subtitle ?? ''}`.toLowerCase().includes(kw))
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

async function onSubmit(): Promise<boolean> {
  if (!form.title) {
    Message.warning('标题必填')
    return false
  }
  try {
    if (editing.value) {
      await updateBanner(editing.value.id, form)
      Message.success('已更新')
    } else {
      await createBanner(form)
      Message.success('已创建')
    }
  } catch {
    // 接口报错时保持弹窗打开，表单不丢失（错误提示由拦截器统一处理）
    return false
  }
  fetchList()
  return true
}

async function onDelete(id: number) {
  await deleteBanner(id)
  Message.success('已删除')
  fetchList()
}

// keep-alive 下首次激活与每次切回页面都会触发，保证数据不陈旧且首屏只拉一次
onActivated(fetchList)
</script>
