/**
 * 文件上传 —— 把本地临时路径上传到后端 /upload，返回可访问 URL（OSS 或本地）。
 * 用 uni.uploadFile（multipart/form-data），自动带 token。
 */
import { API_BASE_URL, STORAGE_KEYS } from '@aisock/common/constants'

export interface UploadResult {
  id: number
  name: string
  url: string
  path: string
  size: number
  mime: string
}

/** 上传单个本地文件，resolve 后端返回的文件 URL 信息 */
export function uploadFile(tempFilePath: string): Promise<UploadResult> {
  const token = uni.getStorageSync(STORAGE_KEYS.TOKEN) || ''
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/api/v1/app/upload`,
      filePath: tempFilePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const body = JSON.parse(res.data) as { code: number; data: UploadResult; message: string }
          if (body.code === 0) resolve(body.data)
          else reject(new Error(body.message || '上传失败'))
        } catch {
          reject(new Error('上传响应解析失败'))
        }
      },
      fail: () => reject(new Error('上传失败，请检查网络')),
    })
  })
}
