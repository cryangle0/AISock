<template>
  <div class="login">
    <div class="login-card">
      <div class="login-brand">
        <span class="login-logo">爱</span>
        <div>
          <h1 class="login-title">爱花型 · 运营后台</h1>
          <p class="login-sub">AI 袜版设计系统</p>
        </div>
      </div>
      <a-form :model="form" layout="vertical" @submit="onSubmit">
        <a-form-item field="username" hide-label>
          <a-input v-model="form.username" placeholder="用户名" size="large">
            <template #prefix><icon-user /></template>
          </a-input>
        </a-form-item>
        <a-form-item field="password" hide-label>
          <a-input-password v-model="form.password" placeholder="密码" size="large" @keyup.enter="onSubmit">
            <template #prefix><icon-lock /></template>
          </a-input-password>
        </a-form-item>
        <a-button type="primary" long size="large" :loading="loading" @click="onSubmit">
          登录
        </a-button>
      </a-form>
      <p class="login-tip">默认账号：admin / admin123</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/store'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({ username: 'admin', password: '' })
const loading = ref(false)

async function onSubmit() {
  if (!form.username || !form.password) {
    Message.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    Message.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="less">
.login {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5ede0 0%, #e5d4b5 100%);
}
.login-card {
  width: 380px;
  padding: 36px 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(94, 60, 30, 0.16);
}
.login-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.login-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #a06d36, #8c5a3c);
  color: #fff;
  font-size: 22px;
  font-weight: 800;
}
.login-title {
  font-size: 19px;
  font-weight: 800;
  color: #2b1f14;
}
.login-sub {
  font-size: 12px;
  color: #998975;
  margin-top: 2px;
}
.login-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #b8a892;
}
</style>
