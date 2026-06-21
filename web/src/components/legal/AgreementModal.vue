<template>
  <Teleport to="body">
    <Transition name="ag-fade">
      <div v-if="open" class="ag-mask" @click.self="closeAgreement">
        <div class="ag-card theme-light">
          <div class="ag-head">
            <h2>{{ doc === 'user' ? '用户协议' : '隐私政策' }}</h2>
            <button class="ag-close" @click="closeAgreement"><AppIcon name="close" :size="18" color="var(--text-3)" /></button>
          </div>
          <div class="ag-body">
            <section v-for="(sec, i) in sections" :key="i" class="ag-sec">
              <h3 v-if="sec.h">{{ sec.h }}</h3>
              <p v-for="(it, j) in sec.items" :key="j">{{ it }}</p>
            </section>
            <p class="ag-foot">最后更新：2026 年 6 月</p>
          </div>
          <div class="ag-actions">
            <button class="ag-ok" @click="closeAgreement">我已阅读</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAgreement } from '@/composables/useAgreement'
import { USER_AGREEMENT, PRIVACY_POLICY } from '@/data/agreement'

const { open, doc, closeAgreement } = useAgreement()
const sections = computed(() => (doc.value === 'user' ? USER_AGREEMENT : PRIVACY_POLICY))
</script>

<style scoped>
.ag-mask {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(20, 40, 32, 0.45);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.ag-card {
  display: flex; flex-direction: column;
  width: 100%; max-width: 640px; max-height: 80vh;
  background: #fff; border-radius: 18px; overflow: hidden;
  box-shadow: 0 24px 60px rgba(16, 78, 58, 0.24);
}
.ag-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.ag-head h2 { font-size: 18px; font-weight: 800; color: var(--text); }
.ag-close { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
.ag-close:hover { background: var(--bg-hover); }
.ag-body { padding: 16px 24px 8px; overflow-y: auto; }
.ag-sec { margin-bottom: 16px; }
.ag-sec h3 { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.ag-sec p { font-size: 13px; line-height: 1.8; color: var(--text-2); margin-bottom: 6px; }
.ag-foot { font-size: 12px; color: var(--text-3); padding: 8px 0 4px; }
.ag-actions { padding: 14px 24px 20px; flex-shrink: 0; border-top: 1px solid var(--border); }
.ag-ok {
  width: 100%; height: 44px; border-radius: var(--r-12);
  background: var(--primary); color: #fff; font-size: 15px; font-weight: 600;
  transition: background 0.16s;
}
.ag-ok:hover { background: var(--primary-hover); }

.ag-fade-enter-active, .ag-fade-leave-active { transition: opacity 0.2s; }
.ag-fade-enter-from, .ag-fade-leave-to { opacity: 0; }
</style>
