<template>
  <view class="designs">
    <NavBar title="我的设计" show-back variant="solid" />
    <scroll-view class="designs-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
    <view v-if="list.length === 0" class="empty">
      <text class="empty-icon">🧦</text>
      <text class="empty-text">暂无设计稿</text>
      <button class="empty-btn" @tap="goEditor">去创建第一个袜版</button>
    </view>
    <template v-else>
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input v-model="query" placeholder="搜索设计名称" />
      </view>
      <view class="summary">已保存 {{ list.length }} 个袜版</view>

      <view class="grid">
        <view v-for="d in filtered" :key="d.id" class="card">
          <view class="cover" @tap="editDesign(d.id)">
            <image v-if="d.cover_url" :src="d.cover_url" mode="aspectFill" class="cover-img" lazy-load />
            <view v-else class="cover-empty">🧦</view>
          </view>
          <view class="meta">
            <text class="name">{{ d.name }}</text>
            <text class="date">{{ (d.created_at || '').slice(0, 10) }}</text>
          </view>
          <view class="actions">
            <view class="icon-btn" @tap="editDesign(d.id)">✨</view>
            <view class="icon-btn danger" @tap="onDelete(d.id)">🗑</view>
          </view>
        </view>
      </view>

      <view v-if="filtered.length === 0" class="empty-mini">没有匹配的设计</view>
    </template>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { designApi } from '@aisock/service'
import { navigateTo } from '@aisock/common/utils'
import type { Design } from '@aisock/common/types'
import NavBar from '@/components/ui/NavBar.vue'

const list = ref<Design[]>([])
const query = ref('')
const filtered = computed(() => list.value.filter((d) => !query.value || (d.name || '').includes(query.value)))

async function fetchList() {
  try {
    const res = await designApi.listDesigns()
    list.value = res.data
  } catch {
    /* 忽略 */
  }
}
onShow(fetchList)

async function onDelete(id: number) {
  const res = await uni.showModal({ title: '提示', content: '确定删除该设计？' })
  if (!res.confirm) return
  await designApi.deleteDesign(id)
  uni.showToast({ title: '已删除', icon: 'none' })
  fetchList()
}
/** 编辑器现为普通页，用 storage 传递待编辑 designId */
function editDesign(id: number) {
  uni.setStorageSync('aisock_edit_design_id', id)
  navigateTo('/pkg/editor/index')
}
const goEditor = () => navigateTo('/pkg/editor/index')
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.designs {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.designs-scroll {
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  padding: 24rpx 32rpx;
}
.empty {
  margin-top: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}
.empty-icon {
  font-size: 80rpx;
}
.empty-text {
  font-size: 26rpx;
  color: $mp-text-secondary;
}
.empty-btn {
  background: $mp-primary;
  color: #fff;
  border-radius: 999rpx;
  font-size: 26rpx;
  padding: 0 48rpx;
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
  margin-bottom: 16rpx;
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
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.card {
  width: calc(50% - 10rpx);
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 20rpx;
  overflow: hidden;
}
.cover {
  width: 100%;
  height: 240rpx;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.cover-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
  background: $mp-bg;
}
.meta {
  padding: 14rpx 16rpx 4rpx;
}
.name {
  font-size: 26rpx;
  font-weight: 600;
  color: $mp-text-primary;
}
.date {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: $mp-text-muted;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
  padding: 0 16rpx 16rpx;
}
.icon-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: $mp-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}
.icon-btn.danger {
  color: $mp-pink;
}
.empty-mini {
  text-align: center;
  color: $mp-text-muted;
  font-size: 24rpx;
  padding: 40rpx 0;
}
</style>
