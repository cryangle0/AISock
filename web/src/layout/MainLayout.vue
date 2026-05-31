<template>
  <div class="layout" :class="{ 'is-home': isHome }">
    <header class="topnav">
      <div class="brand">
        <img class="brand-logo" :src="site.logo()" alt="logo" />
        <div class="brand-text">
          <span class="brand-cn">{{ site.config.brandName }}</span>
          <span class="brand-en">{{ site.config.brandEn }}</span>
        </div>
      </div>
      <nav v-if="!isHome" class="nav">
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
      <div v-else class="nav-spacer" />
      <div class="actions">
        <template v-if="userStore.isLogin">
          <span class="avatar">{{ avatarText }}</span>
          <button class="link-btn" @click="onLogout">退出</button>
        </template>
        <router-link v-else :to="{ name: 'Login' }" class="btn-primary">登录</router-link>
      </div>
    </header>

    <div class="body">
      <!-- 左侧垂直菜单（仅首页显示，对齐原型三栏） -->
      <aside v-if="isHome" class="side-menu">
        <nav class="side-nav">
          <button
            v-for="m in tabs"
            :key="m.name"
            :class="['side-item', { active: m.name === 'Home' }]"
            @click="onSideNav(m)"
          >
            <span class="side-icon">{{ m.icon }}</span>
            <span class="side-label">{{ m.label }}</span>
          </button>
        </nav>
        <!-- 底部装饰 SVG -->
        <div class="side-deco" aria-hidden="true">
          <svg class="deco-sock" viewBox="0 0 80 120" width="52" height="78" style="top: 24%; left: 12%; opacity: 0.4; transform: rotate(-12deg)">
            <path d="M20 10 L60 10 L60 70 Q60 85 50 92 L35 105 Q28 110 22 108 L18 106 Q14 104 14 98 L14 70 Z" fill="none" stroke="#8C5A3C" stroke-width="2" />
          </svg>
          <svg viewBox="0 0 40 40" width="34" height="34" style="top: 56%; left: 58%; opacity: 0.3; transform: rotate(8deg)">
            <circle cx="10" cy="10" r="3" fill="#C5483C" /><circle cx="30" cy="10" r="3" fill="#C5483C" />
            <circle cx="20" cy="20" r="3" fill="#C5483C" /><circle cx="10" cy="30" r="3" fill="#C5483C" /><circle cx="30" cy="30" r="3" fill="#C5483C" />
          </svg>
          <svg class="deco-sock" viewBox="0 0 80 120" width="44" height="66" style="top: 72%; left: 22%; opacity: 0.32; transform: rotate(6deg)">
            <path d="M20 10 L60 10 L60 70 Q60 85 50 92 L35 105 Q28 110 22 108 L18 106 Q14 104 14 98 L14 70 Z" fill="none" stroke="#5a8a7d" stroke-width="2" />
          </svg>
          <svg viewBox="0 0 50 50" width="38" height="38" style="top: 86%; left: 56%; opacity: 0.24; transform: rotate(15deg)">
            <path d="M25 5 L30 20 L45 20 L33 30 L37 45 L25 36 L13 45 L17 30 L5 20 L20 20 Z" fill="none" stroke="#8C5A3C" stroke-width="1.5" />
          </svg>
        </div>
      </aside>

      <main class="content" :class="{ 'content-home': isFull }">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore, useSiteConfigStore } from '@/store'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const site = useSiteConfigStore()

const isHome = computed(() => route.name === 'Home')
const isFull = computed(() => route.name === 'Home' || route.name === 'Editor')

const tabs = [
  { name: 'Home', label: '首页', icon: '🏠' },
  { name: 'Feed', label: '推荐', icon: '🧭' },
  { name: 'Editor', label: 'AI 设计', icon: '✏️' },
  { name: 'Cart', label: '购物车', icon: '🛒' },
  { name: 'Mine', label: '我的', icon: '👤' },
]

const avatarText = computed(() => (userStore.userInfo?.nickname || '客').charAt(0))

function onSideNav(m: { name: string }) {
  if (m.name === 'Home') return
  router.push({ name: m.name })
}

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
  position: relative;
}
.layout.is-home::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 460px;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(80% 60% at 100% 0%, rgba(140, 90, 60, 0.1), transparent 70%),
    radial-gradient(60% 60% at 0% 0%, rgba(197, 72, 60, 0.06), transparent 75%),
    linear-gradient(180deg, #f5ede0 0%, #efe5d4 50%, #f5ede0 100%);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 100%);
}
.topnav {
  display: flex;
  align-items: center;
  gap: 32px;
  height: 64px;
  padding: 0 28px;
  background: linear-gradient(135deg, rgba(255, 252, 246, 0.94), rgba(222, 195, 138, 0.3)), var(--bg-card);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.is-home .topnav {
  border-bottom: none;
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
  object-fit: contain;
  flex-shrink: 0;
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
  justify-content: center;
}
.nav-spacer {
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
.body {
  flex: 1;
  display: flex;
  position: relative;
  z-index: 1;
  min-height: 0;
}
/* 左侧菜单 */
.side-menu {
  width: 200px;
  flex-shrink: 0;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  background: var(--bg-card);
}
.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.side-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--text-2);
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  transition: all 0.15s;
}
.side-item:hover {
  background: var(--bg);
  color: var(--text);
}
.side-item.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}
.side-icon {
  font-size: 16px;
}
.side-deco {
  flex: 1;
  position: relative;
  min-height: 180px;
  pointer-events: none;
  overflow: hidden;
}
.side-deco svg {
  position: absolute;
}
.content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}
.content:not(.content-home) {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 32px 48px;
}
@media (max-width: 1080px) {
  .side-menu {
    display: none;
  }
}
</style>
