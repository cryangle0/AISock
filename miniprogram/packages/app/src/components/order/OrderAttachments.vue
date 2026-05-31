<template>
  <view class="oa">
    <view class="oa-head">
      <text class="oa-title">订单附件</text>
      <text v-if="editable" class="oa-add" @tap="onPick">+ 上传图片/文件</text>
    </view>

    <view v-if="list.length" class="oa-grid">
      <view v-for="f in list" :key="f.id" class="oa-item">
        <image v-if="isImage(f)" :src="f.url" mode="aspectFill" class="oa-thumb" @tap="preview(f)" />
        <view v-else class="oa-file" @tap="preview(f)">📄</view>
        <text class="oa-name">{{ f.name }}</text>
        <text v-if="editable" class="oa-del" @tap="onRemove(f)">✕</text>
      </view>
    </view>
    <view v-else class="oa-empty">
      {{ editable ? '可上传设计稿、参考图或补充文件' : '暂无附件' }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { orderApi, uploadApi } from '@aisock/service'
import type { OrderAttachment } from '@aisock/service'

const props = defineProps<{
  orderId: number
  /** 仅待付款/已付款（未进入生产）可增删 */
  editable?: boolean
}>()

const list = ref<OrderAttachment[]>([])

async function load() {
  if (!props.orderId) return
  try {
    const res = await orderApi.listOrderAttachments(props.orderId)
    list.value = res.data || []
  } catch {
    /* 拦截器已提示 */
  }
}

watch(() => props.orderId, load, { immediate: true })

function isImage(f: OrderAttachment) {
  return (f.mime || '').startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(f.name)
}

function preview(f: OrderAttachment) {
  if (isImage(f)) {
    uni.previewImage({ urls: [f.url], current: f.url })
  } else {
    uni.setClipboardData({ data: f.url, success: () => uni.showToast({ title: '链接已复制', icon: 'none' }) })
  }
}

function onPick() {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths?.[0]
      if (!path) return
      uni.showLoading({ title: '上传中…', mask: true })
      try {
        const up = await uploadApi.uploadFile(path)
        await orderApi.addOrderAttachment(props.orderId, { name: up.name, url: up.url, mime: up.mime, size: up.size })
        await load()
        uni.showToast({ title: '已上传', icon: 'success' })
      } catch {
        /* 拦截器已提示 */
      } finally {
        uni.hideLoading()
      }
    },
  })
}

function onRemove(f: OrderAttachment) {
  uni.showModal({
    title: '删除附件',
    content: `确认删除「${f.name}」？`,
    success: async (r) => {
      if (!r.confirm) return
      try {
        await orderApi.removeOrderAttachment(props.orderId, f.id)
        await load()
      } catch {
        /* 拦截器已提示 */
      }
    },
  })
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.oa-head {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}
.oa-title {
  font-size: 26rpx;
  font-weight: 700;
  color: $mp-text-primary;
}
.oa-add {
  margin-left: auto;
  font-size: 22rpx;
  color: $mp-primary;
}
.oa-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.oa-item {
  width: calc((100% - 32rpx) / 3);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.oa-thumb,
.oa-file {
  width: 100%;
  height: 160rpx;
  border-radius: 12rpx;
  background: $mp-bg;
  border: 1rpx solid $mp-border;
}
.oa-file {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
}
.oa-name {
  font-size: 20rpx;
  color: $mp-text-muted;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.oa-del {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  text-align: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 22rpx;
}
.oa-empty {
  font-size: 22rpx;
  color: $mp-text-muted;
  padding: 16rpx 0;
}
</style>
