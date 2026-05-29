<template>
  <a-layout class="layout">
    <a-layout-sider
      :collapsed="appStore.collapsed"
      :width="232"
      collapsible
      :trigger="null"
      breakpoint="xl"
      class="layout-sider"
    >
      <div class="brand">
        <span class="brand-logo">爱</span>
        <span v-show="!appStore.collapsed" class="brand-text">爱花型 · 后台</span>
      </div>
      <a-menu
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
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/store'
import { appRoutes } from '@/router/routes'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const menus = computed(() =>
  appRoutes.map((r) => ({
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
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 18px;
  color: #fff;
}
.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #a06d36, #8c5a3c);
  font-weight: 800;
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
