import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getToken } from '@/api/http'
import { useAuthModal } from '@/composables/useAuthModal'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/home',
    children: [
      { path: 'home', name: 'Home', component: () => import('@/views/Home.vue') },
      { path: 'feed', name: 'Feed', component: () => import('@/views/Feed.vue') },
      { path: 'product/:id', name: 'ProductDetail', component: () => import('@/views/ProductDetail.vue') },
      { path: 'editor', name: 'Editor', component: () => import('@/views/Editor.vue'), meta: { requiresAuth: true } },
      { path: 'cart', name: 'Cart', component: () => import('@/views/Cart.vue'), meta: { requiresAuth: true } },
      { path: 'order/:id', name: 'OrderDetail', component: () => import('@/views/OrderDetail.vue'), meta: { requiresAuth: true } },
      { path: 'mine', name: 'Mine', component: () => import('@/views/Mine.vue'), meta: { requiresAuth: true } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// 需登录的路由：未登录则弹出登录框（不跳独立页），登录成功后回跳目标
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !getToken()) {
    const { openLogin } = useAuthModal()
    openLogin(to.fullPath)
    if (from.name) next(false)
    else next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
