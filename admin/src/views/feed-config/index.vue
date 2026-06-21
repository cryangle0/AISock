<template>
  <div class="page-container">
    <div class="page-toolbar">
      <div>
        <h2>浏览页配置</h2>
        <p class="sub">统一管理浏览页 Tab、Banner、说明文字、Tab 下记录，以及每条记录对应的详情页。</p>
      </div>
      <a-space>
        <a-button @click="fetchThemes">
          <template #icon><icon-refresh /></template>刷新
        </a-button>
        <a-button type="primary" @click="openCreateTheme">
          <template #icon><icon-plus /></template>新增 Tab
        </a-button>
      </a-space>
    </div>

    <a-spin :loading="loadingThemes" style="width: 100%">
      <div class="config-shell">
        <aside class="theme-list">
          <a-empty v-if="themes.length === 0" description="暂无 Tab，请新增" />
          <button
            v-for="t in themes"
            :key="t.id"
            type="button"
            :class="['theme-item', { active: t.id === activeThemeId }]"
            @click="selectTheme(t.id)"
          >
            <img v-if="t.icon_url" :src="t.icon_url" alt="" />
            <span v-else class="theme-fallback">{{ t.name.slice(0, 1) }}</span>
            <span class="theme-name">{{ t.name }}</span>
            <a-tag v-if="t.status !== 1" size="small" color="gray">停用</a-tag>
          </button>
        </aside>

        <main class="config-main">
          <a-empty v-if="!activeTheme" description="请选择或新增一个 Tab" />
          <template v-else>
            <a-card class="section-card" :bordered="true">
              <template #title>
                <a-space>
                  <span>Tab / Banner / 下方文字</span>
                  <a-tag color="arcoblue">浏览页顶部配置</a-tag>
                </a-space>
              </template>
              <template #extra>
                <a-space>
                  <a-popconfirm content="删除该 Tab？会同时解除其下记录与该 Tab 的关联。" @ok="deleteActiveTheme">
                    <a-button size="small" status="danger">删除 Tab</a-button>
                  </a-popconfirm>
                  <a-button size="small" type="primary" :loading="savingTheme" @click="saveTheme">保存 Tab</a-button>
                </a-space>
              </template>

              <a-form :model="themeForm" layout="vertical">
                <div class="form-grid">
                  <a-form-item label="Tab 名称">
                    <a-input v-model="themeForm.name" placeholder="如 竹影轻柔" />
                  </a-form-item>
                  <a-form-item label="Tab code">
                    <a-input v-model="themeForm.code" placeholder="如 bamboo" />
                  </a-form-item>
                  <a-form-item label="排序">
                    <a-input-number v-model="themeForm.sort" :min="0" />
                  </a-form-item>
                  <a-form-item label="状态">
                    <a-switch v-model="themeForm.status" :checked-value="1" :unchecked-value="0" />
                  </a-form-item>
                </div>
                <a-form-item label="Banner 图">
                  <ImageUploadInput v-model="themeForm.iconUrl" placeholder="该 Tab 对应的 Banner 大图 URL" />
                </a-form-item>
                <a-form-item label="下方说明文字">
                  <a-textarea
                    v-model="themeForm.description"
                    placeholder="显示在 Banner 下方的说明，可多行"
                    :auto-size="{ minRows: 2, maxRows: 5 }"
                  />
                </a-form-item>
              </a-form>
            </a-card>

            <a-card class="section-card" :bordered="true">
              <template #title>
                <a-space>
                  <span>该 Tab 下的记录</span>
                  <a-tag color="green">{{ records.length }} 条</a-tag>
                </a-space>
              </template>
              <template #extra>
                <a-button type="primary" size="small" @click="openCreateRecord">
                  <template #icon><icon-plus /></template>新增记录
                </a-button>
              </template>

              <a-spin :loading="loadingRecords" style="width: 100%">
                <a-empty v-if="records.length === 0" description="该 Tab 下暂无记录，点击新增记录" />
                <div v-else class="record-grid">
                  <a-card v-for="p in records" :key="p.id" hoverable :body-style="{ padding: '10px' }">
                    <template #cover>
                      <img :src="p.display_config?.feedCover || p.thumb_url || p.image_url" class="record-img" alt="" />
                    </template>
                    <div class="record-title">{{ p.display_config?.feedTitle || p.name }}</div>
                    <div class="record-sub">详情图 {{ p.display_config?.detailSlides?.length || 0 }} / 展示图 {{ p.display_config?.detailGallery?.length || 0 }}</div>
                    <div class="record-actions">
                      <a-button type="text" size="mini" @click="openEditRecord(p)">编辑</a-button>
                      <a-popconfirm content="删除该记录？" @ok="deleteRecord(p.id)">
                        <a-button type="text" status="danger" size="mini">删除</a-button>
                      </a-popconfirm>
                    </div>
                  </a-card>
                </div>
              </a-spin>
            </a-card>
          </template>
        </main>
      </div>
    </a-spin>

    <a-modal
      v-model:visible="themeModalVisible"
      :title="themeEditing ? '编辑 Tab' : '新增 Tab'"
      :on-before-ok="submitThemeModal"
      @cancel="themeModalVisible = false"
    >
      <a-form :model="themeForm" layout="vertical">
        <a-form-item label="Tab 名称"><a-input v-model="themeForm.name" /></a-form-item>
        <a-form-item label="code"><a-input v-model="themeForm.code" placeholder="英文/拼音唯一标识" /></a-form-item>
        <a-form-item label="Banner 图"><ImageUploadInput v-model="themeForm.iconUrl" /></a-form-item>
        <a-form-item label="下方说明文字">
          <a-textarea v-model="themeForm.description" :auto-size="{ minRows: 2, maxRows: 5 }" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="recordModalVisible"
      :title="recordEditing ? '编辑记录和详情页' : '新增记录和详情页'"
      width="860px"
      :on-before-ok="submitRecord"
      @cancel="recordModalVisible = false"
    >
      <a-form :model="recordForm" layout="vertical">
        <a-divider orientation="left">基础记录</a-divider>
        <div class="form-grid two">
          <a-form-item label="记录名称"><a-input v-model="recordForm.name" /></a-form-item>
          <a-form-item label="原始主图"><ImageUploadInput v-model="recordForm.imageUrl" /></a-form-item>
          <a-form-item label="缩略图"><ImageUploadInput v-model="recordForm.thumbUrl" placeholder="留空则用主图" /></a-form-item>
        </div>

        <a-divider orientation="left">浏览页卡片展示</a-divider>
        <div class="form-grid two">
          <a-form-item label="条目名称"><a-input v-model="recordForm.displayConfig.feedTitle" placeholder="留空则用记录名称" /></a-form-item>
          <a-form-item label="条目背景图"><ImageUploadInput v-model="recordForm.displayConfig.feedCover" placeholder="留空则用主图" /></a-form-item>
        </div>

        <a-divider orientation="left">对应详情页</a-divider>
        <a-form-item label="详情标题"><a-input v-model="recordForm.displayConfig.detailTitle" placeholder="留空则用默认标题" /></a-form-item>
        <a-form-item label="详情描述">
          <a-textarea v-model="recordForm.displayConfig.detailDescription" :auto-size="{ minRows: 2, maxRows: 5 }" />
        </a-form-item>
        <a-form-item label="详情轮播图">
          <div class="image-list">
            <div
              v-for="(_, i) in recordForm.displayConfig.detailSlides"
              :key="`slide-${i}`"
              class="image-row"
            >
              <ImageUploadInput
                v-model="recordForm.displayConfig.detailSlides[i]"
                :placeholder="`轮播图 ${i + 1}`"
              />
              <a-button size="mini" status="danger" @click="removeImage('detailSlides', i)">删除</a-button>
            </div>
          </div>
          <a-button size="small" type="outline" class="add-image-btn" @click="addImage('detailSlides')">
            <template #icon><icon-plus /></template>新增轮播图
          </a-button>
        </a-form-item>
        <a-form-item label="设计展示图（最多三张）">
          <div class="image-list">
            <div
              v-for="(_, i) in recordForm.displayConfig.detailGallery"
              :key="`gallery-${i}`"
              class="image-row"
            >
              <ImageUploadInput
                v-model="recordForm.displayConfig.detailGallery[i]"
                :placeholder="`设计展示图 ${i + 1}`"
              />
              <a-button size="mini" status="danger" @click="removeImage('detailGallery', i)">删除</a-button>
            </div>
          </div>
          <a-button
            size="small"
            type="outline"
            class="add-image-btn"
            :disabled="recordForm.displayConfig.detailGallery.length >= 3"
            @click="addImage('detailGallery')"
          >
            <template #icon><icon-plus /></template>新增展示图
          </a-button>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import ImageUploadInput from '@/components/ImageUploadInput.vue'
