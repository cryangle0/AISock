<template>
  <div class="layout">
    <header class="topnav">
      <div class="brand">
        <span class="brand-logo">爱</span>
        <div class="brand-text">
          <span class="brand-cn">爱花型 · 设计</span>
          <span class="brand-en">SOCK DESIGN</span>
        </div>
      </div>
      <nav class="nav">
        <router-link
          v-for="t in tabs"
          :key="t.name"
          :to="{ name: t.name }"
          class="nav-item"
          active-class="active"
        >
          {{ t.label }}
        </router-link>
      </nav>
      <div class="actions">
        <template v-if="userStore.isLogin">
          <span class="avatar">{{ avatarText }}</span>
          <button class="link-btn" @click="onLogout">退出</button>
        </template>
        <router-link v-else :to="{ name: 'Login' }" class="btn-primary">登录</router-link>
      </div>
    </header>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()

const tabs = [
  { name: 'Home', label: '首页' },
  { name: 'Feed', label: '推荐' },
  { name: 'Editor', label: 'AI 设计' },
  { name: 'Cart', label: '购物车' },
  { name: 'Mine', label: '我的' },
]

const avatarText = computed(() => (userStore.userInfo?.nickname || '客').charAt(0))

onMounted(() => {
  if (userStore.isLogin) userStore.refreshProfile().catch(() => {})
})

async function onLogout() {
  await userStore.logout()
  router.push({ name: 'Home' })
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.topnav {
  display: flex;
  align-items: center;
  gap: 32px;
  height: 64px;
  padding: 0 32px;
  background: linear-gradient(135deg, rgba(255, 252, 246, 0.94), rgba(222, 195, 138, 0.3)), var(--bg-card);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #a06d36, #8c5a3c);
  color: #fff;
  font-weight: 800;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.brand-cn {
  font-size: 17px;
  font-weight: 800;
  font-family: var(--font-art);
  letter-spacing: 0.06em;
}
.brand-en {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--text-3);
}
.nav {
  display: flex;
  gap: 6px;
  flex: 1;
}
.nav-item {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-2);
  transition: all 0.15s;
}
.nav-item:hover {
  background: var(--bg);
}
.nav-item.active {
  color: var(--primary);
  background: #f2e6d2;
  font-weight: 600;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--pink));
  color: #fff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.link-btn {
  background: none;
  border: none;
  color: var(--text-2);
  font-size: 14px;
}
.link-btn:hover {
  color: var(--primary);
}
.content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 32px 48px;
}
</style>
