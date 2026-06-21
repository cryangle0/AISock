import { ref } from 'vue'

/** 全局「用户协议 / 隐私政策」弹框状态（单例）。任意位置调用 openAgreement('user'|'privacy') 弹出。 */
const open = ref(false)
const doc = ref<'user' | 'privacy'>('user')

export function useAgreement() {
  function openAgreement(d: 'user' | 'privacy') {
    doc.value = d
    open.value = true
  }
  function closeAgreement() {
    open.value = false
  }
  return { open, doc, openAgreement, closeAgreement }
}
