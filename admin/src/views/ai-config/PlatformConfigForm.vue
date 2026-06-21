<template>
  <a-form :model="model" layout="vertical">
    <a-form-item :label="`图像服务提供方${optionalHint}`">
      <a-select v-model="model.provider" :placeholder="ph.provider" allow-clear>
        <a-option value="openai">OpenAI（gpt-image 系列）</a-option>
        <a-option value="nanobanana">Nano Banana（Google Gemini）</a-option>
        <a-option value="doubao">豆包 Seedream（火山方舟）</a-option>
        <a-option value="dashscope">阿里万相（DashScope）</a-option>
        <a-option value="kie">KIE</a-option>
        <a-option value="generic">通用接口</a-option>
      </a-select>
      <template #extra>
        <span class="hint">客户自行填写各自账号的 API Key；模型名不写死，填好 Key 后点「拉取模型」选最新模型。</span>
      </template>
    </a-form-item>

    <a-form-item :label="`API 密钥${optionalHint}`">
      <a-input-password v-model="model.apiKey" :placeholder="ph.apiKey" allow-clear />
      <template #extra>
        <span class="hint">留空则使用服务器环境变量里的密钥</span>
      </template>
    </a-form-item>

    <a-form-item :label="`接口基址${optionalHint}`">
      <a-input v-model="model.apiBaseUrl" :placeholder="ph.apiBaseUrl" allow-clear />
      <template #extra>
        <span class="hint">留空用该 provider 官方默认地址</span>
      </template>
    </a-form-item>

    <a-form-item label="可用模型">
      <a-space>
        <a-button :loading="fetchingModels" @click="onFetchModels">
          <template #icon><icon-cloud-download /></template>拉取模型
        </a-button>
        <span v-if="modelOptions.length" class="hint">已拉取 {{ modelOptions.length }} 个模型，下面可直接下拉选择</span>
        <span v-else class="hint">填好上方 Key 后点此从该账号获取最新可用模型</span>
      </a-space>
    </a-form-item>

    <a-form-item :label="`文生图模型${optionalHint}`">
      <a-select v-model="model.text2imgModel" :placeholder="ph.text2imgModel" allow-create allow-clear :options="modelOptions" />
    </a-form-item>
    <a-form-item :label="`图生图模型${optionalHint}`">
      <a-select v-model="model.img2imgModel" :placeholder="ph.img2imgModel" allow-create allow-clear :options="modelOptions" />
    </a-form-item>
    <a-form-item :label="`文本模型（提示词优化/推荐官对话，多模态）${optionalHint}`">
      <a-input v-model="model.textModel" :placeholder="ph.textModel" allow-clear />
      <template #extra>
        <span class="hint">意图优化推荐 qwen3.7-max（DashScope）；亦可用 gpt-5.5 / doubao-seed-2.0 等（留空则沿用现有文本服务）</span>
      </template>
    </a-form-item>
    <a-form-item :label="`语音识别模型（ASR）${optionalHint}`">
      <a-input v-model="model.asrModel" :placeholder="ph.asrModel" allow-clear />
    </a-form-item>
    <a-form-item :label="`提示词模板${optionalHint}`">
      <a-textarea
        v-model="model.promptTemplate"
        :placeholder="ph.promptTemplate"
        :auto-size="{ minRows: 2, maxRows: 4 }"
        allow-clear
      />
      <template #extra>
        <span class="hint">用 <code>{{ '{prompt}' }}</code> 表示用户输入的位置；不含则自动追加到末尾</span>
      </template>
    </a-form-item>
    <a-form-item :label="`出图比例${optionalHint}`">
      <a-select v-model="model.aspectRatio" :placeholder="ph.aspectRatio" allow-clear>
        <a-option value="1:1">1:1（方形，推荐印花）</a-option>
        <a-option value="3:4">3:4（竖版）</a-option>
        <a-option value="4:3">4:3（横版）</a-option>
        <a-option value="9:16">9:16（长竖版）</a-option>
      </a-select>
    </a-form-item>

    <a-form-item label="连通测试">
      <a-space direction="vertical" fill style="width: 100%">
        <a-space>
          <a-button type="primary" status="success" :loading="testing" @click="onTest">
            <template #icon><icon-experiment /></template>测试出图
          </a-button>
          <span class="hint">用当前配置真实生成一张测试图，验证 Key/模型是否可用（不消耗用户额度）</span>
        </a-space>
        <a-alert v-if="testResult" :type="testResult.ok ? 'success' : 'error'">
          {{ testResult.ok ? `生成成功，用时 ${(testResult.elapsedMs / 1000).toFixed(1)}s` : `失败：${testResult.message}` }}
        </a-alert>
        <a-image v-if="testResult?.ok && testResult.url" :src="testResult.url" width="160" height="160" fit="cover" />
      </a-space>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  fetchProviderModels, testProvider,
  type AiPlatformConfig, type AiProvider,
} from '@/api/ai-config'

