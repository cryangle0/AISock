import { http } from './http.js'
import type { UserInfo } from '@aisock/common/types'

export function smsSend(phone: string) {
  return http.post('/api/v1/app/auth/sms-send', { phone })
}

export function smsLogin(phone: string, code: string) {
  return http.post<{ token: string; user: UserInfo }>('/api/v1/app/auth/sms-login', { phone, code })
}

export function wechatLogin(openid: string) {
  return http.post<{ token: string; user: UserInfo }>('/api/v1/app/auth/wechat-login', { openid })
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
