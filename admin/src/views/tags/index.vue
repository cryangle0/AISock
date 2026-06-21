<template>
  <div class="page-container">
    <div class="page-toolbar">
      <h2>标签管理</h2>
      <span class="toolbar-hint">场景/风格供 AI 推荐官筛选；浏览页 Tab、Banner、记录和详情请统一到「浏览页配置」维护。</span>
    </div>

    <a-tabs v-model:active-key="activeKind" @change="onKindChange">
      <a-tab-pane v-for="k in KINDS" :key="k.value" :title="k.label">
        <a-spin :loading="loading" style="width: 100%">
          <a-list :bordered="false" :max-height="520">
            <a-list-item v-for="t in tags" :key="t.id">
              <a-space wrap align="center" :size="8">
                <a-input-number v-model="t.sort" :min="0" :style="{ width: '88px' }" placeholder="排序" />
                <a-input v-model="t.code" :style="{ width: '120px' }" placeholder="code" />
                <a-input v-model="t.name" :style="{ width: '140px' }" placeholder="名称" />
                <a-textarea
                  :model-value="t.description ?? ''"
                  @update:model-value="(v: string) => (t.description = v)"
                  :max-length="255"
                  :auto-size="{ minRows: 1, maxRows: 4 }"
                  :style="{ width: '220px' }"
                  placeholder="说明（主题=浏览页 Tab 下文案；礼赠/风格=卡片副标题）"
                />
                <ImageUploadInput
                  :model-value="t.icon_url ?? ''"
                  @update:model-value="(v: string) => (t.icon_url = v || null)"
                  :placeholder="iconPlaceholder"
                  :style="{ width: '280px' }"
                />
                <a-switch v-model="t.status" :checked-value="1" :unchecked-value="0" />
                <a-button size="mini" type="primary" @click="onSave(t)">保存</a-button>
                <a-popconfirm content="删除该标签？将同时解除其与花型的关联" @ok="onDelete(t.id)">
                  <a-button size="mini" status="danger">删除</a-button>
                </a-popconfirm>
              </a-space>
            </a-list-item>
            <template #empty><a-empty description="暂无标签" /></template>
          </a-list>
        </a-spin>

        <a-divider :margin="12" />
        <a-space wrap align="center" :size="8">
          <a-input v-model="addForm.code" placeholder="code，如 festival" :style="{ width: '120px' }" />
          <a-input v-model="addForm.name" placeholder="名称，如 节日礼赠" :style="{ width: '140px' }" />
          <a-textarea
            v-model="addForm.description"
            :max-length="255"
            :auto-size="{ minRows: 1, maxRows: 4 }"
            placeholder="说明（主题=浏览页 Tab 下文案，可多行）"
            :style="{ width: '260px' }"
          />
          <a-input-number v-model="addForm.sort" :min="0" :style="{ width: '88px' }" placeholder="排序" />
          <a-button type="primary" @click="onCreate">
            <template #icon><icon-plus /></template>
            新增标签
          </a-button>
        </a-space>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { onActivated, reactive, ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listTags, createTag, updateTag, deleteTag, type Tag } from '@/api/tags'
import ImageUploadInput from '@/components/ImageUploadInput.vue'

const KINDS = [
  { value: 'scene', label: '礼赠场景' },
  { value: 'style', label: '风格' },
  { value: 'theme', label: '主题(发现/Web推荐)' },
]

const activeKind = ref<'scene' | 'style' | 'theme' | string>('scene')
const iconPlaceholder = computed(() =>
  activeKind.value === 'theme'
    ? '主题 Banner 大图 URL（发现页切换 Tab 时展示）'
    : '卡片配图 URL（AI 礼赠/风格小图）',
)
const tags = ref<Tag[]>([])
const loading = ref(false)
const addForm = reactive<{ code: string; name: string; description: string; sort: number }>({
  code: '', name: '', description: '', sort: 0,
})

async function fetchTags() {
  loading.value = true
  try {
    const res = await listTags(activeKind.value)
    tags.value = res.data
  } finally {
    loading.value = false
  }
}

function onKindChange() {
  Object.assign(addForm, { code: '', name: '', description: '', sort: 0 })
  fetchTags()
}

async function onSave(t: Tag) {
  if (!t.code?.trim() || !t.name?.trim()) {
    Message.warning('code 和名称不能为空')
    return
  }
  await updateTag(t.id, {
    code: t.code.trim(),
    name: t.name.trim(),
    description: (t.description ?? '').trim() || null,
    iconUrl: (t.icon_url ?? '').trim() || null,
    sort: t.sort,
    status: t.status,
  })
  Message.success('已保存')
  fetchTags()
}

async function onCreate() {
  if (!addForm.code.trim() || !addForm.name.trim()) {
    Message.warning('code 和名称必填')
    return
  }
  await createTag({
    kind: activeKind.value,
    code: addForm.code.trim(),
    name: addForm.name.trim(),
    description: addForm.description.trim() || null,
    sort: addForm.sort,
  })
  Message.success('标签已创建')
  Object.assign(addForm, { code: '', name: '', description: '', sort: 0 })
  fetchTags()
}

async function onDelete(id: number) {
  await deleteTag(id)
  Message.success('已删除')
  fetchTags()
}

onActivated(fetchTags)
</script>

<style scoped lang="less">
.toolbar-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--color-text-3);
}
</style>
