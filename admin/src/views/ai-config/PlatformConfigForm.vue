<template>
  <a-form :model="model" layout="vertical">
    <a-form-item :label="`文生图模型${optionalHint}`">
      <a-input v-model="model.text2imgModel" :placeholder="ph.text2imgModel" allow-clear />
    </a-form-item>
    <a-form-item :label="`图生图模型${optionalHint}`">
      <a-input v-model="model.img2imgModel" :placeholder="ph.img2imgModel" allow-clear />
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
  </a-form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AiPlatformConfig } from '@/api/ai-config'

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

const ph = computed<AiPlatformConfig>(() => ({
  text2imgModel: props.placeholder?.text2imgModel || '如 google/nano-banana',
  img2imgModel: props.placeholder?.img2imgModel || '如 google/nano-banana-edit',
  promptTemplate: props.placeholder?.promptTemplate || '袜款印花图案，{prompt}，平铺无缝',
  aspectRatio: props.placeholder?.aspectRatio || '1:1',
}))
</script>

<style scoped>
.hint {
  color: var(--color-text-3);
  font-size: 12px;
}
</style>
