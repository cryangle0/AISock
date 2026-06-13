/**
 * HTTP 请求封装（uni.request）
 * - 自动带 token、统一错误提示、401 跳登录
 * - 业务 code=0 视为成功
 */
import type { ApiResponse } from '@aisock/common/types'
import { API_BASE_URL, STORAGE_KEYS } from '@aisock/common/constants'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: object
  showLoading?: boolean
  loadingText?: string
  silent?: boolean
  /** 单次请求超时（ms）。不传则用 uni 默认（60s），AI 等长任务保持默认 */
  timeout?: number
}

const ERROR_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '没有权限访问',
  404: '请求的资源不存在',
  429: '操作过于频繁，请稍后再试',
  500: '服务器内部错误',
}

class Http {
  private baseURL = API_BASE_URL
  private isRedirecting = false

  private getToken(): string {
    return uni.getStorageSync(STORAGE_KEYS.TOKEN) || ''
  }

  private showError(message: string, silent?: boolean) {
    if (!silent) uni.showToast({ title: message, icon: 'none', duration: 2500 })
  }

  private handleUnauthorized() {
    if (this.isRedirecting) return
    this.isRedirecting = true
    uni.removeStorageSync(STORAGE_KEYS.TOKEN)
    uni.removeStorageSync(STORAGE_KEYS.USER_INFO)
    // 通知 Pinia store 清空内存登录态，避免 isLogin 与 storage 脱节后守卫误放行
    uni.$emit('auth:expired')
    // 记录回跳地址：登录成功后回到当前页（含 query），不丢失用户操作上下文
    try {
      const pages = getCurrentPages()
      const top = pages[pages.length - 1] as unknown as { route?: string; options?: Record<string, string> } | undefined
      if (top?.route && !top.route.includes('pages/login/')) {
        const qs = Object.entries(top.options || {})
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join('&')
        uni.setStorageSync(STORAGE_KEYS.LOGIN_RETURN_TO, `/${top.route}${qs ? `?${qs}` : ''}`)
      }
    } catch {
      /* 取不到页面栈时直接跳登录 */
    }
    uni.reLaunch({
      url: '/pages/login/index',
      complete: () => setTimeout(() => { this.isRedirecting = false }, 1500),
    })
  }

  request<T = unknown>(options: RequestOptions): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      if (options.showLoading !== false) {
        uni.showLoading({ title: options.loadingText || '加载中...', mask: true })
      }
      const token = this.getToken()
      uni.request({
        url: this.baseURL + options.url,
        method: options.method || 'GET',
        data: options.data,
        ...(options.timeout ? { timeout: options.timeout } : {}),
        header: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        success: (res) => {
          const status = res.statusCode
          const data = res.data as ApiResponse<T>
          if (status === 401) {
            this.handleUnauthorized()
            reject({ code: 401, message: '未登录' })
            return
          }
          if (status >= 400) {
            const msg = (data as { message?: string })?.message || ERROR_MESSAGES[status] || `请求失败(${status})`
            this.showError(msg, options.silent)
            reject({ code: status, message: msg })
            return
          }
          if (data.code === 0) {
            resolve(data)
          } else {
            this.showError(data.message, options.silent)
            reject(data)
          }
        },
        fail: () => {
          this.showError('网络请求失败，请检查网络', options.silent)
          reject({ code: -1, message: '网络请求失败' })
        },
        complete: () => {
          if (options.showLoading !== false) uni.hideLoading()
        },
      })
    })
  }

  get<T = unknown>(url: string, data?: object, options?: Partial<RequestOptions>) {
    return this.request<T>({ url, method: 'GET', data, ...options })
  }

  post<T = unknown>(url: string, data?: object, options?: Partial<RequestOptions>) {
    return this.request<T>({ url, method: 'POST', data, ...options })
  }

  put<T = unknown>(url: string, data?: object, options?: Partial<RequestOptions>) {
    return this.request<T>({ url, method: 'PUT', data, ...options })
  }

  delete<T = unknown>(url: string, data?: object, options?: Partial<RequestOptions>) {
    return this.request<T>({ url, method: 'DELETE', data, ...options })
  }
}

export const http = new Http()
export default http
