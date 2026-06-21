import { ref } from 'vue'

/** 全局「联系客服」二维码弹框（单例）。任意位置调用 openServiceQr() 弹出。 */
const open = ref(false)

export function useServiceQr() {
  function openServiceQr() { open.value = true }
  function closeServiceQr() { open.value = false }
  return { open, openServiceQr, closeServiceQr }
}
