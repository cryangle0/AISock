<template>
  <a-card class="block-card" :bordered="true">
    <template #title>
      <a-space>
        <span>{{ config.title || config.config_key }}</span>
        <a-tag :color="config.status === 1 ? 'green' : 'gray'">{{ config.status === 1 ? '启用' : '停用' }}</a-tag>
        <a-tag color="arcoblue">{{ config.config_key }}</a-tag>
      </a-space>
    </template>
    <template #extra>
      <a-space>
        <a-switch
          :model-value="config.status"
          :checked-value="1"
          :unchecked-value="0"
          @change="(v) => $emit('toggle-status', Number(v))"
        />
        <a-button type="primary" size="small" @click="addItem">
          <template #icon><icon-plus /></template>新增项
        </a-button>
        <a-button type="primary" size="small" status="success" :loading="saving" @click="save">保存</a-button>
      </a-space>
    </template>

    <p v-if="config.remark" class="block-remark">{{ config.remark }}</p>

    <a-empty v-if="items.length === 0" description="暂无配置项，点击「新增项」添加" />

    <div v-else class="item-list">
      <div v-for="(item, idx) in items" :key="idx" class="item-row">
        <!-- 预览色块 -->
        <div class="preview" :style="previewStyle(item)">
          <span v-if="item.icon" class="preview-icon">{{ item.icon }}</span>
        </div>

        <div class="fields">
          <a-input v-model="item.title" placeholder="标题" allow-clear class="f" />
          <a-input v-if="hasField('en')" v-model="item.en" placeholder="英文副标题" allow-clear class="f" />
          <a-input v-if="hasField('icon')" v-model="item.icon" placeholder="图标 emoji" allow-clear class="f f-sm" />
          <a-input v-if="hasField('bg')" v-model="item.bg" placeholder="背景（CSS 渐变/颜色）" allow-clear class="f f-lg" />
          <a-input v-model="item.link" placeholder="跳转路径，如 /pages/feed/index" allow-clear class="f f-lg" />
        </div>

        <a-space direction="vertical" size="mini" class="ops">
          <a-button size="mini" :disabled="idx === 0" @click="move(idx, -1)"><icon-up /></a-button>
          <a-button size="mini" :disabled="idx === items.length - 1" @click="move(idx, 1)"><icon-down /></a-button>
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

const props = defineProps<{ config: AppConfig }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'toggle-status', status: number): void }>()

const items = ref<ConfigItem[]>([])
const saving = ref(false)

watch(
  () => props.config,
  (cfg) => {
    items.value = JSON.parse(JSON.stringify(cfg.value || []))
  },
  { immediate: true, deep: true },
)

// 根据现有数据推断该配置块包含哪些字段（主题有 en，功能区有 icon，案例只有 bg）
const fieldSet = computed(() => {
  const set = new Set<string>()
  for (const it of props.config.value || []) {
    Object.keys(it).forEach((k) => set.add(k))
  }
  // 兜底：空配置时按 key 给默认字段
  if (set.size === 0) {
    if (props.config.config_key === 'home_zones') ['icon', 'title', 'link'].forEach((k) => set.add(k))
    else if (props.config.config_key === 'home_themes') ['title', 'en', 'bg', 'link'].forEach((k) => set.add(k))
    else ['title', 'bg', 'link'].forEach((k) => set.add(k))
  }
  return set
})
function hasField(f: string) {
  return fieldSet.value.has(f)
}

function previewStyle(item: ConfigItem) {
  return { background: item.bg || 'var(--color-fill-2)' }
}

function genId() {
  return `i${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}

function addItem() {
  const base: ConfigItem = { id: genId(), title: '', link: '' }
  if (hasField('en')) base.en = ''
  if (hasField('icon')) base.icon = '✨'
  if (hasField('bg')) base.bg = 'linear-gradient(135deg,#C9B89A,#B5A085)'
  items.value.push(base)
}

function remove(idx: number) {
  items.value.splice(idx, 1)
}

function move(idx: number, dir: number) {
  const target = idx + dir
  if (target < 0 || target >= items.value.length) return
  const tmp = items.value[idx]
  items.value[idx] = items.value[target]
  items.value[target] = tmp
}

async function save() {
  // 校验：标题必填
  if (items.value.some((it) => !it.title?.trim())) {
    Message.warning('每个配置项的标题都必填')
    return
  }
  saving.value = true
  try {
    await updateConfigValue(props.config.config_key, items.value)
    Message.success('已保存，小程序约 1 分钟内生效')
    emit('saved')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.block-card {
  margin-bottom: 20px;
}
.block-remark {
  color: var(--color-text-3);
  font-size: 12px;
  margin: 0 0 12px;
}
.item-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  background: var(--color-fill-1);
}
.preview {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px var(--color-border-2);
}
.preview-icon {
  font-size: 26px;
}
.fields {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.f {
  width: 180px;
}
.f-sm {
  width: 110px;
}
.f-lg {
  width: 260px;
}
.ops {
  flex-shrink: 0;
}
</style>
