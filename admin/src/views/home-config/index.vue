<template>
  <div class="page-container">
    <div class="page-toolbar">
      <div>
        <h2>首页主题配置</h2>
        <p class="sub">统一管理首页「主题随心订」、每个主题下的多张底部轮播图，以及每张轮播对应的详情页。</p>
      </div>
      <a-space>
        <a-button @click="fetchAll">
          <template #icon><icon-refresh /></template>刷新
        </a-button>
        <a-button type="primary" @click="openCreateTheme">
          <template #icon><icon-plus /></template>新增主题
        </a-button>
      </a-space>
    </div>

    <a-spin :loading="loading" style="width: 100%">
      <div class="config-shell">
        <aside class="theme-list">
          <a-empty v-if="themes.length === 0" description="暂无主题，请新增" />
          <button
            v-for="t in themes"
            :key="t.id"
            type="button"
            :class="['theme-item', { active: t.id === activeThemeId }]"
            @click="selectTheme(t.id)"
          >
            <img v-if="t.cover" :src="t.cover" alt="" />
            <span v-else class="theme-fallback">{{ (t.title || '主').slice(0, 1) }}</span>
            <span class="theme-name">{{ t.title || '未命名主题' }}</span>
          </button>
        </aside>

        <main class="config-main">
          <a-empty v-if="!activeTheme" description="请选择或新增一个主题" />
          <template v-else>
            <a-card class="section-card" :bordered="true">
              <template #title>
                <a-space>
                  <span>主题随心订</span>
                  <a-tag color="arcoblue">首页主题卡片</a-tag>
                </a-space>
              </template>
              <template #extra>
                <a-space>
                  <a-popconfirm content="删除该主题？会同时删除其下的所有轮播图。" @ok="deleteActiveTheme">
                    <a-button size="small" status="danger">删除主题</a-button>
                  </a-popconfirm>
                  <a-button size="small" type="primary" :loading="saving" @click="saveTheme">保存主题</a-button>
                </a-space>
              </template>

              <a-form :model="themeForm" layout="vertical">
                <div class="form-grid">
                  <a-form-item label="主题名称">
                    <a-input v-model="themeForm.title" placeholder="如 敦煌入梦" />
                  </a-form-item>
                  <a-form-item label="主题ID">
                    <a-input v-model="themeForm.id" placeholder="英文/拼音唯一标识，如 dunhuang" />
                  </a-form-item>
                  <a-form-item label="英文副标题">
                    <a-input v-model="themeForm.en" placeholder="如 DUN HUANG" />
                  </a-form-item>
                </div>
                <a-form-item label="主题卡片图">
                  <ImageUploadInput v-model="themeForm.cover" placeholder="主题卡片封面图 URL" />
                </a-form-item>
                <a-form-item label="主题背景（无图时显示）">
                  <a-input v-model="themeForm.bg" placeholder="如 linear-gradient(135deg,#E8D5B8,#D4C09A)" />
                </a-form-item>
              </a-form>
            </a-card>

            <a-card class="section-card" :bordered="true">
              <template #title>
                <a-space>
                  <span>该主题下的底部轮播图</span>
                  <a-tag color="green">{{ records.length }} 张</a-tag>
                </a-space>
              </template>
              <template #extra>
                <a-button type="primary" size="small" @click="openCreateRecord">
                  <template #icon><icon-plus /></template>新增轮播图
                </a-button>
              </template>

              <a-empty v-if="records.length === 0" description="该主题下暂无轮播图，点击新增轮播图" />
              <div v-else class="record-grid">
                <a-card v-for="c in records" :key="c.id" hoverable :body-style="{ padding: '10px' }">
                  <template #cover>
                    <img :src="(c.cover as string) || ''" class="record-img" alt="" :style="{ background: (c.bg as string) || '' }" />
                  </template>
                  <div class="record-title">{{ c.title || '未命名轮播' }}</div>
                  <div class="record-sub">
                    详情图 {{ (c.detailSlides as string[] | undefined)?.length || 0 }} / 展示图 {{ (c.detailGallery as string[] | undefined)?.length || 0 }}
                  </div>
                  <div class="record-actions">
                    <a-button type="text" size="mini" @click="openEditRecord(c)">编辑</a-button>
                    <a-popconfirm content="删除该轮播图？" @ok="deleteRecord(c.id)">
                      <a-button type="text" status="danger" size="mini">删除</a-button>
                    </a-popconfirm>
                  </div>
                </a-card>
              </div>
            </a-card>
          </template>
        </main>
      </div>
    </a-spin>

    <a-modal
      v-model:visible="themeModalVisible"
      title="新增主题"
      :on-before-ok="submitThemeModal"
      @cancel="themeModalVisible = false"
    >
      <a-form :model="newTheme" layout="vertical">
        <a-form-item label="主题名称"><a-input v-model="newTheme.title" placeholder="如 敦煌入梦" /></a-form-item>
        <a-form-item label="主题ID"><a-input v-model="newTheme.id" placeholder="英文/拼音唯一标识" /></a-form-item>
        <a-form-item label="英文副标题"><a-input v-model="newTheme.en" placeholder="如 DUN HUANG" /></a-form-item>
        <a-form-item label="主题卡片图"><ImageUploadInput v-model="newTheme.cover" /></a-form-item>
        <a-form-item label="主题背景（无图时显示）"><a-input v-model="newTheme.bg" placeholder="渐变色，可留空" /></a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="recordModalVisible"
      :title="recordEditing ? '编辑轮播图和详情页' : '新增轮播图和详情页'"
      width="860px"
      :on-before-ok="submitRecord"
      @cancel="recordModalVisible = false"
    >
      <a-form :model="recordForm" layout="vertical">
        <a-divider orientation="left">底部轮播展示</a-divider>
        <div class="form-grid two">
          <a-form-item label="轮播标题"><a-input v-model="recordForm.title" placeholder="如 敦煌九色鹿" /></a-form-item>
          <a-form-item label="轮播封面图"><ImageUploadInput v-model="recordForm.cover" /></a-form-item>
        </div>
        <a-form-item label="轮播背景（无图时显示）">
          <a-input v-model="recordForm.bg" placeholder="渐变色，可留空" />
        </a-form-item>

        <a-divider orientation="left">对应详情页</a-divider>
        <a-form-item label="详情标题"><a-input v-model="recordForm.detailTitle" placeholder="留空则用轮播标题" /></a-form-item>
        <a-form-item label="详情描述">
          <a-textarea v-model="recordForm.detailDescription" placeholder="可多行" :auto-size="{ minRows: 2, maxRows: 5 }" />
        </a-form-item>
        <a-form-item label="详情轮播图">
          <div class="image-list">
            <div v-for="(_, i) in recordForm.detailSlides" :key="`slide-${i}`" class="image-row">
              <ImageUploadInput v-model="recordForm.detailSlides[i]" :placeholder="`轮播图 ${i + 1}`" />
              <a-button size="mini" status="danger" @click="removeImage('detailSlides', i)">删除</a-button>
            </div>
          </div>
          <a-button size="small" type="outline" class="add-image-btn" @click="addImage('detailSlides')">
            <template #icon><icon-plus /></template>新增轮播图
          </a-button>
        </a-form-item>
        <a-form-item label="设计展示图（最多三张）">
          <div class="image-list">
            <div v-for="(_, i) in recordForm.detailGallery" :key="`gallery-${i}`" class="image-row">
              <ImageUploadInput v-model="recordForm.detailGallery[i]" :placeholder="`设计展示图 ${i + 1}`" />
              <a-button size="mini" status="danger" @click="removeImage('detailGallery', i)">删除</a-button>
            </div>
          </div>
          <a-button
            size="small"
            type="outline"
            class="add-image-btn"
            :disabled="recordForm.detailGallery.length >= 3"
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
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import ImageUploadInput from '@/components/ImageUploadInput.vue'
import { getConfig, updateConfigValue, type ConfigItem } from '@/api/config'

