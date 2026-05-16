/**
 * useAssetLibrary — 共享的素材库 hook（公共库 + 个人库）
 *
 * 提供：
 *   - publicAssets / userAssets（实时同步 localStorage）
 *   - addUserAsset(file) / removeUserAsset(id)
 *   - addPublicAsset(file) / removePublicAsset(id) / togglePublicOnline(id)
 */
import { useCallback, useEffect, useState } from 'react'
import {
  compressImage, fileToDataURL,
  loadPublicAssets, loadUserAssets, savePublicAssets, saveUserAssets,
} from './assetStore'

let listeners = []
const broadcast = () => listeners.forEach((fn) => fn())

export default function useAssetLibrary() {
  const [publicAssets, setPublicAssets] = useState(loadPublicAssets)
  const [userAssets, setUserAssets] = useState(loadUserAssets)

  useEffect(() => {
    const sync = () => {
      setPublicAssets(loadPublicAssets())
      setUserAssets(loadUserAssets())
    }
    listeners.push(sync)
    return () => { listeners = listeners.filter((l) => l !== sync) }
  }, [])

  const addUserAsset = useCallback(async (file) => {
    if (!file?.type?.startsWith('image/')) return null
    const raw = await fileToDataURL(file)
    const url = await compressImage(raw, 360)
    const item = {
      id: `u-${Date.now()}`,
      name: file.name?.replace(/\.[^/.]+$/, '') || '我的素材',
      url,
      tags: ['我的'],
      source: 'user',
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    const next = [item, ...loadUserAssets()].slice(0, 100)
    saveUserAssets(next)
    setUserAssets(next)
    broadcast()
    return item
  }, [])

  const removeUserAsset = useCallback((id) => {
    const next = loadUserAssets().filter((a) => a.id !== id)
    saveUserAssets(next)
    setUserAssets(next)
    broadcast()
  }, [])

  const addPublicAsset = useCallback(async (file) => {
    if (!file?.type?.startsWith('image/')) return null
    const raw = await fileToDataURL(file)
    const url = await compressImage(raw, 480)
    const item = {
      id: `p-${Date.now()}`,
      name: file.name?.replace(/\.[^/.]+$/, '') || '管理员素材',
      url,
      tags: ['官方', '上架'],
      source: 'admin',
      online: true,
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    const next = [item, ...loadPublicAssets()]
    savePublicAssets(next)
    setPublicAssets(next)
    broadcast()
    return item
  }, [])

  const removePublicAsset = useCallback((id) => {
    const next = loadPublicAssets().filter((a) => a.id !== id)
    savePublicAssets(next)
    setPublicAssets(next)
    broadcast()
  }, [])

  const togglePublicOnline = useCallback((id) => {
    const next = loadPublicAssets().map((a) =>
      a.id === id ? { ...a, online: !a.online } : a,
    )
    savePublicAssets(next)
    setPublicAssets(next)
    broadcast()
  }, [])

  return {
    publicAssets,
    userAssets,
    addUserAsset,
    removeUserAsset,
    addPublicAsset,
    removePublicAsset,
    togglePublicOnline,
  }
}
