import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { isLogin } from '@/utils/auth'
import { useUserStore } from '@/store'

NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.15 })

export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    NProgress.start()
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
    // 角色分权：访问带 meta.roles 限制的页面时校验角色，无权回仪表盘
    const roles = to.meta.roles as string[] | undefined
    if (roles && !roles.includes(userStore.role)) {
      next({ name: 'Dashboard' })
      return
    }
    next()
  })

  router.afterEach(() => {
    NProgress.done()
  })
  router.onError(() => {
    NProgress.done()
  })
}
