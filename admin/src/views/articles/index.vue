<template>
  <div class="page-container">
    <div class="page-toolbar">
      <h2>推荐 / 资讯</h2>
      <a-space>
        <a-select v-model="kind" :style="{ width: '140px' }" @change="onKindChange">
          <a-option value="feed">推荐流</a-option>
          <a-option value="news">资讯</a-option>
          <a-option value="faq">FAQ</a-option>
        </a-select>
        <a-input-search v-model="keyword" placeholder="搜索标题 / 内容" :style="{ width: '240px' }" allow-clear @input="onSearch" />
        <a-button type="primary" @click="openCreate">
          <template #icon><icon-plus /></template>
          新增
        </a-button>
      </a-space>
    </div>

    <a-table :data="pagedList" :loading="loading" :pagination="false" row-key="id">
      <template #columns>
        <a-table-column title="标题" data-index="title" />
        <a-table-column title="标签" data-index="tag" :width="100" />
        <a-table-column title="摘要" data-index="summary" />
        <a-table-column title="排序" data-index="sort" :width="80" />
        <a-table-column title="状态" :width="90">
          <template #cell="{ record }">
            <a-tag :color="record.status === 1 ? 'green' : 'gray'">{{ record.status === 1 ? '上线' : '下线' }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" :width="150" fixed="right">
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

    <a-modal v-model:visible="modalVisible" :title="editing ? '编辑' : '新增'" @ok="onSubmit" @cancel="modalVisible = false">
      <a-form :model="form" layout="vertical">
        <a-form-item label="标题"><a-input v-model="form.title" /></a-form-item>
        <a-form-item label="标签"><a-input v-model="form.tag" /></a-form-item>
        <a-form-item label="摘要"><a-textarea v-model="form.summary" :auto-size="{ minRows: 2 }" /></a-form-item>
        <a-form-item label="封面 URL"><a-input v-model="form.cover_url" /></a-form-item>
        <a-form-item label="跳转链接"><a-input v-model="form.link" /></a-form-item>
        <a-row :gutter="12">
          <a-col :span="12"><a-form-item label="排序"><a-input-number v-model="form.sort" :min="0" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="状态"><a-switch v-model="form.status" :checked-value="1" :unchecked-value="0" /></a-form-item></a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listArticles, createArticle, updateArticle, deleteArticle, type Article } from '@/api/articles'

const kind = ref('feed')
const list = ref<Article[]>([])
const loading = ref(false)
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter((a) => `${a.title} ${a.summary ?? ''}`.toLowerCase().includes(kw))
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
const editing = ref<Article | null>(null)
const form = reactive<{ kind: string; title: string; tag: string; summary: string; cover_url: string; link: string; sort: number; status: number }>({
  kind: 'feed', title: '', tag: '', summary: '', cover_url: '', link: '', sort: 0, status: 1,
})

async function fetchList() {
  loading.value = true
  try {
    const res = await listArticles(kind.value)
    list.value = res.data
    pageNum.value = 1
  } finally {
    loading.value = false
  }
}
async function onKindChange() {
  keyword.value = ''
  await fetchList()
}
function reset() {
  Object.assign(form, { kind: kind.value, title: '', tag: '', summary: '', cover_url: '', link: '', sort: 0, status: 1 })
}
function openCreate() {
  editing.value = null
  reset()
  modalVisible.value = true
}
function openEdit(r: Article) {
  editing.value = r
  Object.assign(form, {
    kind: r.kind,
    title: r.title,
    tag: r.tag ?? '',
    summary: r.summary ?? '',
    cover_url: r.cover_url ?? '',
    link: r.link ?? '',
    sort: r.sort,
    status: r.status,
  })
  modalVisible.value = true
}
async function onSubmit() {
  if (!form.title) {
    Message.warning('标题必填')
    return
  }
  if (editing.value) {
    await updateArticle(editing.value.id, form)
    Message.success('已更新')
  } else {
    await createArticle({ ...form, kind: kind.value })
    Message.success('已创建')
  }
  modalVisible.value = false
  fetchList()
}
async function onDelete(id: number) {
  await deleteArticle(id)
  Message.success('已删除')
  fetchList()
}
onMounted(fetchList)
</script>
