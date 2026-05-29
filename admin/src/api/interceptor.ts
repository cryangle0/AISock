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
      if (res.code === 10001 || response.status === 401) {
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
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res as any
  },
  (error) => {
    const msg = error?.response?.data?.message || error?.message || '网络请求失败'
    Message.error({ content: msg, duration: 4000 })
    if (error?.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout().then(() => window.location.reload())
    }
    return Promise.reject(error)
  },
)
