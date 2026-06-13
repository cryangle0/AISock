/**
 * 站点品牌配置 —— Web/小程序通用的 logo、标题、品牌名、副标题、版权等。
 *
 * 存储：复用 app_config 表，key = 'site_config'，value 为 SiteConfig（JSON）。
 * 公开读取（访客可见），复用 config.service 的 Redis 短缓存。
 */
import { getPublicValue, upsertConfig } from './config.service.js'

export interface SiteConfig {
  /** 站点标题（浏览器 tab / SEO） */
  siteTitle: string
  /** 品牌中文名（顶栏/登录） */
  brandName: string
  /** 品牌英文副标题 */
  brandEn: string
  /** logo 图片 URL（空则前端用内置 /logo.png） */
  logoUrl: string
  /** favicon 图片 URL（空则用 logoUrl 或内置） */
  faviconUrl: string
  /** 登录页主标题 */
  loginTitle: string
  /** 登录页副标题 */
  loginSubtitle: string
  /** 页脚版权 */
  copyright: string
}

export const SITE_CONFIG_KEY = 'site_config'

/** 内置默认（与历史写死值一致，保证未配置时展示不变） */
export const BUILTIN_SITE: SiteConfig = {
  siteTitle: '爱花型 · AI 袜版设计',
  brandName: '爱花型 · 设计',
  brandEn: 'SOCK DESIGN',
  logoUrl: '',
  faviconUrl: '',
  loginTitle: 'AI 袜版设计系统',
  loginSubtitle: '从一根花线到成品，3 分钟出袜款，自由编辑模板，AI 同款一键延展',
  copyright: '爱花型袜业 · 2026',
}

/** 读取站点配置（缺字段用内置默认补全，向后兼容） */
export async function getSiteConfig(): Promise<SiteConfig> {
  const saved = await getPublicValue<Partial<SiteConfig>>(SITE_CONFIG_KEY, {})
  return { ...BUILTIN_SITE, ...(saved || {}) }
}

/** 保存站点配置（后台写入）。空串视为「未配置」，不覆盖内置默认
 *  （logoUrl/faviconUrl 例外：空串就是「用内置图」的合法语义） */
export async function saveSiteConfig(config: Partial<SiteConfig>): Promise<void> {
  const merged = { ...BUILTIN_SITE }
  ;(Object.keys(BUILTIN_SITE) as (keyof SiteConfig)[]).forEach((k) => {
    const v = config?.[k]
    if (typeof v === 'string' && (v.trim() || k === 'logoUrl' || k === 'faviconUrl')) {
      merged[k] = v.trim()
    }
  })
  await upsertConfig({
    configKey: SITE_CONFIG_KEY,
    title: '站点品牌配置',
    value: merged,
    status: 1,
    remark: 'Web/小程序通用品牌信息（logo/标题/品牌名/版权等）',
  })
}
