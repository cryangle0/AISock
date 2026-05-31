<template>
  <BaseModal
    :title="hasPassword ? '修改登录密码' : '设置登录密码'"
    :subtitle="hasPassword ? '验证原密码后设置新密码' : '设置后可用「手机号 + 密码」登录'"
    size="sm"
    @close="$emit('close')"
  >
    <label v-if="hasPassword" class="pm-field">
      <span>原密码</span>
      <input v-model="oldPassword" type="password" maxlength="32" placeholder="请输入原密码" autocomplete="current-password" />
    </label>
    <label class="pm-field">
      <span>新密码</span>
      <input v-model="newPassword" type="password" maxlength="32" placeholder="6-32 位，含字母和数字" autocomplete="new-password" />
    </label>
    <label class="pm-field">
      <span>确认新密码</span>
      <input v-model="confirmPassword" type="password" maxlength="32" placeholder="再次输入新密码" autocomplete="new-password" />
    </label>
    <p v-if="error" class="pm-error">{{ error }}</p>

    <template #footer>
      <button class="pm-btn ghost" @click="$emit('close')">取消</button>
      <button class="pm-btn primary" :disabled="!canSubmit || submitting" @click="onSubmit">
        {{ submitting ? '提交中…' : '保存' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { userApi } from '@/api'

const props = defineProps<{ hasPassword?: boolean }>()
const emit = defineEmits<{ close: []; success: [] }>()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const error = ref('')

const strongEnough = computed(
  () => newPassword.value.length >= 6 && /[a-zA-Z]/.test(newPassword.value) && /\d/.test(newPassword.value),
)
const canSubmit = computed(() => {
  if (!strongEnough.value || newPassword.value !== confirmPassword.value) return false
  if (props.hasPassword && !oldPassword.value) return false
  return true
})

async function onSubmit() {
  error.value = ''
  if (newPassword.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  submitting.value = true
  try {
    await userApi.setPassword(newPassword.value, props.hasPassword ? oldPassword.value : undefined)
    emit('success')
  } catch (e) {
    error.value = (e as Error).message || '保存失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.pm-field {
  display: block;
  margin-bottom: 14px;
}
.pm-field span {
  display: block;
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 6px;
}
.pm-field input {
  width: 100%;
  height: 42px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  background: var(--bg);
}
.pm-error {
  font-size: 12px;
  color: var(--pink, #c5483c);
  margin-top: -4px;
}
.pm-btn {
  flex: 1;
  height: 40px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.pm-btn.ghost {
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-2);
}
.pm-btn.primary {
  border: none;
  background: var(--primary);
  color: #fff;
}
.pm-btn.primary:disabled {
  opacity: 0.55;
  cursor: default;
}
</style>
