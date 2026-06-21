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
        <a-form-item label="礼赠场景">
          <a-select v-model="selectedSceneIds" multiple allow-clear placeholder="可多选：送爱人/闺蜜/长辈/自己">
            <a-option v-for="t in sceneTags" :key="t.id" :value="t.id">{{ t.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="风格">
          <a-select v-model="selectedStyleIds" multiple allow-clear placeholder="可多选：浪漫花卉/国潮纹样…">
            <a-option v-for="t in styleTags" :key="t.id" :value="t.id">{{ t.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="主题(发现页)">
          <a-select v-model="selectedThemeIds" multiple allow-clear placeholder="发现页 Tab：野趣精灵/帕斯蒂尔…">
            <a-option v-for="t in themeTags" :key="t.id" :value="t.id">{{ t.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="图片 URL"><ImageUploadInput v-model="form.imageUrl" placeholder="https://… 或点上传" /></a-form-item>
        <a-form-item label="缩略图 URL"><ImageUploadInput v-model="form.thumbUrl" placeholder="留空则用主图" /></a-form-item>
        <a-divider orientation="left">浏览页展示</a-divider>
        <a-form-item label="条目展示名称">
          <a-input v-model="form.displayConfig.feedTitle" placeholder="留空则用花型名称" />
        </a-form-item>
        <a-form-item label="条目背景图">
          <ImageUploadInput v-model="form.displayConfig.feedCover" placeholder="留空则用主图" />
        </a-form-item>
        <a-divider orientation="left">详情页展示</a-divider>
        <a-form-item label="详情标题">
          <a-input v-model="form.displayConfig.detailTitle" placeholder="留空则用商品详情默认标题" />
        </a-form-item>
        <a-form-item label="详情描述">
          <a-textarea
            v-model="form.displayConfig.detailDescription"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            placeholder="留空则用商品详情默认描述"
          />
        </a-form-item>
        <a-form-item label="详情轮播图">
          <div class="image-list-fields">
            <ImageUploadInput
              v-for="(_, i) in form.displayConfig.detailSlides"
              :key="'slide-' + i"
              v-model="form.displayConfig.detailSlides[i]"
              :placeholder="`轮播图 ${i + 1}`"
            />
          </div>
        </a-form-item>
        <a-form-item label="设计展示图">
          <div class="image-list-fields">
            <ImageUploadInput
              v-for="(_, i) in form.displayConfig.detailGallery"
              :key="'gallery-' + i"
              v-model="form.displayConfig.detailGallery[i]"
              :placeholder="`固定展示图 ${i + 1}`"
            />
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="categoryModalVisible" title="分类管理" :footer="false" @cancel="categoryModalVisible = false">
      <a-list :bordered="false" :max-height="400">
        <a-list-item v-for="cat in categories" :key="cat.id">
          <a-space direction="vertical" fill :size="6">
            <a-space>
              <a-input v-model="cat.name" :style="{ width: '150px' }" placeholder="分类名" />
              <a-input-number v-model="cat.sort" :min="0" :style="{ width: '90px' }" placeholder="排序" />
              <a-button size="mini" type="primary" @click="onSaveCategory(cat)">保存</a-button>
              <a-popconfirm content="删除该分类？其下花型将变为未分类" @ok="onDeleteCategory(cat.id)">
                <a-button size="mini" status="danger">删除</a-button>
              </a-popconfirm>
            </a-space>
            <a-textarea
              :model-value="cat.description ?? ''"
              @update:model-value="(v: string) => (cat.description = v)"
              :max-length="255"
              :auto-size="{ minRows: 1, maxRows: 3 }"
              placeholder="风格描述（发现页该分类下展示，可空）"
              :style="{ width: '420px' }"
            />
          </a-space>
        </a-list-item>
        <template #empty><a-empty description="暂无分类" /></template>
      </a-list>
      <a-divider :margin="12" />
      <a-space direction="vertical" :size="8">
        <a-space>
          <a-input v-model="categoryForm.name" placeholder="新分类名，如 节气 / 国潮" :style="{ width: '150px' }" />
          <a-input-number v-model="categoryForm.sort" :min="0" :style="{ width: '90px' }" placeholder="排序" />
          <a-button type="primary" @click="onCreateCategory">
            <template #icon><icon-plus /></template>
            新增分类
          </a-button>
        </a-space>
        <a-textarea
          v-model="categoryForm.description"
          :max-length="255"
          :auto-size="{ minRows: 1, maxRows: 3 }"
          placeholder="风格描述（可空）"
          :style="{ width: '420px' }"
        />
      </a-space>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onActivated, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import ImageUploadInput from '@/components/ImageUploadInput.vue'
import {
  listPatterns, listCategories, createPattern, updatePattern, deletePattern,
  createCategory, updateCategory, deleteCategory,
  type Pattern, type PatternCategory, type PatternDisplayConfig,
} from '@/api/patterns'
import { listTags, getPatternTagIds, setPatternTags, type Tag } from '@/api/tags'

const list = ref<Pattern[]>([])
const categories = ref<PatternCategory[]>([])
const sceneTags = ref<Tag[]>([])
const styleTags = ref<Tag[]>([])
const themeTags = ref<Tag[]>([])
// 编辑表单中选中的标签 id（场景 / 风格 / 主题 分开维护，提交时合并）
const selectedSceneIds = ref<number[]>([])
const selectedStyleIds = ref<number[]>([])
const selectedThemeIds = ref<number[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(18)
const categoryId = ref<number | undefined>()
const keyword = ref('')
const modalVisible = ref(false)
const editing = ref<Pattern | null>(null)
type PatternForm = {
  name: string
  imageUrl: string
  thumbUrl: string
  categoryId?: number
  displayConfig: Required<Record<'feedTitle' | 'feedCover' | 'detailTitle' | 'detailDescription', string>> & {
    detailSlides: string[]
    detailGallery: string[]
  }
}

const form = reactive<PatternForm>({
  name: '',
  imageUrl: '',
  thumbUrl: '',
  categoryId: undefined,
  displayConfig: {
    feedTitle: '',
    feedCover: '',
    detailTitle: '',
    detailDescription: '',
    detailSlides: ['', '', '', ''],
    detailGallery: ['', '', ''],
  },
})
const categoryModalVisible = ref(false)
const categoryForm = reactive<{ name: string; description: string; sort: number }>({ name: '', description: '', sort: 0 })

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
  Object.assign(form, {
    name: '',
    imageUrl: '',
    thumbUrl: '',
    categoryId: undefined,
    displayConfig: {
      feedTitle: '',
      feedCover: '',
      detailTitle: '',
      detailDescription: '',
      detailSlides: ['', '', '', ''],
      detailGallery: ['', '', ''],
    },
  })
  selectedSceneIds.value = []
  selectedStyleIds.value = []
  selectedThemeIds.value = []
}

function openCreate() {
  editing.value = null
  resetForm()
  modalVisible.value = true
}

async function openEdit(p: Pattern) {
  editing.value = p
  Object.assign(form, {
    name: p.name, imageUrl: p.image_url, thumbUrl: p.thumb_url || '', categoryId: p.category_id ?? undefined,
    displayConfig: normalizeFormDisplayConfig(p.display_config),
  })
  selectedSceneIds.value = []
  selectedStyleIds.value = []
  selectedThemeIds.value = []
  modalVisible.value = true
  // 回显该花型已绑定的标签（按场景/风格/主题拆分到对应选择器）
  try {
    const ids = (await getPatternTagIds(p.id)).data || []
    const sceneSet = new Set(sceneTags.value.map((t) => t.id))
    const styleSet = new Set(styleTags.value.map((t) => t.id))
    const themeSet = new Set(themeTags.value.map((t) => t.id))
    selectedSceneIds.value = ids.filter((id) => sceneSet.has(id))
    selectedStyleIds.value = ids.filter((id) => styleSet.has(id))
    selectedThemeIds.value = ids.filter((id) => themeSet.has(id))
  } catch {
    /* 取标签失败不阻断编辑 */
  }
}

function normalizeFormDisplayConfig(config?: PatternDisplayConfig | null): PatternForm['displayConfig'] {
  return {
    feedTitle: config?.feedTitle || '',
    feedCover: config?.feedCover || '',
    detailTitle: config?.detailTitle || '',
    detailDescription: config?.detailDescription || '',
    detailSlides: [...(config?.detailSlides || []), '', '', '', ''].slice(0, 4),
    detailGallery: [...(config?.detailGallery || []), '', '', ''].slice(0, 3),
  }
}

function trimText(value: string): string | undefined {
  const text = value.trim()
  return text || undefined
}

function buildDisplayConfig(): PatternDisplayConfig | null {
  const cfg: PatternDisplayConfig = {}
  const feedTitle = trimText(form.displayConfig.feedTitle)
  const feedCover = trimText(form.displayConfig.feedCover)
  const detailTitle = trimText(form.displayConfig.detailTitle)
  const detailDescription = trimText(form.displayConfig.detailDescription)
  const detailSlides = form.displayConfig.detailSlides.map((u) => u.trim()).filter(Boolean)
  const detailGallery = form.displayConfig.detailGallery.map((u) => u.trim()).filter(Boolean).slice(0, 3)
  if (feedTitle) cfg.feedTitle = feedTitle
  if (feedCover) cfg.feedCover = feedCover
  if (detailTitle) cfg.detailTitle = detailTitle
  if (detailDescription) cfg.detailDescription = detailDescription
  if (detailSlides.length) cfg.detailSlides = detailSlides
  if (detailGallery.length) cfg.detailGallery = detailGallery
  return Object.keys(cfg).length ? cfg : null
}

async function onSubmit(): Promise<boolean> {
  if (!form.name || !form.imageUrl) {
    Message.warning('名称和图片 URL 必填')
    return false
  }
  try {
    let patternId: number
    if (editing.value) {
      await updatePattern(editing.value.id, {
        name: form.name, imageUrl: form.imageUrl, thumbUrl: form.thumbUrl, categoryId: form.categoryId ?? null, displayConfig: buildDisplayConfig(),
      })
      patternId = editing.value.id
      Message.success('已更新')
    } else {
      const res = await createPattern({
        name: form.name, imageUrl: form.imageUrl, thumbUrl: form.thumbUrl || undefined, categoryId: form.categoryId, displayConfig: buildDisplayConfig(),
      })
      patternId = res.data.id
      Message.success('已创建')
    }
    // 覆盖式保存标签关联（场景 + 风格 + 主题合并）
    await setPatternTags(patternId, [...selectedSceneIds.value, ...selectedStyleIds.value, ...selectedThemeIds.value])
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
  await createCategory({ name: categoryForm.name.trim(), description: categoryForm.description.trim() || undefined, sort: categoryForm.sort })
  Message.success('分类已创建')
  Object.assign(categoryForm, { name: '', description: '', sort: 0 })
  await refreshCategories()
}

async function onSaveCategory(cat: PatternCategory) {
  if (!cat.name?.trim()) {
    Message.warning('分类名不能为空')
    return
  }
  await updateCategory(cat.id, { name: cat.name.trim(), description: (cat.description ?? '').trim() || null, sort: cat.sort })
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
  const [cats, scene, style, theme] = await Promise.all([
    listCategories(),
    listTags('scene'),
    listTags('style'),
    listTags('theme'),
  ])
  categories.value = cats.data
  sceneTags.value = scene.data
  styleTags.value = style.data
  themeTags.value = theme.data
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
.image-list-fields {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
