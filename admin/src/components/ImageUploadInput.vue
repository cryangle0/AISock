<template>
  <div class="img-upload">
    <div class="iu-row">
      <a-input
        :model-value="modelValue"
        :placeholder="placeholder || '粘贴图片 URL，或点右侧上传'"
        allow-clear
        @update:model-value="(v: string) => emit('update:modelValue', v)"
      />
      <a-upload
        :show-file-list="false"
        accept="image/png,image/jpeg,image/webp,image/gif"
        :custom-request="customRequest"
        :disabled="uploading"
      >
        <template #upload-button>
          <a-button type="primary" :loading="uploading">
            <template #icon><icon-upload /></template>
            {{ uploading ? '上传中' : '上传' }}
          </a-button>
        </template>
      </a-upload>
    </div>
    <div v-if="modelValue && !broken" class="iu-preview">
      <img :src="modelValue" alt="预览" @error="broken = true" />
    </div>
    <div v-else-if="modelValue && broken" class="iu-broken">图片无法预览（URL 可能无效）</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { uploadImage } from '@/api/upload'

const props = defineProps<{ modelValue?: string; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const uploading = ref(false)
const broken = ref(false)

// URL 变化时重置「加载失败」标记，便于重新预览
watch(() => props.modelValue, () => { broken.value = false })

function customRequest(option: {
  fileItem: { file?: File }
  onSuccess: (res?: unknown) => void
  onError: (err?: unknown) => void
}) {
  const { fileItem, onSuccess, onError } = option
  if (fileItem.file) {
    uploading.value = true
    uploadImage(fileItem.file)
      .then((res) => {
        emit('update:modelValue', res.data.url)
        Message.success('上传成功')
        onSuccess(res)
      })
      .catch((e) => {
        // 拦截器已弹出错误信息
        onError(e)
      })
      .finally(() => {
        uploading.value = false
      })
  }
  // Arco customRequest 需同步返回 UploadRequest（带 abort），不能返回 Promise
  return { abort() {} }
}
</script>

<style scoped>
.img-upload {
  width: 100%;
}
.iu-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.iu-row :deep(.arco-input-wrapper) {
  flex: 1;
}
.iu-preview {
  margin-top: 8px;
}
.iu-preview img {
  max-width: 160px;
  max-height: 120px;
  border-radius: 8px;
  border: 1px solid var(--color-neutral-3);
  object-fit: cover;
  display: block;
}
.iu-broken {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-3);
}
</style>
