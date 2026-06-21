<template>
  <a-card class="block-card" :bordered="true">
    <template #title>
      <a-space>
        <span>首页主题 + 对应轮播图</span>
        <a-tag :color="enabled ? 'green' : 'gray'">{{ enabled ? '启用' : '停用' }}</a-tag>
        <a-tag color="arcoblue">home_themes + home_cases</a-tag>
      </a-space>
    </template>
    <template #extra>
      <a-space>
        <a-switch
          :model-value="enabled ? 1 : 0"
          :checked-value="1"
          :unchecked-value="0"
          @change="(v) => toggleStatus(Number(v))"
        />
        <a-button type="primary" size="small" @click="addRow">
          <template #icon><icon-plus /></template>新增主题
        </a-button>
        <a-button type="primary" size="small" status="success" :loading="saving" @click="save">保存</a-button>
      </a-space>
    </template>

    <p class="block-hint">
      每一行就是首页「主题随心订」的一项，并直接绑定它对应的首页轮播图。新增/删除行会同步新增/删除主题和对应轮播配置。
    </p>

    <a-empty v-if="rows.length === 0" description="暂无主题，点击「新增主题」添加" />

    <div v-else class="linked-list">
      <div v-for="(row, idx) in rows" :key="row.localKey" class="linked-row">
        <div class="row-preview">
          <div class="preview theme-preview" :style="previewStyle(row.theme)">
            <img v-if="row.theme.cover" :src="row.theme.cover" alt="" />
            <span v-else>主题</span>
          </div>
          <div class="preview case-preview" :style="previewStyle(row.caseItem)">
            <img v-if="row.caseItem.cover" :src="row.caseItem.cover" alt="" />
            <span v-else>轮播</span>
          </div>
        </div>

        <div class="fields">
          <a-divider orientation="left" :margin="4">主题随心订</a-divider>
          <a-input v-model="row.theme.id" placeholder="主题ID，如 jieqi" allow-clear class="f f-sm" />
          <a-input v-model="row.theme.title" placeholder="主题名称" allow-clear class="f" />
          <a-input v-model="row.theme.en" placeholder="英文副标题" allow-clear class="f f-sm" />
          <ImageUploadInput v-model="row.theme.cover" placeholder="主题卡片图 URL" class="f f-lg" />
          <a-input v-model="row.theme.bg" placeholder="主题背景（无图时显示）" allow-clear class="f f-lg" />

          <a-divider orientation="left" :margin="4">对应轮播图</a-divider>
          <a-input v-model="row.caseItem.title" placeholder="轮播标题" allow-clear class="f" />
          <ImageUploadInput v-model="row.caseItem.cover" placeholder="轮播封面图 URL" class="f f-lg" />
          <a-input v-model="row.caseItem.bg" placeholder="轮播背景（无图时显示）" allow-clear class="f f-lg" />
          <a-input v-model="row.caseItem.link" placeholder="点击跳转：pattern:52 或 /product/52" allow-clear class="f f-xl" />
        </div>

        <a-space direction="vertical" size="mini" class="ops">
          <a-button size="mini" :disabled="idx === 0" @click="move(idx, -1)"><icon-up /></a-button>
          <a-button size="mini" :disabled="idx === rows.length - 1" @click="move(idx, 1)"><icon-down /></a-button>
          <a-button size="mini" status="danger" @click="remove(idx)"><icon-delete /></a-button>
        </a-space>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { updateConfigValue, type AppConfig, type ConfigItem } from '@/api/config'
import ImageUploadInput from '@/components/ImageUploadInput.vue'

interface LinkedRow {
  localKey: string
  theme: ConfigItem
  caseItem: ConfigItem
}

const props = defineProps<{ themesConfig: AppConfig; casesConfig: AppConfig }>()
const emit = defineEmits<{ saved: [] }>()

const rows = ref<LinkedRow[]>([])
const saving = ref(false)
const enabled = computed(() => props.themesConfig.status === 1 && props.casesConfig.status === 1)

