/**
 * ImageUploadButton — 小程序统一的图片上传入口
 *
 * 同时支持：
 *   - 拍照（capture="environment"，移动端调系统相机）
 *   - 从相册选取（普通 file input）
 *   - 也允许选其他文件（accept 控制）
 *
 * 桌面浏览器 capture 属性会被忽略，自动 fallback 到普通选择，
 * 在真机微信/小程序运行时会正确触发拍照流程。
 */
import { useRef, useState } from 'react'
import { Camera, ImageIcon, Upload } from 'lucide-react'

export default function ImageUploadButton({
  onPick,
  label = '上传',
  accept = 'image/*',
  multiple = false,
  variant = 'primary',  // 'primary' | 'mini' | 'block'
  fileMode = false,     // true 时按钮直接打开文件选择（不弹出来源菜单）
}) {
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const fileRef = useRef(null)
  const [open, setOpen] = useState(false)

  const handlePick = (e) => {
    const list = Array.from(e.target.files || [])
    if (list.length) onPick?.(multiple ? list : list[0])
    e.target.value = ''
    setOpen(false)
  }

  const trigger = (which) => {
    setOpen(false)
    if (which === 'camera') cameraRef.current?.click()
    else if (which === 'file') fileRef.current?.click()
    else galleryRef.current?.click()
  }

  const cls =
    variant === 'mini'  ? 'mp-mini-btn' :
    variant === 'block' ? 'mp-cta-secondary' :
                          'mp-cta-primary'

  if (fileMode) {
    return (
      <>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handlePick}
          hidden
        />
        <button type="button" className={cls} onClick={() => trigger('file')}>
          <Upload size={12} /> {label}
        </button>
      </>
    )
  }

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePick}
        hidden
      />
      <input
        ref={galleryRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handlePick}
        hidden
      />

      <button type="button" className={cls} onClick={() => setOpen((v) => !v)}>
        <Upload size={12} /> {label}
      </button>

      {open && (
        <div className="mp-upload-source-mask" onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false)
        }}>
          <div className="mp-upload-source">
            <button className="mp-upload-source-item" onClick={() => trigger('camera')}>
              <Camera size={18} strokeWidth={1.6} />
              <span>拍照</span>
              <small>调用相机</small>
            </button>
            <button className="mp-upload-source-item" onClick={() => trigger('gallery')}>
              <ImageIcon size={18} strokeWidth={1.6} />
              <span>从相册</span>
              <small>本地图片</small>
            </button>
            <button className="mp-upload-source-cancel" onClick={() => setOpen(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </>
  )
}