const props = defineProps<{
  /** v-model 绑定的配置对象（default 为完整必填；平台覆盖为可空） */
  modelValue: Partial<AiPlatformConfig>
  /** 是否为「覆盖」表单（小程序/web）：留空表示沿用默认 */
  optional?: boolean
  /** 占位提示（通常传默认平台的值，便于知道留空时的实际取值） */
  placeholder?: Partial<AiPlatformConfig>
}>()

// 双向绑定：直接复用传入对象（父组件用 reactive 持有）
const model = computed(() => props.modelValue)

const optionalHint = computed(() => (props.optional ? '（留空沿用默认）' : ''))

/** 生效配置：覆盖表单留空的字段回退到 placeholder（默认平台）的值，用于拉取模型/测试 */
function effective(): Partial<AiPlatformConfig> {
  const ph = props.placeholder || {}
  const m = props.modelValue || {}
  const pick = (k: keyof AiPlatformConfig) => (typeof m[k] === 'string' && (m[k] as string).trim() ? m[k] : ph[k])
  return {
    provider: (pick('provider') as AiProvider) || 'openai',
    apiKey: pick('apiKey') as string,
    apiBaseUrl: pick('apiBaseUrl') as string,
    text2imgModel: pick('text2imgModel') as string,
    img2imgModel: pick('img2imgModel') as string,
    textModel: pick('textModel') as string,
    promptTemplate: pick('promptTemplate') as string,
    aspectRatio: pick('aspectRatio') as string,
  }
}

const fetchingModels = ref(false)
const modelOptions = ref<{ label: string; value: string }[]>([])
async function onFetchModels() {
  const eff = effective()
  if (!eff.provider) { Message.warning('请先选择图像服务提供方'); return }
  fetchingModels.value = true
  try {
    const { data } = await fetchProviderModels({ provider: eff.provider as AiProvider, apiKey: eff.apiKey, apiBaseUrl: eff.apiBaseUrl })
    modelOptions.value = (data.models || []).map((m) => ({ label: m, value: m }))
    if (!modelOptions.value.length) Message.warning('未获取到模型，请检查 Key / 接口基址，或直接手动填写模型名')
    else Message.success(`已拉取 ${modelOptions.value.length} 个可用模型`)
  } catch (e: any) {
    Message.error(e?.response?.data?.message || '拉取模型失败，请检查 Key')
  } finally {
    fetchingModels.value = false
  }
}

const testing = ref(false)
const testResult = ref<{ ok: boolean; url?: string; message: string; elapsedMs: number } | null>(null)
async function onTest() {
  const eff = effective()
  if (!eff.text2imgModel) { Message.warning('请先填写/选择文生图模型再测试'); return }
  testing.value = true
  testResult.value = null
  try {
    const { data } = await testProvider(eff)
    testResult.value = data
    if (data.ok) Message.success('测试出图成功')
    else Message.error('测试失败：' + data.message)
  } catch (e: any) {
    Message.error(e?.response?.data?.message || '测试请求失败')
  } finally {
    testing.value = false
  }
}

const ph = computed<AiPlatformConfig>(() => ({
  provider: (props.placeholder?.provider as AiProvider) || 'openai',
  text2imgModel: props.placeholder?.text2imgModel || '点「拉取模型」选择，或手填',
  img2imgModel: props.placeholder?.img2imgModel || '点「拉取模型」选择，或手填',
  textModel: props.placeholder?.textModel || '如 qwen3.7-max / qwen-plus',
  asrModel: props.placeholder?.asrModel || '如 qwen3-asr-flash',
  promptTemplate: props.placeholder?.promptTemplate || '袜款印花图案，{prompt}，平铺无缝',
  aspectRatio: props.placeholder?.aspectRatio || '1:1',
  // 密钥脱敏：placeholder 不受 input-password 掩码保护，绝不能把默认平台真实 key 明文当占位符
  apiKey: maskKey(props.placeholder?.apiKey) || '留空用环境变量，如 sk-xxxxxx',
  apiBaseUrl: props.placeholder?.apiBaseUrl || '留空用官方默认地址',
}))

/** 密钥脱敏展示：保留前 4 后 4 位 */
function maskKey(key?: string): string {
  if (!key) return ''
  if (key.length <= 8) return '****'
  return `${key.slice(0, 4)}****${key.slice(-4)}（沿用默认）`
}
</script>

<style scoped>
.hint {
  color: var(--color-text-3);
  font-size: 12px;
}
</style>
