/**
 * axios 拦截器 —— 与后端统一响应（code=0 成功）对接
 * 复用 haiying-admin 的拦截器约定
 */
import axios from 'axios'
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { Message, Modal } from '@arco-design/web-vue'
import { useUserStore } from '@/store'
import { getToken } from '@/utils/auth'

export interface HttpResponse<T = unknown> {
  code: number
  message: string
  data: T
}

if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
}
axios.defaults.timeout = 30000

// 会话过期弹窗防重入：并发多个 401 时只弹一次
let isHandlingExpired = false

axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

axios.interceptors.response.use(
  (response: AxiosResponse<HttpResponse>) => {
    const res = response.data
    if (res.code !== 0) {
      Message.error({ content: res.message || '请求失败', duration: 4000 })
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res as any
  },
  (error) => {
    const msg = error?.response?.data?.message || error?.message || '网络请求失败'
    Message.error({ content: msg, duration: 4000 })
    // 401 → 会话过期：清登录态回登录页。
    // 排除登录接口本身（密码错误也是 401，不应触发登出+reload 把错误提示冲掉），
    // 且无 token 时跳过（登出接口连锁 401 会无限递归）。
    const status = error?.response?.status
    const url: string = error?.config?.url || ''
    const isLoginCall = url.includes('/admin/auth/login')
    if (status === 401 && !isLoginCall && getToken() && !isHandlingExpired) {
      isHandlingExpired = true
      Modal.error({
        title: '登录已过期',
        content: '登录已失效，请重新登录',
        okText: '重新登录',
        async onOk() {
          const userStore = useUserStore()
          await userStore.logout()
          window.location.reload()
        },
      })
    }
    return Promise.reject(error)
  },
)
