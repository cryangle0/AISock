<template>
  <a-layout class="layout">
    <a-layout-sider
      :collapsed="appStore.collapsed"
      :width="232"
      breakpoint="xl"
      class="layout-sider"
    >
      <div class="brand" :class="{ 'brand--collapsed': appStore.collapsed }">
        <img class="brand-logo" src="/logo.png" alt="爱花型" />
        <span v-show="!appStore.collapsed" class="brand-text">爱花型 · 后台</span>
      </div>
      <a-menu
        theme="dark"
        :selected-keys="[route.name as string]"
        :auto-open-selected="true"
        @menu-item-click="onMenuClick"
      >
        <a-menu-item v-for="item in menus" :key="item.name">
          <template #icon><component :is="item.icon" /></template>
          {{ item.title }}
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="layout-header">
        <a-button type="text" @click="appStore.toggleCollapsed()">
          <template #icon>
            <icon-menu-fold v-if="!appStore.collapsed" />
            <icon-menu-unfold v-else />
          </template>
        </a-button>
        <div class="header-right">
          <a-dropdown>
            <a-space class="user-trigger">
              <a-avatar :size="32" :style="{ background: '#8C5A3C' }">
                {{ userStore.nickname.charAt(0) }}
              </a-avatar>
              <span>{{ userStore.nickname }}</span>
              <icon-down />
            </a-space>
            <template #content>
              <a-doption @click="onLogout">
                <template #icon><icon-export /></template>
                退出登录
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="layout-content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/store'
import { appRoutes } from '@/router/routes'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

// 空闲时预取所有侧边栏页面的代码块（懒加载 chunk），
// 这样首次点击任意 tab 时 JS 已在缓存中，避免点击后再下载导致的“反应慢”。
onMounted(() => {
  const prefetch = () => {
    for (const r of appRoutes) {
      const loader = r.component as unknown as (() => Promise<unknown>) | undefined
      if (typeof loader === 'function') {
        try { loader() } catch { /* 忽略预取失败 */ }
      }
    }
  }
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback
  if (ric) ric(prefetch)
  else setTimeout(prefetch, 1500)
})

const menus = computed(() =>
  appRoutes
    // 角色分权：带 meta.roles 的菜单仅对应角色可见（如"用户管理"仅 admin）
    .filter((r) => {
      const roles = r.meta?.roles as string[] | undefined
      return !roles || roles.includes(userStore.role)
    })
    .map((r) => ({
      name: r.name as string,
      title: (r.meta?.title as string) || (r.name as string),
      icon: (r.meta?.icon as string) || 'icon-apps',
    })),
)

function onMenuClick(key: string) {
  if (key !== route.name) router.push({ name: key })
}

async function onLogout() {
  await userStore.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped lang="less">
.layout {
  height: 100vh;
}
.layout-sider {
  background: #241b16;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.18);
}
.layout-sider :deep(.arco-menu) {
  background: transparent;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 18px;
  color: #f5ede0;
}
.brand--collapsed {
  padding: 0;
  gap: 0;
  justify-content: center;
}
.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: contain;
  background: #fff;
  padding: 3px;
  box-sizing: border-box;
  flex-shrink: 0;
}
.brand-text {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid var(--color-border-2);
}
.header-right {
  display: flex;
  align-items: center;
}
.user-trigger {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.user-trigger:hover {
  background: var(--color-fill-2);
}
.layout-content {
  padding: 16px;
  background: var(--color-fill-1);
  overflow: auto;
}
</style>
