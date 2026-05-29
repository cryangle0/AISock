<template>
  <div>
    <a-row :gutter="16">
      <a-col v-for="card in cards" :key="card.label" :span="6">
        <a-card class="stat-card" :bordered="false">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ card.value }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="trend-card" title="近 7 日订单趋势" :bordered="false">
      <v-chart v-if="trendOption" class="chart" :option="trendOption" autoresize />
      <a-empty v-else description="暂无数据" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getOverview, getOrderTrend, type Overview } from '@/api/dashboard'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const overview = ref<Overview | null>(null)
const trend = ref<Array<{ day: string; n: number }>>([])

const cards = computed(() => [
  { label: '用户总数', value: overview.value?.userCount ?? '-' },
  { label: '订单总数', value: overview.value?.orderCount ?? '-' },
  { label: '设计稿数', value: overview.value?.designCount ?? '-' },
  { label: '累计营收(元)', value: overview.value?.revenue ?? '-' },
])

const trendOption = computed(() => {
  if (!trend.value.length) return null
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: trend.value.map((t) => t.day) },
    yAxis: { type: 'value' },
    series: [
      {
        data: trend.value.map((t) => t.n),
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(140,90,60,0.12)' },
        lineStyle: { color: '#8c5a3c' },
        itemStyle: { color: '#8c5a3c' },
      },
    ],
  }
})

onMounted(async () => {
  try {
    const [ov, tr] = await Promise.all([getOverview(), getOrderTrend()])
    overview.value = ov.data
    trend.value = tr.data
  } catch {
    /* 拦截器已提示 */
  }
})
</script>

<style scoped lang="less">
.stat-card {
  border-radius: 12px;
}
.stat-label {
  font-size: 13px;
  color: var(--color-text-3);
}
.stat-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 800;
  color: #8c5a3c;
}
.trend-card {
  margin-top: 16px;
  border-radius: 12px;
}
.chart {
  height: 320px;
}
</style>
