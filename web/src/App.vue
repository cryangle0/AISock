<template>
  <router-view />
  <LoginModal />
  <AgreementModal />
  <ServiceQrModal />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSiteConfigStore } from '@/store'
import { useTheme } from '@/composables/useTheme'
import { preloadLoginSlides } from '@/data/loginSlides'
import LoginModal from '@/components/auth/LoginModal.vue'
import AgreementModal from '@/components/legal/AgreementModal.vue'
import ServiceQrModal from '@/components/legal/ServiceQrModal.vue'

// 启动即拉取站点品牌配置（logo/标题/favicon 等），失败回退内置默认
const siteConfig = useSiteConfigStore()
const { initTheme } = useTheme()
initTheme()
onMounted(() => {
  siteConfig.load()
  preloadLoginSlides()
})
</script>
