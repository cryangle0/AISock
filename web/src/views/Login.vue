<template>
  <div class="login">
    <div class="login-card card">
      <div class="brand">
        <span class="logo">爱</span>
        <div>
          <h1 class="title">爱花型</h1>
          <p class="sub">创意由你，花型随心</p>
        </div>
      </div>

      <div class="field">
        <input v-model="phone" type="tel" placeholder="请输入手机号" maxlength="11" />
      </div>
      <div class="field code">
        <input v-model="code" type="text" placeholder="请输入验证码" maxlength="6" />
        <button class="code-btn" :disabled="counting > 0" @click="onSendCode">
          {{ counting > 0 ? `${counting}s` : '获取验证码' }}
        </button>
      </div>

      <p class="agreement">登录即代表同意 <span>《用户协议》</span> 和 <span>《隐私政策》</span></p>

      <button class="btn-primary full" :disabled="!canSubmit || loading" @click="onLogin">
        {{ loading ? '登录中...' : '登录' }}
      </button>
      <p class="tip">开发环境验证码固定为 1234</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '@/api'
import { useUserStore } from '@/store'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const phone = ref('')
const code = ref('')
const counting = ref(0)
const loading = ref(false)

const canSubmit = computed(() => /^1\d{10}$/.test(phone.value) && code.value.length >= 4)

async function onSendCode() {
  if (counting.value > 0) return
  if (!/^1\d{10}$/.test(phone.value)) {
    alert('请输入正确的手机号')
    return
  }
  await authApi.smsSend(phone.value)
  counting.value = 60
  const timer = setInterval(() => {
    counting.value -= 1
    if (counting.value <= 0) clearInterval(timer)
  }, 1000)
}

async function onLogin() {
  if (!canSubmit.value) return
  loading.value = true
  try {
    await userStore.loginBySms(phone.value, code.value)
    const redirect = (route.query.redirect as string) || '/home'
    router.push(redirect)
  } catch (e) {
    alert((e as Error).message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5ede0, #e5d4b5);
}
.login-card {
  width: 400px;
  padding: 40px 36px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.logo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #a06d36, #8c5a3c);
  color: #fff;
  font-size: 26px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.title {
  font-size: 22px;
  font-weight: 800;
}
.sub {
  font-size: 13px;
  color: var(--text-3);
}
.field {
  margin-bottom: 16px;
}
.field input {
  width: 100%;
  height: 46px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
}
.field.code {
  display: flex;
  gap: 10px;
}
.code-btn {
  white-space: nowrap;
  border: 1px solid var(--border);
  background: var(--bg-card);
  border-radius: 10px;
  padding: 0 16px;
  color: var(--primary);
  font-size: 13px;
}
.agreement {
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 16px;
}
.agreement span {
  color: var(--primary);
}
.full {
  width: 100%;
}
.tip {
  margin-top: 14px;
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
}
</style>
