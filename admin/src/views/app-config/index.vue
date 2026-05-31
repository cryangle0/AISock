<template>
  <div class="page-container">
    <div class="page-toolbar">
      <div>
        <h2>小程序首页配置</h2>
        <p class="sub">配置小程序首页的主题、功能区、案例展示，保存后约 1 分钟内自动生效</p>
      </div>
      <a-button @click="fetchList">
        <template #icon><icon-refresh /></template>刷新
      </a-button>
    </div>

    <a-spin :loading="loading" style="width: 100%">
      <a-empty v-if="!loading && configs.length === 0" description="暂无配置，请先执行数据库迁移 003_app_config.sql" />
      <ConfigBlockCard
        v-for="cfg in configs"
        :key="cfg.config_key"
        :config="cfg"
        @saved="fetchList"
        @toggle-status="(s) => onToggleStatus(cfg, s)"
      />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listConfigs, updateConfigValue, type AppConfig } from '@/api/config'
import ConfigBlockCard from './ConfigBlockCard.vue'

const configs = ref<AppConfig[]>([])
const loading = ref(false)

// 固定展示顺序：主题 → 功能区 → 案例；未在列表中的配置项排到最后
const ORDER = ['home_themes', 'home_zones', 'home_cases']
/** 取排序权重：已知 key 用其下标，未知 key 排末尾 */
function orderRank(key: string): number {
  const i = ORDER.indexOf(key)
  return i === -1 ? ORDER.length : i
}

async function fetchList() {
  loading.value = true
  try {
    const res = await listConfigs()
    configs.value = [...res.data].sort((a, b) => orderRank(a.config_key) - orderRank(b.config_key))
  } finally {
    loading.value = false
  }
}

async function onToggleStatus(cfg: AppConfig, status: number) {
  await updateConfigValue(cfg.config_key, cfg.value, status)
  cfg.status = status
  Message.success(status === 1 ? '已启用' : '已停用')
}

onMounted(fetchList)
</script>

<style scoped>
.sub {
  color: var(--color-text-3);
  font-size: 12px;
  margin: 4px 0 0;
}
</style>
