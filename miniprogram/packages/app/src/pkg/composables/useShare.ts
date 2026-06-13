/**
 * 小程序分享 —— 统一构建分享卡片内容（好友 / 朋友圈），并携带邀请人 id 打通邀励。
 *
 * 用法：在页面 setup 内调用 useShare(() => ({ title, path, imageUrl }))，
 * 它会注册 onShareAppMessage / onShareTimeline，分享路径自动拼接 ?inviterId=<当前用户>。
 */
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { useUserStore } from '@aisock/composition'

export interface ShareContent {
  /** 分享标题 */
  title: string
  /** 分享落地页路径（不含 query 时自动补 inviterId） */
  path?: string
  /** 分享封面图（好友卡片用） */
  imageUrl?: string
}

const DEFAULT_PATH = '/pages/home/index'

/** 给路径拼接 inviterId（当前已登录用户作为邀请人） */
function withInviter(path: string, inviterId?: number): string {
  if (!inviterId) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}inviterId=${inviterId}`
}

/**
 * 注册页面分享。
 * @param contentFn 返回当前要分享的内容（响应式：每次分享时实时取值）
 */
export function useShare(contentFn: () => ShareContent) {
  const userStore = useUserStore()
  const inviterId = () => (userStore.userInfo?.id as number | undefined)

  onShareAppMessage(() => {
    const c = contentFn()
    return {
      title: c.title || '爱花型 · AI 袜版定制',
      path: withInviter(c.path || DEFAULT_PATH, inviterId()),
      imageUrl: c.imageUrl,
    }
  })

  onShareTimeline(() => {
    const c = contentFn()
    return {
      title: c.title || '爱花型 · AI 袜版定制',
      query: inviterId() ? `inviterId=${inviterId()}` : '',
      imageUrl: c.imageUrl,
    }
  })
}
