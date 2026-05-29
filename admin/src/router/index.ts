import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { setupRouterGuard } from './guard'

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

setupRouterGuard(router)

export default router
