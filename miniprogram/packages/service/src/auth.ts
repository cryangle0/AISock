import { http } from './http.js'
import type { UserInfo } from '@aisock/common/types'

export function smsSend(phone: string) {
  return http.post('/api/v1/app/auth/sms-send', { phone })
}

export function smsLogin(phone: string, code: string) {
  return http.post<{ token: string; user: UserInfo }>('/api/v1/app/auth/sms-login', { phone, code })
}

/** 手机号 + 密码登录 */
export function passwordLogin(phone: string, password: string) {
  return http.post<{ token: string; user: UserInfo }>('/api/v1/app/auth/password-login', { phone, password })
}

export function wechatLoginByCode(code: string, inviterId?: number) {
  return http.post<{ token: string; user: UserInfo }>('/api/v1/app/auth/wechat-login', { code, inviterId })
}

/** 微信一键登录：登录 code + 手机号授权 code（getPhoneNumber） */
export function wechatLoginWithPhone(code: string, phoneCode: string, inviterId?: number) {
  return http.post<{ token: string; user: UserInfo }>('/api/v1/app/auth/wechat-login', { code, phoneCode, inviterId })
}

export function logout() {
  return http.post('/api/v1/app/auth/logout', {}, { silent: true })
}

/** 绑定微信 openid（手机号/密码登录用户支付前补授权；code 来自 uni.login） */
export function bindWechat(code: string) {
  return http.post<{ bound: boolean }>('/api/v1/app/auth/bind-wechat', { code }, { silent: true, showLoading: false })
}

// ── PC 扫码登录（小程序侧）──
/** 标记已扫码（可选，用于 Web 端展示「已扫码」态） */
export function qrScanned(sceneId: string) {
  return http.post('/api/v1/app/qr-login/scanned', { sceneId }, { silent: true })
}

/** 确认 PC 登录（已登录用户授权） */
export function qrConfirm(sceneId: string) {
  return http.post<{ confirmed: boolean }>('/api/v1/app/qr-login/confirm', { sceneId })
}
