import axios from 'axios'

/** 小程序运营配置项（key→JSON） */
export interface AppConfig {
  id: number
  config_key: string
  title: string | null
  value: ConfigItem[]
  status: number
  remark: string | null
  updated_at: string
}

/** 配置块里的单条记录（主题/功能区/案例 通用结构） */
export interface ConfigItem {
  id: string
  title?: string
  en?: string
  icon?: string
  bg?: string
  /** 封面图 URL（首页主题/案例卡片图片） */
  cover?: string
  /** 商品详情描述等多行文案 */
  desc?: string
  themeKey?: string
  link?: string
  [k: string]: unknown
}

export function listConfigs() {
  return axios.get<AppConfig[]>('/api/v1/admin/config')
}

export function getConfig(key: string) {
  return axios.get<AppConfig>(`/api/v1/admin/config/${key}`)
}

export function saveConfig(data: { configKey: string; title?: string; value: ConfigItem[]; status?: number; remark?: string }) {
  return axios.post('/api/v1/admin/config', data)
}

export function updateConfigValue(key: string, value: ConfigItem[], status?: number) {
  return axios.put(`/api/v1/admin/config/${key}`, { value, status })
}

export function deleteConfig(key: string) {
  return axios.delete(`/api/v1/admin/config/${key}`)
}
