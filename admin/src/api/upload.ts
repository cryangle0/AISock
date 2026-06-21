import axios from 'axios'

export interface UploadResult {
  id: number
  name: string
  url: string
  path: string
  size: number
  mime: string
}

/**
 * 后台图片上传：multipart/form-data → 转存 OSS（后端 saveBuffer）→ 返回可访问 URL。
 * 不手动设置 Content-Type，交给浏览器带 boundary。
 */
export function uploadImage(file: File) {
  const form = new FormData()
  form.append('file', file)
  return axios.post<unknown, { data: UploadResult }>('/api/v1/admin/upload', form)
}