import { listTags, createTag, updateTag, deleteTag, getPatternTagIds, setPatternTags, type Tag } from '@/api/tags'
import { listPatterns, createPattern, updatePattern, deletePattern, type Pattern, type PatternDisplayConfig } from '@/api/patterns'

const themes = ref<Tag[]>([])
const records = ref<Pattern[]>([])
const activeThemeId = ref<number | null>(null)
const loadingThemes = ref(false)
const loadingRecords = ref(false)
const savingTheme = ref(false)
const themeModalVisible = ref(false)
const themeEditing = ref(false)
const recordModalVisible = ref(false)
const recordEditing = ref<Pattern | null>(null)

const themeForm = reactive({
  code: '',
  name: '',
  description: '',
  iconUrl: '',
  sort: 0,
  status: 1,
})

const recordForm = reactive({
  name: '',
  imageUrl: '',
  thumbUrl: '',
  displayConfig: {
    feedTitle: '',
    feedCover: '',
    detailTitle: '',
    detailDescription: '',
    detailSlides: ['', '', '', ''],
    detailGallery: ['', '', ''],
  },
})

const activeTheme = computed(() => themes.value.find((t) => t.id === activeThemeId.value) || null)
const themeIdSet = computed(() => new Set(themes.value.map((t) => t.id)))

