import { defineStore } from 'pinia'
import { ref } from 'vue'
import { catalogApi } from '@aisock/service'
import type { SockModel, PatternCategory } from '@aisock/common/types'

/** 袜型 / 花型分类等目录数据缓存（多页面共享，避免重复请求） */
export const useCatalogStore = defineStore('catalog', () => {
  const socks = ref<SockModel[]>([])
  const categories = ref<PatternCategory[]>([])
  const loaded = ref(false)

  async function ensureLoaded() {
    if (loaded.value) return
    const [s, c] = await Promise.all([catalogApi.listSocks(), catalogApi.listPatternCategories()])
    socks.value = s.data
    categories.value = c.data
    loaded.value = true
  }

  return { socks, categories, loaded, ensureLoaded }
})
