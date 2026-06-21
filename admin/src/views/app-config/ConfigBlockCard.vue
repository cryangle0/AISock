<template>
  <a-card class="block-card" :bordered="true">
    <template #title>
      <a-space>
        <span>{{ displayTitle }}</span>
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

    <p v-if="config.config_key === 'feed_discover'" class="block-hint">
      生效位置：<b>Web「推荐」</b> + 小程序「发现」：页面大标题(nav_title)、每主题展示条数(list_size)、顶部背景与记录卡模特/袜子图；主题 Tab 名/Banner/说明在「标签管理 · 主题」
    </p>
    <p v-else-if="config.config_key === 'home_themes'" class="block-hint">
      首页「主题随心订」三张小卡；<b>id</b> 用来和下方 home_cases 的 themeKey 对应（如 jieqi / dunhuang / wenchuang）
    </p>
    <p v-else-if="config.config_key === 'home_cases'" class="block-hint">
      生效位置：<b>Web 首页「袜版设计预设」</b> + 小程序首页案例轮播；<b>themeKey</b> 对应「主题随心订」的 id，点击主题后切到对应轮播项；link 支持 <code>pattern:52</code> 或 <code>/product/52</code>
    </p>
    <p v-else-if="config.config_key === 'product_detail'" class="block-hint">
      生效位置：浏览页点「查看详情」→ 商品详情页；URL 花型 ID 仅关联「立即购买」，不覆盖本页展示
    </p>
    <p v-if="config.remark" class="block-remark">{{ config.remark }}</p>

    <a-empty v-if="items.length === 0" description="暂无配置项，点击「新增项」添加" />

    <div v-else class="item-list">
      <div v-for="(item, idx) in items" :key="idx" class="item-row">
        <!-- 预览：优先显示封面图，否则显示背景渐变/图标 -->
        <div class="preview" :style="previewStyle(item)">
          <img v-if="item.cover && !isFeedTextSlot(item)" :src="item.cover" class="preview-img" alt="" />
          <span v-else-if="item.icon" class="preview-icon">{{ item.icon }}</span>
          <span v-else-if="isFeedTextSlot(item)" class="preview-text">{{ feedTextPreview(item) }}</span>
        </div>

        <div class="fields">
          <a-input
            v-model="item.title"
            :placeholder="titlePlaceholder(item)"
            allow-clear
            class="f"
          />
          <a-input
            v-if="hasEnField(item)"
            v-model="item.en"
            :placeholder="enPlaceholder(item)"
            allow-clear
            class="f f-sm"
          />
          <a-input v-if="hasField('icon')" v-model="item.icon" placeholder="图标 emoji" allow-clear class="f f-sm" />
          <ImageUploadInput v-if="hasField('cover') && !isFeedTextSlot(item)" v-model="item.cover" :placeholder="coverPlaceholder" class="f f-lg" />
          <a-input v-if="hasField('themeKey')" v-model="item.themeKey" placeholder="关联主题ID，如 jieqi" allow-clear class="f f-sm" />
          <a-textarea
            v-if="hasDescField(item)"
            v-model="item.desc"
            placeholder="商品详情描述（可多行）"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            allow-clear
            class="f f-xl"
          />
          <a-input v-if="hasField('bg') && config.config_key !== 'feed_discover' && config.config_key !== 'product_detail'" v-model="item.bg" placeholder="背景（CSS 渐变/颜色，无封面图时显示）" allow-clear class="f f-lg" />
          <a-input v-if="showLink" v-model="item.link" :placeholder="linkPlaceholder" allow-clear class="f f-lg" />
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
import ImageUploadInput from '@/components/ImageUploadInput.vue'

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
  // 兜底：空配置时按 key 给默认字段（主题/案例都带 cover 封面图，便于填首页图片）
  if (set.size === 0) {
    if (props.config.config_key === 'home_zones') ['icon', 'title', 'link'].forEach((k) => set.add(k))
    else if (props.config.config_key === 'home_themes') ['title', 'en', 'cover', 'bg', 'link'].forEach((k) => set.add(k))
    else ['title', 'cover', 'bg', 'link'].forEach((k) => set.add(k))
  }
  // 主题/案例即使已有老数据（无 cover 字段）也补出封面图输入，解决「首页配置没处填图片」
  if (props.config.config_key === 'home_themes' || props.config.config_key === 'home_cases' || props.config.config_key === 'upload_refs' || props.config.config_key === 'feed_discover' || props.config.config_key === 'product_detail') set.add('cover')
  if (props.config.config_key === 'home_cases') set.add('themeKey')
  if (props.config.config_key === 'product_detail') set.add('desc')
  if (props.config.config_key === 'feed_discover') set.add('en')
  return set
})
const showLink = computed(() => props.config.config_key !== 'product_detail' && props.config.config_key !== 'feed_discover')
const linkPlaceholder = computed(() => {
  if (props.config.config_key === 'home_cases') return '跳转：pattern:52 或 /product/52（Web/小程序商品详情）'
  return '跳转：小程序 /pages/… 或 Web /product/花型ID 或 pattern:ID'
})

