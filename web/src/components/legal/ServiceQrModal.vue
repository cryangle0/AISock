<template>
  <Teleport to="body">
    <Transition name="qr-fade">
      <div v-if="open" class="qr-mask" @click.self="closeServiceQr">
        <div class="qr-card theme-light">
          <button class="qr-close" @click="closeServiceQr"><AppIcon name="close" :size="18" color="var(--text-3)" /></button>
          <div class="qr-frame"><img :src="qrSrc" alt="联系客服二维码" class="qr-img" /></div>
          <div class="qr-title">AI 花型体验版</div>
          <div class="qr-sub">该二维码 6 月 24 日前有效</div>
          <p class="qr-tip">微信扫一扫，添加客服 / 立即体验</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import { useServiceQr } from '@/composables/useServiceQr'

const { open, closeServiceQr } = useServiceQr()
const qrSrc = import.meta.env.BASE_URL + 'service-qr.png'
</script>

<style scoped>
.qr-mask {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(20, 40, 32, 0.45);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.qr-card {
  position: relative;
  width: 100%; max-width: 320px;
  background: #fff; border-radius: 20px;
  padding: 32px 28px 26px;
  box-shadow: 0 24px 60px rgba(16, 78, 58, 0.24);
  text-align: center;
}
.qr-close { position: absolute; top: 14px; right: 14px; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
.qr-close:hover { background: var(--bg-hover); }
.qr-frame { width: 220px; height: 220px; margin: 0 auto; padding: 10px; background: #fff; border: 1px solid var(--border); border-radius: 14px; }
.qr-img { width: 100%; height: 100%; object-fit: contain; }
.qr-title { margin-top: 18px; font-size: 16px; font-weight: 700; color: var(--text); }
.qr-sub { margin-top: 6px; font-size: 13px; color: var(--text-3); }
.qr-tip { margin-top: 14px; font-size: 12px; color: var(--text-2); }

.qr-fade-enter-active, .qr-fade-leave-active { transition: opacity 0.2s; }
.qr-fade-enter-from, .qr-fade-leave-to { opacity: 0; }
</style>
