<template>
  <view class="assets">
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input v-model="query" placeholder="搜索花型 / 标签" />
    </view>

    <view class="summary">
      {{ scope === 'public' ? `${publicItems.length} 套花型 · 拖到编辑器即可应用` : `${mine.length} 张 · 我上传的素材` }}
    </view>

    <view class="scope-tabs">
      <view v-for="s in scopes" :key="s.key" :class="['scope-tab', { active: scope === s.key }]" @tap="scope = s.key">
        {{ s.label }}
      </view>
    </view>

    <!-- 公共库 -->
    <view v-if="scope === 'public'" class="asset-grid">
      <view v-for="p in visiblePublic" :key="p.id" class="asset-card">
        <view class="thumb"><PatternThumb :pattern-id="p.id" /></view>
        <text class="asset-name">{{ p.name }}</text>
        <view class="tags">
          <text class="tag">官方</text>
          <text class="tag light">免费</text>
        </view>
      </view>
    </view>

    <!-- 我的 -->
    <template v-else>
      <view v-if="mine.length === 0" class="mine-empty">
        <text class="empty-icon">🖼</text>
        <text>个人素材库为空</text>
        <button class="empty-btn" @tap="onUpload">上传第一张素材</button>
      </view>
      <view v-else class="asset-grid">
        <view v-for="m in visibleMine" :key="m.id" class="asset-card">
          <view class="thumb"><image :src="m.url" mode="aspectFill" class="thumb-img" /></view>
          <text class="asset-name">{{ m.name }}</text>
          <view class="tags"><text class="tag mine">我的</text></view>
          <view class="remove" @tap="onRemove(m.id)">🗑</view>
        </view>
      </view>
    </template>

    <view v-if="scope === 'mine' && mine.length > 0" class="fab-wrap">
      <button class="upload-fab" @tap="onUpload">＋ 上传素材</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { PATTERN_LIST } from '@aisock/common'
import { catalogApi } from '@aisock/service'
import { useUserStore } from '@aisock/composition'
import PatternThumb from '@/components/PatternThumb.vue'

const userStore = useUserStore()
const scopes = [
  { key: 'public', label: '公共库' },
  { key: 'mine', label: '我的' },
]
const scope = ref('public')
const query = ref('')
const publicItems = PATTERN_LIST
const mine = ref<{ id: number; url: string; name: string }[]>([])

const visiblePublic = computed(() => publicItems.filter((p) => !query.value || p.name.includes(query.value)))
const visibleMine = computed(() => mine.value.filter((m) => !query.value || m.name.includes(query.value)))

async function fetchMine() {
  if (!userStore.isLogin) return
  try {
    const res = await catalogApi.listMyPatterns({ pageNum: 1, pageSize: 100 })
    mine.value = res.data.list.map((p) => ({ id: p.id, url: p.image_url, name: p.name }))
  } catch {
    /* 忽略 */
  }
}
onShow(fetchMine)

function onUpload() {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths[0]
      // 真机：先 uni.uploadFile 上传到 OSS 拿 URL，再调后端。演示用本地路径兜底。
      try {
        await catalogApi.uploadMyPattern({ name: `素材${mine.value.length + 1}`, imageUrl: path })
        uni.showToast({ title: '已上传', icon: 'none' })
        fetchMine()
      } catch {
        mine.value.unshift({ id: Date.now(), url: path, name: `素材${mine.value.length + 1}` })
      }
    },
  })
}
async function onRemove(id: number) {
  try {
    await catalogApi.deleteMyPattern(id)
  } catch {
    /* 忽略 */
  }
  mine.value = mine.value.filter((m) => m.id !== id)
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.assets {
  min-height: 100vh;
  padding: 24rpx 32rpx 120rpx;
}
.search-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 16rpx;
  padding: 0 20rpx;
  height: 72rpx;
  margin-bottom: 14rpx;
}
.search-bar input {
  flex: 1;
  font-size: 26rpx;
}
.summary {
  font-size: 22rpx;
  color: $mp-text-muted;
  margin-bottom: 16rpx;
}
.scope-tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.scope-tab {
  padding: 12rpx 32rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: $mp-text-secondary;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
}
.scope-tab.active {
  background: $mp-primary;
  color: #fff;
  border-color: $mp-primary;
}
.asset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.asset-card {
  width: calc((100% - 32rpx) / 3);
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
}
.thumb {
  width: 100%;
  aspect-ratio: 1;
}
.thumb-img {
  width: 100%;
  height: 100%;
}
.asset-name {
  display: block;
  font-size: 22rpx;
  text-align: center;
  padding: 8rpx 4rpx 2rpx;
  color: $mp-text-primary;
}
.tags {
  display: flex;
  justify-content: center;
  gap: 6rpx;
  padding-bottom: 10rpx;
}
.tag {
  font-size: 16rpx;
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
  background: $mp-coral-soft;
  color: $mp-primary;
}
.tag.light {
  background: $mp-bg;
  color: $mp-text-muted;
}
.tag.mine {
  background: $mp-primary-soft;
  color: $mp-primary;
}
.remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
}
.mine-empty {
  margin-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.empty-icon {
  font-size: 70rpx;
}
.mine-empty text {
  font-size: 26rpx;
  color: $mp-text-secondary;
}
.empty-btn,
.upload-fab {
  background: $mp-primary;
  color: #fff;
  border-radius: 999rpx;
  font-size: 26rpx;
  padding: 0 48rpx;
}
.fab-wrap {
  position: fixed;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
}
</style>
