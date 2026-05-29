/**
 * assetStore — 素材库本地存储（公共库 + 个人库）
 *
 * 公共库 (publicAssets)
 *   后台管理员可增删改，所有用户共享。当前未实现真实后台，前端用
 *   localStorage 模拟管理员对内置 PATTERN_LIST 的扩展。
 *
 * 个人库 (userAssets)
 *   登录用户自己上传的图片，可在编辑器中作为印花直接使用。
 *
 * 数据结构：
 *   { id, name, url(dataURL), tags[], source:'official|admin|user',
 *     createdAt, online?:boolean(public 用) }
 */

const KEY_PUBLIC = 'aisock.publicAssets'
const KEY_USER = 'aisock.userAssets'

const safeRead = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback }
  catch { return fallback }
}

const safeWrite = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)) }
  catch (e) { console.warn(`saveLocal ${k} failed:`, e?.message) }
}

export const loadPublicAssets = () => safeRead(KEY_PUBLIC, [])
export const savePublicAssets = (list) => safeWrite(KEY_PUBLIC, list)

export const loadUserAssets = () => safeRead(KEY_USER, [])
export const saveUserAssets = (list) => safeWrite(KEY_USER, list)

/** 把单张图片压到指定最大宽度，避免 localStorage 爆掉 */
export const compressImage = (dataURL, maxW = 320) => new Promise((resolve) => {
  const img = new Image()
  img.onload = () => {
    const ratio = img.width / img.height
    const w = Math.min(maxW, img.width)
    const h = Math.round(w / ratio)
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    c.getContext('2d').drawImage(img, 0, 0, w, h)
    try { resolve(c.toDataURL('image/png')) }
    catch { resolve(dataURL) }
  }
  img.onerror = () => resolve(dataURL)
  img.src = dataURL
})

export const fileToDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = (e) => resolve(e.target.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})
