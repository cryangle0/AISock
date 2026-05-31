<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSiteConfigStore } from '@/store'

// 启动即拉取站点品牌配置（logo/标题/favicon 等），失败回退内置默认
const siteConfig = useSiteConfigStore()
onMounted(() => siteConfig.load())
</script>