const themes = ref<ConfigItem[]>([])
const cases = ref<ConfigItem[]>([])
const themesStatus = ref(1)
const casesStatus = ref(1)
const activeThemeId = ref<string | null>(null)
const loading = ref(false)
const saving = ref(false)
const themeModalVisible = ref(false)
const recordModalVisible = ref(false)
const recordEditing = ref<ConfigItem | null>(null)

const themeForm = reactive({ id: '', title: '', en: '', cover: '', bg: '' })
const newTheme = reactive({ id: '', title: '', en: '', cover: '', bg: 'linear-gradient(135deg,#E8D5B8,#D4C09A)' })
const recordForm = reactive({
  id: '',
  title: '',
  cover: '',
  bg: '',
  detailTitle: '',
  detailDescription: '',
  detailSlides: [] as string[],
  detailGallery: [] as string[],
})

const activeTheme = computed(() => themes.value.find((t) => t.id === activeThemeId.value) || null)
const records = computed(() => cases.value.filter((c) => String(c.themeKey || '') === String(activeThemeId.value || '')))

watch(activeTheme, (t) => {
  if (!t) return
  Object.assign(themeForm, {
    id: String(t.id || ''),
    title: String(t.title || ''),
    en: String(t.en || ''),
    cover: String(t.cover || ''),
    bg: String(t.bg || ''),
  })
})

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}

