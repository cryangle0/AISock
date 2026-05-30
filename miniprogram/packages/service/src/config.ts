import { http } from './http.js'

/** 运营配置块里的单条记录（主题/功能区/案例 通用结构） */
export interface ConfigItem {
  id: string
  title?: string
  en?: string
  icon?: string
  bg?: string
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
  return http.get<HomeConfig>('/api/v1/app/config/home', undefined, { showLoading: false })
}
