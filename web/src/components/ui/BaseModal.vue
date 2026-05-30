<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="modal-mask" @click.self="onMaskClick">
        <div class="modal" :class="sizeClass" role="dialog" aria-modal="true">
          <header class="modal-head">
            <div class="modal-head-text">
              <h3 class="modal-title">{{ title }}</h3>
              <p v-if="subtitle" class="modal-sub">{{ subtitle }}</p>
            </div>
            <button v-if="closable" class="modal-close" aria-label="关闭" @click="$emit('close')">✕</button>
          </header>

          <div class="modal-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    visible?: boolean
    title: string
    subtitle?: string
    size?: 'sm' | 'md' | 'lg'
    closable?: boolean
    closeOnMask?: boolean
  }>(),
  { visible: true, size: 'md', closable: true, closeOnMask: true },
)

const emit = defineEmits<{ close: [] }>()

const sizeClass = computed(() => `is-${props.size}`)

function onMaskClick() {
  if (props.closeOnMask && props.closable) emit('close')
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(43, 31, 20, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}
.modal {
  width: 100%;
  background: var(--bg-card);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  box-shadow: var(--shadow-lg, 0 24px 60px rgba(0, 0, 0, 0.2));
}
.is-sm {
  max-width: 420px;
}
.is-md {
  max-width: 540px;
}
.is-lg {
  max-width: 720px;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.modal-title {
  font-size: 18px;
  font-weight: 800;
}
.modal-sub {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 4px;
}
.modal-close {
  border: none;
  background: var(--bg-hover);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 15px;
  color: var(--text-2);
  cursor: pointer;
  flex-shrink: 0;
}
.modal-close:hover {
  background: var(--border);
}
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
}
.modal-foot {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
