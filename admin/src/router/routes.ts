import type { RouteRecordRaw } from 'vue-router'

/** 业务菜单路由（挂在 Layout 下） */
export const appRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '仪表盘', icon: 'icon-dashboard' },
  },
  {
    path: 'socks',
    name: 'Socks',
    component: () => import('@/views/socks/index.vue'),
    meta: { title: '袜型管理', icon: 'icon-apps' },
  },
  {
    path: 'patterns',
    name: 'Patterns',
    component: () => import('@/views/patterns/index.vue'),
    meta: { title: '花型素材', icon: 'icon-palette' },
  },
  {
    path: 'orders',
    name: 'Orders',
    component: () => import('@/views/orders/index.vue'),
    meta: { title: '订单管理', icon: 'icon-file' },
  },
  {
    path: 'users',
    name: 'Users',
    component: () => import('@/views/users/index.vue'),
    meta: { title: '用户管理', icon: 'icon-user-group' },
  },
  {
    path: 'banners',
    name: 'Banners',
    component: () => import('@/views/banners/index.vue'),
    meta: { title: 'Banner 管理', icon: 'icon-image' },
  },
]

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Root',
    component: () => import('@/layout/default-layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: appRoutes,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/not-found/index.vue'),
  },
]
