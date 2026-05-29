import type { Router } from 'vue-router'
import { isLogin } from '@/utils/auth'
import { useUserStore } from '@/store'

export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const requiresAuth = to.meta.requiresAuth !== false
    if (!requiresAuth) {
      next()
      return
    }
    if (!isLogin()) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    // 已登录但未拉取账号信息 → 拉一次
    const userStore = useUserStore()
    if (!userStore.account) {
      try {
        await userStore.fetchMe()
      } catch {
        next({ name: 'Login' })
        return
      }
    }
    next()
  })
}
