<template>
  <view class="editor">
    <!-- 袜型选择（流程前移） -->
    <view class="block">
      <text class="block-title">① 选择袜型</text>
      <scroll-view scroll-x class="sock-row">
        <view
          v-for="s in catalog.socks"
          :key="s.id"
          :class="['sock-chip', { active: sockId === s.id }]"
          @tap="sockId = s.id"
        >
          {{ s.name }}
        </view>
      </scroll-view>
    </view>

    <!-- AI 生成 -->
    <view class="block">
      <view class="block-head">
        <text class="block-title">② AI 生成花型</text>
        <text class="quota">今日剩余 {{ quota.remaining }}/{{ quota.limit }} 次</text>
      </view>
      <textarea v-model="prompt" class="prompt" placeholder="描述你想要的花型，如：敦煌风格的飞天纹样" maxlength="200" />
      <button class="gen-btn" :loading="generating" @tap="onGenerate">生成花型</button>
      <view v-if="results.length" class="results">
        <image v-for="(url, i) in results" :key="i" :src="url" mode="aspectFill" class="result-img" />
      </view>
    </view>

    <!-- 保存 / 下单（右侧固定，不随滚动） -->
    <view class="actions">
      <button class="action ghost" @tap="onSave">保存设计</button>
      <button class="action primary" @tap="onOrder">立即下单</button>
    </view>

    <custom-tab-bar current="editor" />
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useCatalogStore, useUserStore } from '@aisock/composition'
import { aiApi, designApi } from '@aisock/service'
import { navigateTo, reLaunch } from '@aisock/common/utils'
import CustomTabBar from '@/components/CustomTabBar.vue'

const catalog = useCatalogStore()
const userStore = useUserStore()

const sockId = ref<number | undefined>()
const prompt = ref('')
const generating = ref(false)
const results = ref<string[]>([])
const quota = reactive({ limit: 5, remaining: 5 })

onShow(async () => {
  await catalog.ensureLoaded().catch(() => {})
  if (!sockId.value && catalog.socks.length) sockId.value = catalog.socks[0].id
  if (userStore.isLogin) {
    try {
      const res = await aiApi.getQuota()
      quota.limit = res.data.limit
      quota.remaining = res.data.remaining
    } catch {
      /* 忽略 */
    }
  }
})

function ensureLogin(): boolean {
  if (!userStore.isLogin) {
    reLaunch('/pages/login/index')
    return false
  }
  return true
}

async function onGenerate() {
  if (!ensureLogin()) return
  if (!prompt.value.trim()) {
    uni.showToast({ title: '请输入提示词', icon: 'none' })
    return
  }
  generating.value = true
  try {
    const res = await aiApi.generate({ type: 'text2img', prompt: prompt.value })
    results.value = res.data.result_urls || []
    const q = await aiApi.getQuota()
    quota.remaining = q.data.remaining
  } catch {
    /* 拦截器已提示 */
  } finally {
    generating.value = false
  }
}

async function onSave() {
  if (!ensureLogin()) return
  await designApi.createDesign({
    name: prompt.value.slice(0, 12) || '未命名袜版',
    sockModelId: sockId.value,
    coverUrl: results.value[0],
  })
  uni.showToast({ title: '已保存', icon: 'success' })
}

function onOrder() {
  if (!ensureLogin()) return
  navigateTo('/pages/orders/index')
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.editor {
  min-height: 100vh;
  padding: 24rpx 32rpx 220rpx;
}
.block {
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.block-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $mp-text-primary;
}
.quota {
  font-size: 22rpx;
  color: $mp-primary;
}
.sock-row {
  white-space: nowrap;
  margin-top: 16rpx;
}
.sock-chip {
  display: inline-block;
  padding: 12rpx 28rpx;
  margin-right: 16rpx;
  border-radius: 999rpx;
  border: 1rpx solid $mp-border;
  font-size: 24rpx;
  color: $mp-text-secondary;
}
.sock-chip.active {
  background: $mp-primary;
  color: #fff;
  border-color: $mp-primary;
}
.prompt {
  width: 100%;
  height: 180rpx;
  background: $mp-bg;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}
.gen-btn {
  margin-top: 16rpx;
  background: $mp-primary;
  color: #fff;
  border-radius: 16rpx;
  font-size: 28rpx;
}
.results {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
}
.result-img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 16rpx;
}
.actions {
  position: fixed;
  right: 24rpx;
  bottom: 160rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  z-index: 50;
}
.action {
  width: 160rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  box-shadow: 0 8rpx 24rpx rgba(94, 60, 30, 0.18);
}
.action.ghost {
  background: $mp-bg-card;
  color: $mp-primary;
  border: 1rpx solid $mp-primary;
}
.action.primary {
  background: $mp-primary;
  color: #fff;
}
</style>
