import { defineStore } from 'pinia'
import { login as apiLogin, getMe, logout as apiLogout, type AdminAccount } from '@/api/auth'
import { setToken, clearToken } from '@/utils/auth'

interface UserState {
  account: AdminAccount | null
}

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    account: null,
  }),
  getters: {
    nickname: (s) => s.account?.nickname || s.account?.username || '管理员',
    role: (s) => s.account?.role || '',
  },
  actions: {
    async login(username: string, password: string) {
      const res = await apiLogin({ username, password })
      setToken(res.data.token)
      this.account = res.data.account
    },
    async fetchMe() {
      const res = await getMe()
      this.account = res.data
    },
    async logout() {
      try {
        await apiLogout()
      } catch {
        /* 忽略 */
      }
      clearToken()
      this.account = null
    },
  },
})

export default useUserStore