async function fetchAll() {
  loading.value = true
  try {
    const [themesRes, casesRes] = await Promise.all([
      getConfig('home_themes').catch(() => null),
      getConfig('home_cases').catch(() => null),
    ])
    themes.value = (themesRes?.data?.value as ConfigItem[]) || []
    cases.value = (casesRes?.data?.value as ConfigItem[]) || []
    themesStatus.value = themesRes?.data?.status ?? 1
    casesStatus.value = casesRes?.data?.status ?? 1
    if (!activeThemeId.value || !themes.value.some((t) => t.id === activeThemeId.value)) {
      activeThemeId.value = (themes.value[0]?.id as string) ?? null
    }
  } finally {
    loading.value = false
  }
}

function selectTheme(id: string) {
  activeThemeId.value = id
}

async function persist() {
  await Promise.all([
    updateConfigValue('home_themes', themes.value, themesStatus.value),
    updateConfigValue('home_cases', cases.value, casesStatus.value),
  ])
}

function openCreateTheme() {
  Object.assign(newTheme, { id: '', title: '', en: '', cover: '', bg: 'linear-gradient(135deg,#E8D5B8,#D4C09A)' })
  themeModalVisible.value = true
}

async function submitThemeModal(): Promise<boolean> {
  const id = newTheme.id.trim() || genId('theme')
  const title = newTheme.title.trim()
  if (!title) {
    Message.warning('主题名称必填')
    return false
  }
  if (themes.value.some((t) => String(t.id) === id)) {
    Message.warning('主题 ID 已存在')
    return false
  }
  try {
    themes.value.push({ id, title, en: newTheme.en.trim(), cover: newTheme.cover.trim(), bg: newTheme.bg.trim() })
    await persist()
    activeThemeId.value = id
    Message.success('已新增主题')
    await fetchAll()
    return true
  } catch {
    return false
  }
}

async function saveTheme() {
  if (!activeTheme.value) return
  const id = themeForm.id.trim()
  const title = themeForm.title.trim()
  if (!id || !title) {
    Message.warning('主题 ID 和名称必填')
    return
  }
  if (themes.value.some((t) => String(t.id) === id && t.id !== activeThemeId.value)) {
    Message.warning('主题 ID 已存在')
    return
  }
  saving.value = true
  try {
    const oldId = String(activeThemeId.value)
    const idx = themes.value.findIndex((t) => t.id === activeThemeId.value)
    if (idx >= 0) {
      themes.value[idx] = { ...themes.value[idx], id, title, en: themeForm.en.trim(), cover: themeForm.cover.trim(), bg: themeForm.bg.trim() }
    }
    if (oldId !== id) {
      cases.value = cases.value.map((c) => (String(c.themeKey || '') === oldId ? { ...c, themeKey: id } : c))
    }
    await persist()
    activeThemeId.value = id
    Message.success('主题已保存')
    await fetchAll()
  } finally {
    saving.value = false
  }
}

