/**
 * 邀请人捕获 —— 从小程序启动参数 / 页面参数里取 inviterId 并暂存，
 * 登录时带给后端建立邀请关系（双方得 AI 额度）。
 */
const INVITER_KEY = 'aisock_inviter_id'

/** 记录邀请人 id（来自分享链接的 query.inviterId / scene） */
export function captureInviter(query?: Record<string, string> | null): void {
  const raw = query?.inviterId
  const id = Number(raw)
  if (id && id > 0) {
    try { uni.setStorageSync(INVITER_KEY, id) } catch { /* 忽略 */ }
  }
}

/** 读取暂存的邀请人 id（登录时用） */
export function getInviter(): number | undefined {
  try {
    const id = Number(uni.getStorageSync(INVITER_KEY))
    return id && id > 0 ? id : undefined
  } catch {
    return undefined
  }
}

/** 邀请关系建立后清除，避免重复绑定 */
export function clearInviter(): void {
  try { uni.removeStorageSync(INVITER_KEY) } catch { /* 忽略 */ }
}
