<template>
  <div class="page-container">
    <div class="page-toolbar">
      <div>
        <h2>AI 生成模型配置</h2>
        <p class="sub">按平台配置文/图生图模型与提示词模板，保存后约 1 分钟内生效。小程序 / Web 留空则沿用默认配置。</p>
      </div>
      <a-space>
        <a-button @click="fetchConfig">
          <template #icon><icon-refresh /></template>刷新
        </a-button>
        <a-button type="primary" :loading="saving" @click="onSave">
          <template #icon><icon-save /></template>保存配置
        </a-button>
      </a-space>
    </div>

    <a-spin :loading="loading" style="width: 100%">
      <a-tabs type="rounded" default-active-key="default">
        <a-tab-pane key="default" title="默认（必填）">
          <a-alert class="tip" type="normal">所有平台的兜底配置；小程序 / Web 未单独配置的字段都会用这里的值。</a-alert>
          <PlatformConfigForm :model-value="form.default" :placeholder="builtinDefault" />
        </a-tab-pane>

        <a-tab-pane key="miniprogram" title="微信小程序">
          <a-alert class="tip" type="normal">仅需填写要覆盖默认的字段，留空即沿用「默认」配置。</a-alert>
          <PlatformConfigForm :model-value="form.miniprogram" optional :placeholder="form.default" />
        </a-tab-pane>

        <a-tab-pane key="web" title="Web 端">
          <a-alert class="tip" type="normal">仅需填写要覆盖默认的字段，留空即沿用「默认」配置。</a-alert>
          <PlatformConfigForm :model-value="form.web" optional :placeholder="form.default" />
        </a-tab-pane>
      </a-tabs>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { getAiConfig, saveAiConfig, type AiPlatformConfig } from '@/api/ai-config'
import PlatformConfigForm from './PlatformConfigForm.vue'

const loading = ref(false)
const saving = ref(false)
const builtinDefault = ref<AiPlatformConfig>({
  provider: 'dashscope', text2imgModel: '', img2imgModel: '', textModel: '', asrModel: '', promptTemplate: '', aspectRatio: '1:1', apiKey: '', apiBaseUrl: '',
})

// 表单：default 完整，平台覆盖为可空字段
const form = reactive<{
  default: AiPlatformConfig
  miniprogram: Partial<AiPlatformConfig>
  web: Partial<AiPlatformConfig>
}>({
  default: { provider: 'dashscope', text2imgModel: '', img2imgModel: '', textModel: '', asrModel: '', promptTemplate: '', aspectRatio: '1:1', apiKey: '', apiBaseUrl: '' },
  miniprogram: {},
  web: {},
})

async function fetchConfig() {
  loading.value = true
  try {
    const { data } = await getAiConfig()
    builtinDefault.value = data.builtinDefault
    Object.assign(form.default, { ...data.builtinDefault, ...data.config.default })
    form.miniprogram = { ...(data.config.miniprogram || {}) }
    form.web = { ...(data.config.web || {}) }
  } finally {
    loading.value = false
  }
}

async function onSave() {
  if (!form.default.text2imgModel?.trim() || !form.default.img2imgModel?.trim()) {
    Message.warning('默认平台的文生图 / 图生图模型不能为空')
    return
  }
  saving.value = true
  try {
    await saveAiConfig({
      default: form.default,
      miniprogram: pruneEmpty(form.miniprogram),
      web: pruneEmpty(form.web),
    })
    Message.success('配置已保存，约 1 分钟内生效')
  } finally {
    saving.value = false
  }
}

/** 去掉空字符串字段，避免把空覆盖存进去 */
function pruneEmpty(o: Partial<AiPlatformConfig>): Partial<AiPlatformConfig> {
  const out: Partial<AiPlatformConfig> = {}
  ;(Object.keys(o) as (keyof AiPlatformConfig)[]).forEach((k) => {
    const v = o[k]
    if (typeof v === 'string' && v.trim()) (out as Record<string, string>)[k] = v.trim()
  })
  return out
}

onMounted(fetchConfig)
</script>

<style scoped>
.sub {
  color: var(--color-text-3);
  font-size: 12px;
  margin: 4px 0 0;
}
.tip {
  margin-bottom: 16px;
}
</style>
