import { ref } from 'vue'

/** 全局登录弹框状态（单例）。任何位置调用 openLogin() 即可弹出登录框，登录成功后跳回 redirect。 */
const open = ref(false)
const redirect = ref<string | null>(null)

export function useAuthModal() {
  function openLogin(r?: string | null) {
    redirect.value = r ?? null
    open.value = true
  }
  function closeLogin() {
    open.value = false
  }
  return { open, redirect, openLogin, closeLogin }
}
