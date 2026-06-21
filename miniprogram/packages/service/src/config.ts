import { http } from './http.js'

/** 运营配置块里的单条记录（主题/功能区/案例 通用结构） */
export interface ConfigItem {
  id: string
  title?: string
  en?: string
  icon?: string
  bg?: string
  themeKey?: string
  link?: string
  [k: string]: unknown
}

export interface HomeConfig {
  themes: ConfigItem[]
  zones: ConfigItem[]
  cases: ConfigItem[]
}

/** 首页运营配置（主题/功能区/案例），后台可配，访客可读 */
export function getHomeConfig() {
  // 启动期非关键请求：静默 + 8s 快速超时，失败回退默认配置，不打断首屏
  return http.get<HomeConfig>('/api/v1/app/config/home', undefined, { showLoading: false, silent: true, timeout: 8000 })
}

/** 按 key 读取单个运营配置块（如 upload_refs 灵感参考） */
export function getConfigBlock(key: string) {
  return http.get<ConfigItem[]>(`/api/v1/app/config/${key}`, undefined, { showLoading: false, silent: true, timeout: 8000 })
}
