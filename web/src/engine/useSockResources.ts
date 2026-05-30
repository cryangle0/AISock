/**
 * Vue 组合式封装 — 按袜型异步加载袜版资源，自动随 sockTypeId 变化重载。
 * 资源做进程内缓存，切换袜型再切回来不重复解析。
 */
import { ref, shallowRef, watch, type Ref } from 'vue'
import { buildSockResources } from './sockMasks'
import { EMPTY_RESOURCES, type SockResources } from './types'

const RES_CACHE = new Map<string, SockResources>()

export function useSockResources(sockTypeId: Ref<string>) {
  const resources = shallowRef<SockResources>(EMPTY_RESOURCES)
  const loading = ref(false)

  async function load(id: string) {
    const cached = RES_CACHE.get(id)
    if (cached) {
      resources.value = cached
      return
    }
    loading.value = true
    try {
      const res = await buildSockResources(id)
      if (res.ready) RES_CACHE.set(id, res)
      // 仅当仍是当前请求的袜型才写入，避免竞态
      if (sockTypeId.value === id) resources.value = res
    } finally {
      loading.value = false
    }
  }

  watch(sockTypeId, (id) => load(id), { immediate: true })

  return { resources, loading }
}
