import axios from 'axios'

/** 站点品牌配置 */
export interface SiteConfig {
  siteTitle: string
  brandName: string
  brandEn: string
  logoUrl: string
  faviconUrl: string
  loginTitle: string
  loginSubtitle: string
  copyright: string
}

export function getSiteConfig() {
  return axios.get<{ config: SiteConfig; builtinDefault: SiteConfig }>('/api/v1/admin/site-config')
}

export function saveSiteConfig(config: SiteConfig) {
  return axios.put('/api/v1/admin/site-config', config)
}
