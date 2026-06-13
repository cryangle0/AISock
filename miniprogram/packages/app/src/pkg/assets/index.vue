<template>
  <view class="assets">
    <NavBar title="素材库" show-back variant="solid" />
    <scroll-view class="assets-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input v-model="query" placeholder="搜索花型 / 标签" />
    </view>

    <view class="summary">
      {{ scope === 'public' ? `${visiblePublic.length} 套花型 · 点选即可应用` : `${mine.length} 张 · 我上传的素材` }}
    </view>

    <view class="scope-tabs">
      <view v-for="s in scopes" :key="s.key" :class="['scope-tab', { active: scope === s.key }]" @tap="scope = s.key">
        {{ s.label }}
      </view>
    </view>

    <!-- 公共库 -->
    <view v-if="scope === 'public'" class="asset-grid">
      <view v-for="p in visiblePublic" :key="p.key" class="asset-card">
        <view class="thumb">
          <image v-if="p.kind === 'image'" :src="p.imageUrl" mode="aspectFill" class="thumb-img" lazy-load />
          <PatternThumb v-else :pattern-id="p.patternId!" />
        </view>
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
          <view class="thumb"><image :src="m.url" mode="aspectFill" class="thumb-img" lazy-load /></view>
          <text class="asset-name">{{ m.name }}</text>
          <view class="tags"><text class="tag mine">我的</text></view>
          <view class="remove" @tap="onRemove(m.id)">🗑</view>
        </view>
      </view>
    </template>
    </scroll-view>

    <view v-if="scope === 'mine' && mine.length > 0" class="fab-wrap">
      <button class="upload-fab" @tap="onUpload">＋ 上传素材</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { catalogApi, uploadApi } from '@aisock/service'
import { useUserStore } from '@aisock/composition'
import { useCatalog } from '@/pkg/composables/useCatalog'
import PatternThumb from '@/components/PatternThumb.vue'
import NavBar from '@/components/ui/NavBar.vue'

const userStore = useUserStore()
const { patterns: publicItems, ensureLoaded: ensureCatalog } = useCatalog()
const scopes = [
  { key: 'public', label: '公共库' },
  { key: 'mine', label: '我的' },
]
const scope = ref('public')
const query = ref('')
const mine = ref<{ id: number; url: string; name: string }[]>([])

const visiblePublic = computed(() => publicItems.value.filter((p) => !query.value || p.name.includes(query.value)))
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
onShow(() => {
  ensureCatalog()
  fetchMine()
})

function onUpload() {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths[0]
      uni.showLoading({ title: '上传中...', mask: true })
      try {
        // 1) 先上传到后端拿正式 URL（OSS / 本地磁盘）
        const up = await uploadApi.uploadFile(path)
        // 2) 再登记为我的花型素材
        await catalogApi.uploadMyPattern({ name: `素材${mine.value.length + 1}`, imageUrl: up.url, thumbUrl: up.url })
        uni.hideLoading()
        uni.showToast({ title: '已上传', icon: 'success' })
        fetchMine()
      } catch (e: any) {
        uni.hideLoading()
        uni.showToast({ title: e?.message || '上传失败', icon: 'none' })
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
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.assets-scroll {
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
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