watch(activeTheme, (t) => {
  if (!t) return
  Object.assign(themeForm, {
    code: t.code,
    name: t.name,
    description: t.description || '',
    iconUrl: t.icon_url || '',
    sort: t.sort,
    status: t.status,
  })
  fetchRecords()
}, { immediate: false })

async function fetchThemes() {
  loadingThemes.value = true
  try {
    const res = await listTags('theme')
    themes.value = res.data
    if (!activeThemeId.value || !themes.value.some((t) => t.id === activeThemeId.value)) {
      activeThemeId.value = themes.value[0]?.id ?? null
    } else {
      await fetchRecords()
    }
  } finally {
    loadingThemes.value = false
  }
}

function selectTheme(id: number) {
  if (activeThemeId.value === id) return
  activeThemeId.value = id
}

async function fetchRecords() {
  if (!activeThemeId.value) {
    records.value = []
    return
  }
  loadingRecords.value = true
  try {
    const res = await listPatterns({ pageNum: 1, pageSize: 100, themeIds: [activeThemeId.value] })
    records.value = res.data.list
  } finally {
    loadingRecords.value = false
  }
}

function openCreateTheme() {
  themeEditing.value = false
  Object.assign(themeForm, { code: '', name: '', description: '', iconUrl: '', sort: themes.value.length * 10, status: 1 })
  themeModalVisible.value = true
}

async function submitThemeModal(): Promise<boolean> {
  if (!themeForm.code.trim() || !themeForm.name.trim()) {
    Message.warning('Tab 名称和 code 必填')
    return false
  }
  try {
    const res = await createTag({
      kind: 'theme',
      code: themeForm.code.trim(),
      name: themeForm.name.trim(),
      description: themeForm.description.trim() || null,
      iconUrl: themeForm.iconUrl.trim() || null,
      sort: themeForm.sort,
      status: themeForm.status,
    })
    activeThemeId.value = res.data.id
    Message.success('已新增 Tab')
    await fetchThemes()
    return true
  } catch {
    return false
  }
}

async function saveTheme() {
  if (!activeTheme.value) return
  if (!themeForm.code.trim() || !themeForm.name.trim()) {
    Message.warning('Tab 名称和 code 必填')
    return
  }
  savingTheme.value = true
  try {
    await updateTag(activeTheme.value.id, {
      code: themeForm.code.trim(),
      name: themeForm.name.trim(),
      description: themeForm.description.trim() || null,
      iconUrl: themeForm.iconUrl.trim() || null,
      sort: themeForm.sort,
      status: themeForm.status,
    })
    Message.success('Tab 配置已保存')
    await fetchThemes()
  } finally {
    savingTheme.value = false
  }
}

async function deleteActiveTheme() {
  if (!activeTheme.value) return
  await deleteTag(activeTheme.value.id)
  Message.success('已删除 Tab，并解除相关记录关联')
  activeThemeId.value = null
  await fetchThemes()
}

function emptyDisplayConfig() {
  return {
    feedTitle: '',
    feedCover: '',
    detailTitle: '',
    detailDescription: '',
    detailSlides: ['', '', '', ''],
    detailGallery: ['', '', ''],
  }
}

function normalizeFormDisplayConfig(config?: PatternDisplayConfig | null) {
  return {
    feedTitle: config?.feedTitle || '',
    feedCover: config?.feedCover || '',
    detailTitle: config?.detailTitle || '',
    detailDescription: config?.detailDescription || '',
    detailSlides: [...(config?.detailSlides || []), '', '', '', ''].slice(0, 4),
    detailGallery: [...(config?.detailGallery || []), '', '', ''].slice(0, 3),
  }
}

type ImageListKey = 'detailSlides' | 'detailGallery'

function addImage(key: ImageListKey) {
  if (key === 'detailGallery' && recordForm.displayConfig.detailGallery.length >= 3) {
    Message.warning('设计展示图最多三张')
    return
  }
  recordForm.displayConfig[key].push('')
}

function removeImage(key: ImageListKey, index: number) {
  recordForm.displayConfig[key].splice(index, 1)
}

