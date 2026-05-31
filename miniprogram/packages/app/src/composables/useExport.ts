/**
 * 设计导出 —— 把袜版画布保存到手机相册（PNG / JPG）。
 * 处理相册授权流程：未授权时引导用户去设置页开启。
 */

export type ExportFileType = 'png' | 'jpg'

/** 保存临时图片到相册，返回是否成功；失败已给用户提示 */
function saveToAlbum(tempFilePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    uni.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        uni.showToast({ title: '已保存到相册', icon: 'success' })
        resolve(true)
      },
      fail: (err: { errMsg?: string }) => {
        // 用户拒绝授权：引导去设置开启
        if (err?.errMsg && err.errMsg.indexOf('auth') !== -1) {
          uni.showModal({
            title: '需要相册权限',
            content: '请在设置中开启「保存到相册」权限后重试',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) uni.openSetting() },
          })
        } else {
          uni.showToast({ title: '保存失败，请重试', icon: 'none' })
        }
        resolve(false)
      },
    })
  })
}

/**
 * 导出袜版到相册。
 * @param exportImage 画布导出方法（来自 SockCanvas，返回临时路径）
 * @param fileType    png | jpg
 */
export async function exportDesignToAlbum(
  exportImage: (t: ExportFileType) => Promise<string>,
  fileType: ExportFileType,
): Promise<void> {
  uni.showLoading({ title: '导出中…', mask: true })
  try {
    const temp = await exportImage(fileType)
    uni.hideLoading()
    if (!temp) {
      uni.showToast({ title: '导出失败，请稍后重试', icon: 'none' })
      return
    }
    await saveToAlbum(temp)
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '导出失败，请稍后重试', icon: 'none' })
  }
}