const displayTitle = computed(() => {
  const map: Record<string, string> = {
    home_cases: 'Web 模板预设 / 首页案例',
    feed_discover: 'Web 推荐 / 发现页配图',
    product_detail: '商品详情页默认内容',
    home_themes: '首页主题随心订',
    home_zones: '首页功能区',
    upload_refs: '上传页参考图',
  }
  return map[props.config.config_key] || props.config.title || props.config.config_key
})
function isFeedTextSlot(item: ConfigItem) {
  return props.config.config_key === 'feed_discover' && (item.id === 'nav_title' || item.id === 'list_size')
}

function feedTextPreview(item: ConfigItem) {
  if (item.id === 'nav_title') return item.title?.trim() || '标题'
  if (item.id === 'list_size') return item.en?.trim() || '10'
  return '—'
}

function titlePlaceholder(item: ConfigItem) {
  if (item.id === 'nav_title') return '浏览页顶部大标题（如：发现）'
  if (item.id === 'list_size') return '展示数量（固定文案，可不改）'
  return '标题'
}

function enPlaceholder(item: ConfigItem) {
  if (item.id === 'list_size') return '每主题展示花型条数（1–50）'
  return '英文副标题'
}

const coverPlaceholder = computed(() => {
  if (props.config.config_key === 'home_cases') return '模板封面图（Web 首页「袜版设计预设」展示）'
  if (props.config.config_key === 'feed_discover') return '发现/推荐页配图 URL'
  return '封面/卡片图 URL'
})
function hasDescField(item: ConfigItem) {
  return props.config.config_key === 'product_detail' && item.id === 'main'
}
function hasEnField(item: ConfigItem) {
  if (item.id === 'list_size') return true
  return hasField('en') && (props.config.config_key !== 'product_detail' || item.id === 'main')
}

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
  if (hasField('cover')) base.cover = ''
  if (hasField('themeKey')) base.themeKey = ''
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
  if (props.config.config_key === 'feed_discover') {
    const sizeItem = items.value.find((it) => it.id === 'list_size')
    if (sizeItem) {
      const raw = (sizeItem.en ?? '').trim()
      const n = parseInt(raw, 10)
      if (!raw || !Number.isFinite(n) || n < 1 || n > 50) {
        Message.warning('展示数量须为 1–50 的整数')
        return
      }
      sizeItem.en = String(n)
    }
  }
  // 校验：标题必填
  if (items.value.some((it) => !it.title?.trim())) {
    Message.warning('每个配置项的标题都必填')
    return
  }
  saving.value = true
  try {
    await updateConfigValue(props.config.config_key, items.value)
    Message.success('已保存，小程序 / Web 约 1 分钟内生效')
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
.block-hint {
  color: var(--color-primary-light-4);
  font-size: 12px;
  margin: 0 0 8px;
  font-weight: 500;
  line-height: 1.6;
}
.block-hint code {
  font-size: 11px;
  padding: 0 4px;
  background: var(--color-fill-2);
  border-radius: 3px;
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
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
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
.f-xl {
  width: 360px;
}
.ops {
  flex-shrink: 0;
}
</style>
