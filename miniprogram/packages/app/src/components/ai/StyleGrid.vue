<template>
  <view class="style-card">
    <view class="style-grid">
      <view
        v-for="s in items"
        :key="s.id"
        :class="['style-item', { active: selected.includes(s.id) }]"
        @tap="toggle(s.id)"
      >
        <view class="style-thumb" :style="{ background: s.bg }">
          <image v-if="s.img" class="style-img" :src="s.img" mode="aspectFill" />
          <view v-if="selected.includes(s.id)" class="style-check">
            <AppIcon name="check" :size="18" color="#ffffff" />
          </view>
        </view>
        <text class="style-label" :class="{ on: selected.includes(s.id) }">{{ s.name }}</text>
      </view>
    </view>
    <view class="style-actions">
      <view class="sa-btn ghost" @tap="$emit('skip')">暂不选择</view>
      <view class="sa-btn solid" @tap="$emit('confirm', selected)">选好了</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

export interface StyleItem { id: string; tagId: number; name: string; bg: string; img?: string }
const props = defineProps<{ items: StyleItem[] }>()
defineEmits<{ confirm: [ids: string[]]; skip: [] }>()

const selected = ref<string[]>(props.items[0] ? [props.items[0].id] : [])

function toggle(id: string) {
  // 改为单选：点击已选中的不取消，点击新的替换
  selected.value = [id]
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.style-card {
  background: #fff;
  border-radius: $mp-radius-lg;
  padding: 24rpx;
  box-shadow: $mp-shadow-sm;
}
.style-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}
.style-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.style-thumb {
  position: relative;
  width: 100%;
  height: 128rpx;
  border-radius: $mp-radius-md;
  border: 2rpx solid transparent;
  overflow: hidden;
}
.style-img {
  width: 100%;
  height: 100%;
}
.style-item.active .style-thumb {
  border-color: $mp-primary;
}
.style-check {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 36rpx;
  height: 36rpx;
  background: $mp-primary;
  border-radius: 16rpx 8rpx 8rpx 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.style-label {
  font-size: 22rpx;
  color: $mp-text-strong;
  font-family: $mp-font-serif;
}
.style-label.on {
  color: $mp-primary;
  font-weight: 600;
}
.style-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.sa-btn {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $mp-radius-pill;
  font-size: 26rpx;
  font-weight: 600;
  font-family: $mp-font-serif;
}
.sa-btn.ghost {
  color: $mp-primary;
  border: 1rpx solid $mp-border;
}
.sa-btn.solid {
  background: $mp-primary;
  color: #fff;
}
</style>
