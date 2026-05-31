import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi, type UserInfo } from '@/api'
import { setToken, clearToken, getToken } from '@/api/http'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken() || '')
  const userInfo = ref<UserInfo | null>(null)
  const isLogin = computed(() => !!token.value)

  async function loginBySms(phone: string, code: string) {
    const res = await authApi.smsLogin(phone, code)
    token.value = res.data.token
    userInfo.value = res.data.user
    setToken(res.data.token)
  }

  /** 手机号 + 密码登录 */
  async function loginByPassword(phone: string, password: string) {
    const res = await authApi.passwordLogin(phone, password)
    token.value = res.data.token
    userInfo.value = res.data.user
    setToken(res.data.token)
  }

  /** 用已获取的 token 完成登录（PC 扫码登录确认后） */
  async function loginByToken(newToken: string) {
    token.value = newToken
    setToken(newToken)
    await refreshProfile()
  }

  async function refreshProfile() {
    if (!token.value) return
    const res = await userApi.profile()
    userInfo.value = res.data
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      /* 忽略 */
    }
    token.value = ''
    userInfo.value = null
    clearToken()
  }

  return { token, userInfo, isLogin, loginBySms, loginByPassword, loginByToken, refreshProfile, logout }
})
