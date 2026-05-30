<template>
  <div class="lp-root">
    <!-- 左面板：品牌 + 视觉 -->
    <aside class="lp-left">
      <header class="lp-left-header">
        <img class="lp-left-logo" src="/logo.png" alt="爱花型" />
        <span class="lp-left-brand">爱花型 · 运营后台</span>
      </header>

      <div class="lp-left-stage">
        <div class="lp-hero-logo">
          <img src="/logo.png" alt="爱花型" />
        </div>
        <h2 class="lp-hero-title">AI 袜版设计 · 运营管理</h2>
        <p class="lp-hero-sub">订单 · 用户 · 花型素材 · 小程序配置<br />一站式运营，数据尽在掌握</p>
      </div>

      <div class="lp-left-grid" />
      <div class="lp-left-glow lp-left-glow-1" />
      <div class="lp-left-glow lp-left-glow-2" />
    </aside>

    <!-- 右面板：登录卡片 -->
    <main class="lp-right">
      <div class="lp-card">
        <div class="lp-mobile-brand">
          <img src="/logo.png" alt="爱花型" />
          <span>爱花型 · 运营后台</span>
        </div>

        <div class="lp-heading">
          <h1>欢迎回来</h1>
          <p>登录管理后台，开始今天的运营工作</p>
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
          <a-button type="primary" long size="large" :loading="loading" @click="onSubmit">登录</a-button>
        </a-form>

        <p class="lp-tip">默认账号：admin / admin123</p>
      </div>

      <div class="lp-copy">爱花型袜业 · 2026</div>
    </main>
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
.lp-root {
  display: flex;
  min-height: 100vh;
  background: #f5ede0;
}

/* ── 左面板 ── */
.lp-left {
  position: relative;
  flex: 1.1;
  display: flex;
  flex-direction: column;
  padding: 40px 56px;
  background: linear-gradient(150deg, #946d60 0%, #7a5347 55%, #5e3c2e 100%);
  color: #fff;
  overflow: hidden;
}
.lp-left-header {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
}
.lp-left-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  padding: 4px;
  box-sizing: border-box;
}
.lp-left-brand {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.lp-left-stage {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 22px;
}
.lp-hero-logo {
  width: 132px;
  height: 132px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
}
.lp-hero-logo img {
  width: 92px;
  height: 92px;
  object-fit: contain;
}
.lp-hero-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.lp-hero-sub {
  font-size: 14px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.82);
}
.lp-left-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 36px 36px;
  z-index: 1;
}
.lp-left-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
}
.lp-left-glow-1 {
  width: 320px;
  height: 320px;
  background: rgba(222, 195, 138, 0.35);
  top: -80px;
  right: -60px;
}
.lp-left-glow-2 {
  width: 260px;
  height: 260px;
  background: rgba(197, 72, 60, 0.25);
  bottom: -60px;
  left: -40px;
}

/* ── 右面板 ── */
.lp-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
}
.lp-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 12px 40px rgba(94, 60, 30, 0.1);
}
.lp-mobile-brand {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}
.lp-mobile-brand img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}
.lp-mobile-brand span {
  font-size: 17px;
  font-weight: 800;
}
.lp-heading h1 {
  font-size: 24px;
  font-weight: 800;
  color: #2b1f14;
  margin-bottom: 8px;
}
.lp-heading p {
  font-size: 13px;
  color: #998975;
  margin-bottom: 24px;
}
.lp-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #b8a892;
}
.lp-copy {
  position: absolute;
  bottom: 24px;
  font-size: 12px;
  color: #b8a892;
}

@media (max-width: 860px) {
  .lp-left {
    display: none;
  }
  .lp-mobile-brand {
    display: flex;
  }
}
</style>
