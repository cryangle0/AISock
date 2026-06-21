<template>
  <div class="page-container">
    <div class="page-toolbar">
      <h2>袜版管理</h2>
      <a-space>
        <a-input-search v-model="keyword" placeholder="搜索编码 / 名称 / 工艺" :style="{ width: '240px' }" allow-clear @input="onSearch" />
        <a-button type="primary" @click="openCreate">
          <template #icon><icon-plus /></template>
          新增袜版
        </a-button>
      </a-space>
    </div>

    <a-table :data="pagedList" :loading="loading" :pagination="false" row-key="id" :scroll="{ x: 1100 }">
      <template #columns>
        <a-table-column title="编码" data-index="code" :width="120" />
        <a-table-column title="名称" data-index="name" :width="120" />
        <a-table-column title="缩略图" :width="96">
          <template #cell="{ record }">
            <div class="sock-thumb-cell">
              <img v-if="record.thumb_url" :src="record.thumb_url" :alt="record.name" />
              <span v-else>-</span>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="工艺" data-index="craft" :width="100" />
        <a-table-column title="起订量" data-index="min_order" :width="90" />
        <a-table-column title="单价(元)" data-index="unit_price" :width="100" />
        <a-table-column title="推荐DPI" data-index="recommend_dpi" :width="90" />
        <a-table-column title="排序" data-index="sort" :width="70" />
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
              <a-popconfirm content="确定删除该袜版？" @ok="onDelete(record.id)">
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

    <a-modal
      v-model:visible="modalVisible"
      :title="editing ? '编辑袜版' : '新增袜版'"
      :on-before-ok="onSubmit"
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
        <a-row :gutter="12">
          <a-col :span="12"><a-form-item label="打印区像素(px)"><a-input-number v-model="form.print_area_px" :min="0" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="排序"><a-input-number v-model="form.sort" :min="0" /></a-form-item></a-col>
        </a-row>
        <a-divider :margin="8" orientation="left">渲染资源（编辑器用，可留空走默认几何）</a-divider>
        <a-form-item label="袜版 SVG URL"><a-input v-model="form.svg_url" placeholder="矢量袜形，可选" /></a-form-item>
        <a-form-item label="蒙版 Mask URL"><a-input v-model="form.mask_url" placeholder="分区蒙版图，可选" /></a-form-item>
        <a-form-item label="线稿 Lineart URL"><a-input v-model="form.lineart_url" placeholder="线稿叠加图，可选" /></a-form-item>
        <a-form-item label="状态">
          <a-switch v-model="form.status" :checked-value="1" :unchecked-value="0" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listSocks, createSock, updateSock, deleteSock, type SockModel } from '@/api/socks'

const list = ref<SockModel[]>([])
const loading = ref(false)
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter((s) => `${s.code} ${s.name} ${s.craft ?? ''}`.toLowerCase().includes(kw))
})
const pagedList = computed(() =>
  filtered.value.slice((pageNum.value - 1) * pageSize.value, pageNum.value * pageSize.value),
)
function onSearch() {
  pageNum.value = 1
}
function onPageSize(size: number) {
  pageSize.value = size
  pageNum.value = 1
}
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
  print_area_px: number | undefined
  sort: number
  svg_url: string
  mask_url: string
  lineart_url: string
  status: number
}>({
  code: '', name: '', craft: '', min_order: 1, unit_price: 0, recommend_dpi: 150,
  phys_width_mm: undefined, phys_height_mm: undefined, print_area_px: undefined, sort: 0,
  svg_url: '', mask_url: '', lineart_url: '', status: 1,
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
  Object.assign(form, { code: '', name: '', craft: '', min_order: 1, unit_price: 0, recommend_dpi: 150, phys_width_mm: undefined, phys_height_mm: undefined, print_area_px: undefined, sort: 0, svg_url: '', mask_url: '', lineart_url: '', status: 1 })
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
    print_area_px: record.print_area_px ?? undefined,
    sort: record.sort ?? 0,
    svg_url: record.svg_url ?? '',
    mask_url: record.mask_url ?? '',
    lineart_url: record.lineart_url ?? '',
    status: record.status,
  })
  modalVisible.value = true
}

async function onSubmit(): Promise<boolean> {
  if (!form.code || !form.name) {
    Message.warning('编码和名称必填')
    return false
  }
  try {
    if (editing.value) {
      await updateSock(editing.value.id, form)
      Message.success('已更新')
    } else {
      await createSock(form)
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
  await deleteSock(id)
  Message.success('已删除')
  fetchList()
}

// keep-alive 下首次激活与每次切回页面都会触发，保证数据不陈旧且首屏只拉一次
onActivated(fetchList)
</script>

<style scoped>
.sock-thumb-cell {
  width: 56px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--color-text-4);
  background: var(--color-fill-1);
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
}

.sock-thumb-cell img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
