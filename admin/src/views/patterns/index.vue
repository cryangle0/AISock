<template>
  <div class="page-container">
    <div class="page-toolbar">
      <h2>花型素材</h2>
      <a-space>
        <a-select
          v-model="categoryId"
          placeholder="全部分类"
          allow-clear
          :style="{ width: '160px' }"
          @change="onFilter"
        >
          <a-option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</a-option>
        </a-select>
        <a-input-search v-model="keyword" placeholder="搜索名称" :style="{ width: '200px' }" @search="onFilter" />
        <a-button @click="categoryModalVisible = true">
          <template #icon><icon-settings /></template>
          分类管理
        </a-button>
        <a-button type="primary" @click="openCreate">
          <template #icon><icon-plus /></template>
          新增花型
        </a-button>
      </a-space>
    </div>

    <a-spin :loading="loading" style="width: 100%">
      <a-grid :cols="6" :col-gap="12" :row-gap="12">
        <a-grid-item v-for="p in list" :key="p.id">
          <a-card hoverable :body-style="{ padding: '8px' }">
            <template #cover>
              <img :src="p.thumb_url || p.image_url" :alt="p.name" class="pattern-img" />
            </template>
            <div class="pattern-name">{{ p.name }}</div>
            <div class="pattern-ops">
              <a-button type="text" size="mini" @click="openEdit(p)">编辑</a-button>
              <a-popconfirm content="确定删除？" @ok="onDelete(p.id)">
                <a-button type="text" status="danger" size="mini">删除</a-button>
              </a-popconfirm>
            </div>
          </a-card>
        </a-grid-item>
      </a-grid>
    </a-spin>

    <div class="pager">
      <a-pagination
        :total="total"
        :current="pageNum"
        :page-size="pageSize"
        :page-size-options="[12, 18, 24, 48, 96]"
        show-total
        show-page-size
        @change="onPageChange"
        @page-size-change="onPageSizeChange"
      />
    </div>

    <a-modal v-model:visible="modalVisible" :title="editing ? '编辑花型' : '新增花型'" :on-before-ok="onSubmit" @cancel="modalVisible = false">
      <a-form :model="form" layout="vertical">
        <a-form-item label="名称"><a-input v-model="form.name" /></a-form-item>
        <a-form-item label="分类">
          <a-select v-model="form.categoryId" placeholder="选择分类" allow-clear>
            <a-option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="图片 URL"><a-input v-model="form.imageUrl" /></a-form-item>
        <a-form-item label="缩略图 URL"><a-input v-model="form.thumbUrl" /></a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="categoryModalVisible" title="分类管理" :footer="false" @cancel="categoryModalVisible = false">
      <a-list :bordered="false" :max-height="320">
        <a-list-item v-for="cat in categories" :key="cat.id">
          <a-space>
            <a-input v-model="cat.name" :style="{ width: '150px' }" />
            <a-input-number v-model="cat.sort" :min="0" :style="{ width: '90px' }" placeholder="排序" />
            <a-button size="mini" type="primary" @click="onSaveCategory(cat)">保存</a-button>
            <a-popconfirm content="删除该分类？其下花型将变为未分类" @ok="onDeleteCategory(cat.id)">
              <a-button size="mini" status="danger">删除</a-button>
            </a-popconfirm>
          </a-space>
        </a-list-item>
        <template #empty><a-empty description="暂无分类" /></template>
      </a-list>
      <a-divider :margin="12" />
      <a-space>
        <a-input v-model="categoryForm.name" placeholder="新分类名，如 节气 / 国潮" :style="{ width: '150px' }" />
        <a-input-number v-model="categoryForm.sort" :min="0" :style="{ width: '90px' }" placeholder="排序" />
        <a-button type="primary" @click="onCreateCategory">
          <template #icon><icon-plus /></template>
          新增分类
        </a-button>
      </a-space>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onActivated, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  listPatterns, listCategories, createPattern, updatePattern, deletePattern,
  createCategory, updateCategory, deleteCategory,
  type Pattern, type PatternCategory,
} from '@/api/patterns'

const list = ref<Pattern[]>([])
const categories = ref<PatternCategory[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(18)
const categoryId = ref<number | undefined>()
const keyword = ref('')
const modalVisible = ref(false)
const editing = ref<Pattern | null>(null)
const form = reactive<{ name: string; imageUrl: string; thumbUrl: string; categoryId?: number }>({
  name: '', imageUrl: '', thumbUrl: '', categoryId: undefined,
})
const categoryModalVisible = ref(false)
const categoryForm = reactive<{ name: string; sort: number }>({ name: '', sort: 0 })

async function fetchList() {
  loading.value = true
  try {
    const res = await listPatterns({
      pageNum: pageNum.value, pageSize: pageSize.value,
      categoryId: categoryId.value, keyword: keyword.value || undefined,
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

function resetForm() {
  Object.assign(form, { name: '', imageUrl: '', thumbUrl: '', categoryId: undefined })
}

function openCreate() {
  editing.value = null
  resetForm()
  modalVisible.value = true
}

function openEdit(p: Pattern) {
  editing.value = p
  Object.assign(form, {
    name: p.name, imageUrl: p.image_url, thumbUrl: p.thumb_url || '', categoryId: p.category_id ?? undefined,
  })
  modalVisible.value = true
}

async function onSubmit(): Promise<boolean> {
  if (!form.name || !form.imageUrl) {
    Message.warning('名称和图片 URL 必填')
    return false
  }
  try {
    if (editing.value) {
      await updatePattern(editing.value.id, {
        name: form.name, imageUrl: form.imageUrl, thumbUrl: form.thumbUrl, categoryId: form.categoryId ?? null,
      })
      Message.success('已更新')
    } else {
      await createPattern(form)
      Message.success('已创建')
    }
  } catch {
    // 接口报错时保持弹窗打开，表单不丢失（错误提示由拦截器统一处理）
    return false
  }
  resetForm()
  fetchList()
  return true
}

async function onDelete(id: number) {
  await deletePattern(id)
  Message.success('已删除')
  fetchList()
}

async function onCreateCategory() {
  if (!categoryForm.name.trim()) {
    Message.warning('分类名必填')
    return
  }
  await createCategory({ name: categoryForm.name.trim(), sort: categoryForm.sort })
  Message.success('分类已创建')
  Object.assign(categoryForm, { name: '', sort: 0 })
  await refreshCategories()
}

async function onSaveCategory(cat: PatternCategory) {
  if (!cat.name?.trim()) {
    Message.warning('分类名不能为空')
    return
  }
  await updateCategory(cat.id, { name: cat.name.trim(), sort: cat.sort })
  Message.success('已保存')
  await refreshCategories()
}

async function onDeleteCategory(id: number) {
  await deleteCategory(id)
  Message.success('分类已删除')
  if (categoryId.value === id) categoryId.value = undefined
  await refreshCategories()
  fetchList()
}

async function refreshCategories() {
  const cats = await listCategories()
  categories.value = cats.data
}

// keep-alive 下首次激活与每次切回页面都会触发，保证数据不陈旧且首屏只拉一次
onActivated(async () => {
  const cats = await listCategories()
  categories.value = cats.data
  fetchList()
})
</script>

<style scoped lang="less">
.pattern-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}
.pattern-name {
  font-size: 12px;
  text-align: center;
  margin: 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pattern-ops {
  display: flex;
  justify-content: center;
  gap: 4px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
