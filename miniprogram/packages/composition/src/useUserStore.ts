import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi } from '@aisock/service'
import { STORAGE_KEYS } from '@aisock/common/constants'
import type { UserInfo } from '@aisock/common/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(uni.getStorageSync(STORAGE_KEYS.TOKEN) || '')
  const userInfo = ref<UserInfo | null>(uni.getStorageSync(STORAGE_KEYS.USER_INFO) || null)

  const isLogin = computed(() => !!token.value)

  function persist() {
    uni.setStorageSync(STORAGE_KEYS.TOKEN, token.value)
    uni.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo.value)
  }

  async function loginBySms(phone: string, code: string) {
    const res = await authApi.smsLogin(phone, code)
    token.value = res.data.token
    userInfo.value = res.data.user
    persist()
  }

  async function loginByWechatCode(code: string, inviterId?: number) {
    const res = await authApi.wechatLoginByCode(code, inviterId)
    token.value = res.data.token
    userInfo.value = res.data.user
    persist()
  }

  /** 微信一键登录：登录 code + 手机号授权 code */
  async function loginByWechatWithPhone(code: string, phoneCode: string, inviterId?: number) {
    const res = await authApi.wechatLoginWithPhone(code, phoneCode, inviterId)
    token.value = res.data.token
    userInfo.value = res.data.user
    persist()
  }

  async function refreshProfile() {
    if (!token.value) return
    const res = await userApi.getProfile()
    userInfo.value = res.data
    persist()
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      /* 忽略 */
    }
    token.value = ''
    userInfo.value = null
    uni.removeStorageSync(STORAGE_KEYS.TOKEN)
    uni.removeStorageSync(STORAGE_KEYS.USER_INFO)
  }

  return { token, userInfo, isLogin, loginBySms, loginByWechatCode, loginByWechatWithPhone, refreshProfile, logout }
})