async function deleteActiveTheme() {
  if (!activeThemeId.value) return
  const id = String(activeThemeId.value)
  themes.value = themes.value.filter((t) => t.id !== activeThemeId.value)
  cases.value = cases.value.filter((c) => String(c.themeKey || '') !== id)
  await persist()
  Message.success('已删除主题及其轮播图')
  activeThemeId.value = (themes.value[0]?.id as string) ?? null
  await fetchAll()
}

type ImageListKey = 'detailSlides' | 'detailGallery'

function addImage(key: ImageListKey) {
  if (key === 'detailGallery' && recordForm.detailGallery.length >= 3) {
    Message.warning('设计展示图最多三张')
    return
  }
  recordForm[key].push('')
}

function removeImage(key: ImageListKey, index: number) {
  recordForm[key].splice(index, 1)
}

function openCreateRecord() {
  if (!activeTheme.value) {
    Message.warning('请先选择主题')
    return
  }
  recordEditing.value = null
  Object.assign(recordForm, {
    id: '',
    title: '',
    cover: '',
    bg: 'linear-gradient(180deg,#C8B89A,#d4b796)',
    detailTitle: '',
    detailDescription: '',
    detailSlides: [''],
    detailGallery: [''],
  })
  recordModalVisible.value = true
}

function openEditRecord(c: ConfigItem) {
  recordEditing.value = c
  Object.assign(recordForm, {
    id: String(c.id || ''),
    title: String(c.title || ''),
    cover: String(c.cover || ''),
    bg: String(c.bg || ''),
    detailTitle: String((c.detailTitle as string) || ''),
    detailDescription: String((c.detailDescription as string) || ''),
    detailSlides: [...((c.detailSlides as string[]) || []), ''].slice(0, 8),
    detailGallery: [...((c.detailGallery as string[]) || []), ''].slice(0, 3),
  })
  recordModalVisible.value = true
}

function buildRecord(): ConfigItem {
  const detailSlides = recordForm.detailSlides.map((u) => u.trim()).filter(Boolean)
  const detailGallery = recordForm.detailGallery.map((u) => u.trim()).filter(Boolean).slice(0, 3)
  const item: ConfigItem = {
    id: recordForm.id || genId('case'),
    themeKey: String(activeThemeId.value || ''),
    title: recordForm.title.trim(),
    cover: recordForm.cover.trim(),
    bg: recordForm.bg.trim(),
    link: '/pkg/detail/index',
  }
  const detailTitle = recordForm.detailTitle.trim()
  const detailDescription = recordForm.detailDescription.trim()
  if (detailTitle) item.detailTitle = detailTitle
  if (detailDescription) item.detailDescription = detailDescription
  if (detailSlides.length) item.detailSlides = detailSlides
  if (detailGallery.length) item.detailGallery = detailGallery
  return item
}

async function submitRecord(): Promise<boolean> {
  if (!activeThemeId.value) {
    Message.warning('请先选择主题')
    return false
  }
  if (!recordForm.title.trim() || !recordForm.cover.trim()) {
    Message.warning('轮播标题和封面图必填')
    return false
  }
  try {
    const item = buildRecord()
    if (recordEditing.value) {
      const idx = cases.value.findIndex((c) => c.id === recordEditing.value!.id)
      if (idx >= 0) cases.value[idx] = item
      else cases.value.push(item)
    } else {
      cases.value.push(item)
    }
    await persist()
    Message.success(recordEditing.value ? '轮播图已更新' : '轮播图已创建')
    await fetchAll()
    return true
  } catch {
    return false
  }
}

async function deleteRecord(id: string) {
  cases.value = cases.value.filter((c) => c.id !== id)
  await persist()
  Message.success('已删除轮播图')
  await fetchAll()
}

onMounted(fetchAll)
onActivated(fetchAll)
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