watch(
  () => [props.themesConfig, props.casesConfig] as const,
  ([themesCfg, casesCfg]) => {
    const themes = JSON.parse(JSON.stringify(themesCfg.value || [])) as ConfigItem[]
    const cases = JSON.parse(JSON.stringify(casesCfg.value || [])) as ConfigItem[]
    rows.value = themes.map((theme, idx) => {
      const id = String(theme.id || '').trim()
      const matched = cases.find((c) => String(c.themeKey || '').trim() === id) || cases[idx] || {}
      return {
        localKey: `${id || 'theme'}-${idx}`,
        theme: { ...theme },
        caseItem: { ...matched, themeKey: id },
      }
    })
  },
  { immediate: true, deep: true },
)

function genId() {
  return `theme_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}

function addRow() {
  const id = genId()
  rows.value.push({
    localKey: id,
    theme: {
      id,
      title: '',
      en: '',
      cover: '',
      bg: 'linear-gradient(135deg,#E8D5B8,#D4C09A)',
    },
    caseItem: {
      id: `case_${id}`,
      title: '',
      cover: '',
      bg: 'linear-gradient(180deg,#C8B89A,#d4b796)',
      link: '',
      themeKey: id,
    },
  })
}

function remove(idx: number) {
  rows.value.splice(idx, 1)
}

function move(idx: number, dir: number) {
  const target = idx + dir
  if (target < 0 || target >= rows.value.length) return
  const tmp = rows.value[idx]
  rows.value[idx] = rows.value[target]
  rows.value[target] = tmp
}

function normalizeRow(row: LinkedRow): LinkedRow {
  const themeId = String(row.theme.id || '').trim()
  return {
    ...row,
    theme: {
      ...row.theme,
      id: themeId,
      title: row.theme.title?.trim() || '',
      en: row.theme.en?.trim() || '',
    },
    caseItem: {
      ...row.caseItem,
      id: String(row.caseItem.id || `case_${themeId}`).trim(),
      title: row.caseItem.title?.trim() || row.theme.title?.trim() || '',
      themeKey: themeId,
    },
  }
}

async function save() {
  const normalized = rows.value.map(normalizeRow)
  if (normalized.some((row) => !row.theme.id || !row.theme.title)) {
    Message.warning('每个主题的 ID 和名称都必填')
    return
  }
  const ids = normalized.map((row) => row.theme.id)
  if (new Set(ids).size !== ids.length) {
    Message.warning('主题 ID 不能重复')
    return
  }
  saving.value = true
  try {
    await Promise.all([
      updateConfigValue('home_themes', normalized.map((row) => row.theme), props.themesConfig.status),
      updateConfigValue('home_cases', normalized.map((row) => row.caseItem), props.casesConfig.status),
    ])
    Message.success('已保存：首页主题与对应轮播已同步')
    emit('saved')
  } finally {
    saving.value = false
  }
}

async function toggleStatus(status: number) {
  await Promise.all([
    updateConfigValue('home_themes', props.themesConfig.value, status),
    updateConfigValue('home_cases', props.casesConfig.value, status),
  ])
  Message.success(status === 1 ? '已启用' : '已停用')
  emit('saved')
}

function previewStyle(item: ConfigItem) {
  return { background: item.bg || 'var(--color-fill-2)' }
}
</script>

<style scoped>
.block-card {
  margin-bottom: 20px;
}
.block-hint {
  color: var(--color-primary-light-4);
  font-size: 12px;
  margin: 0 0 12px;
  font-weight: 500;
  line-height: 1.6;
}
.linked-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.linked-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  background: var(--color-fill-1);
}
.row-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.preview {
  width: 72px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  color: var(--color-text-3);
  font-size: 12px;
  box-shadow: inset 0 0 0 1px var(--color-border-2);
}
.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fields {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fields :deep(.arco-divider) {
  flex-basis: 100%;
  margin: 2px 0;
}
.f {
  width: 180px;
}
.f-sm {
  width: 140px;
}
.f-lg {
  width: 260px;
}
.f-xl {
  width: 340px;
}
.ops {
  flex-shrink: 0;
}
</style>