function openCreateRecord() {
  if (!activeTheme.value) {
    Message.warning('请先选择 Tab')
    return
  }
  recordEditing.value = null
  Object.assign(recordForm, {
    name: '',
    imageUrl: '',
    thumbUrl: '',
    displayConfig: emptyDisplayConfig(),
  })
  recordModalVisible.value = true
}

function openEditRecord(p: Pattern) {
  recordEditing.value = p
  Object.assign(recordForm, {
    name: p.name,
    imageUrl: p.image_url,
    thumbUrl: p.thumb_url || '',
    displayConfig: normalizeFormDisplayConfig(p.display_config),
  })
  recordModalVisible.value = true
}

function buildDisplayConfig(): PatternDisplayConfig | null {
  const cfg: PatternDisplayConfig = {}
  const feedTitle = recordForm.displayConfig.feedTitle.trim()
  const feedCover = recordForm.displayConfig.feedCover.trim()
  const detailTitle = recordForm.displayConfig.detailTitle.trim()
  const detailDescription = recordForm.displayConfig.detailDescription.trim()
  const detailSlides = recordForm.displayConfig.detailSlides.map((u) => u.trim()).filter(Boolean)
  const detailGallery = recordForm.displayConfig.detailGallery.map((u) => u.trim()).filter(Boolean).slice(0, 3)
  if (feedTitle) cfg.feedTitle = feedTitle
  if (feedCover) cfg.feedCover = feedCover
  if (detailTitle) cfg.detailTitle = detailTitle
  if (detailDescription) cfg.detailDescription = detailDescription
  if (detailSlides.length) cfg.detailSlides = detailSlides
  if (detailGallery.length) cfg.detailGallery = detailGallery
  return Object.keys(cfg).length ? cfg : null
}

async function bindRecordToActiveTheme(patternId: number) {
  if (!activeThemeId.value) return
  const current = recordEditing.value ? ((await getPatternTagIds(patternId)).data || []) : []
  const nonThemeIds = current.filter((id) => !themeIdSet.value.has(id))
  await setPatternTags(patternId, [...nonThemeIds, activeThemeId.value])
}

async function submitRecord(): Promise<boolean> {
  if (!recordForm.name.trim() || !recordForm.imageUrl.trim()) {
    Message.warning('记录名称和原始主图必填')
    return false
  }
  if (!activeThemeId.value) {
    Message.warning('请先选择 Tab')
    return false
  }
  try {
    let patternId: number
    if (recordEditing.value) {
      await updatePattern(recordEditing.value.id, {
        name: recordForm.name.trim(),
        imageUrl: recordForm.imageUrl.trim(),
        thumbUrl: recordForm.thumbUrl.trim() || undefined,
        displayConfig: buildDisplayConfig(),
      })
      patternId = recordEditing.value.id
    } else {
      const res = await createPattern({
        name: recordForm.name.trim(),
        imageUrl: recordForm.imageUrl.trim(),
        thumbUrl: recordForm.thumbUrl.trim() || undefined,
        displayConfig: buildDisplayConfig(),
      })
      patternId = res.data.id
    }
    await bindRecordToActiveTheme(patternId)
    Message.success(recordEditing.value ? '记录已更新' : '记录已创建')
    await fetchRecords()
    return true
  } catch {
    return false
  }
}

async function deleteRecord(id: number) {
  await deletePattern(id)
  Message.success('已删除记录')
  await fetchRecords()
}

onActivated(fetchThemes)
</script>

<style scoped>
.sub {
  color: var(--color-text-3);
  font-size: 12px;
  margin: 4px 0 0;
}
.config-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
}
.theme-list,
.config-main {
  min-height: 640px;
}
.theme-list {
  padding: 12px;
  border-radius: 12px;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
}
.theme-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}
.theme-item + .theme-item {
  margin-top: 8px;
}
.theme-item.active,
.theme-item:hover {
  background: var(--color-fill-2);
  border-color: rgb(var(--primary-6));
}
.theme-item img,
.theme-fallback {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  flex-shrink: 0;
}
.theme-item img {
  object-fit: cover;
}
.theme-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-fill-3);
  color: var(--color-text-2);
  font-weight: 700;
}
.theme-name {
  flex: 1;
  min-width: 0;
  color: var(--color-text-1);
  font-weight: 600;
}
.section-card + .section-card {
  margin-top: 16px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.form-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.record-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
}
.record-img {
  width: 100%;
  height: 128px;
  object-fit: cover;
}
.record-title {
  font-weight: 700;
  color: var(--color-text-1);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.record-sub {
  margin-top: 4px;
  color: var(--color-text-3);
  font-size: 12px;
}
.record-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.image-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.image-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}
.add-image-btn {
  margin-top: 8px;
}
@media (max-width: 1100px) {
  .config-shell {
    grid-template-columns: 1fr;
  }
  .form-grid,
  .form-grid.two {
    grid-template-columns: 1fr;
  }
}
</style>
