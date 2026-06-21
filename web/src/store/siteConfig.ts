import { defineStore } from 'pinia'
import { ref } from 'vue'
import { siteConfigApi, type SiteConfig } from '@/api'

/** 内置默认（与后端 BUILTIN_SITE 一致，保证首屏/接口失败时展示不变） */
const BUILTIN: SiteConfig = {
  siteTitle: '爱花型 · AI 袜版设计',
  brandName: '爱花型 · 设计',
  brandEn: 'SOCK DESIGN',
  logoUrl: '',
  faviconUrl: '',
  loginTitle: 'AI 袜版设计系统',
  loginSubtitle: '从一根花线到成品，3 分钟出袜款，自由编辑模板，AI 同款一键延展',
  copyright: '爱花型袜业 · 2026',
}

const FALLBACK_LOGO = `${import.meta.env.BASE_URL}logo.png`

export const useSiteConfigStore = defineStore('siteConfig', () => {
  const config = ref<SiteConfig>({ ...BUILTIN })
  const loaded = ref(false)

  /** logo / favicon 取配置值，空则回退内置文件 */
  function logo() {
    return config.value.logoUrl || FALLBACK_LOGO
  }
  function favicon() {
    return config.value.faviconUrl || config.value.logoUrl || FALLBACK_LOGO
  }

  /** 应用到 document：标题 + favicon */
  function applyToDocument() {
    if (typeof document === 'undefined') return
    document.title = config.value.siteTitle || BUILTIN.siteTitle
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = favicon()
  }

  /** 启动时拉取（失败保留内置默认，不阻断） */
  async function load() {
    if (loaded.value) return
    try {
      const res = await siteConfigApi.get()
      config.value = { ...BUILTIN, ...res.data }
    } catch {
      /* 保留内置默认 */
    } finally {
      loaded.value = true
      applyToDocument()
    }
  }

  return { config, loaded, logo, favicon, load, applyToDocument }
})
