
/**
 * 微信小程序服务端接口封装
 * - code2session：code → openid
 * - getAccessToken：小程序全局 access_token（Redis 缓存）
 * - getPhoneNumber：手机号 code → 真实手机号（getuserphonenumber）
 *
 * 缺少 WX_APPID/WX_SECRET 时返回模拟数据，前端仍能走演示流程。
 */
import { getRedis, CacheKey } from '../redis.js'

/** 小程序：code → openid（jscode2session） */
export async function code2session(code: string): Promise<{ openid: string; unionid?: string; sessionKey?: string }> {
  const appid = process.env.WX_APPID
  const secret = process.env.WX_SECRET
  if (!appid || !secret) {
    return { openid: `dev_${code.slice(0, 16)}` }
  }
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
  const resp = await fetch(url)
  const data = (await resp.json()) as { openid?: string; unionid?: string; session_key?: string; errcode?: number; errmsg?: string }
  if (!data.openid) {
    throw Object.assign(new Error(`微信登录失败: ${data.errmsg || data.errcode}`), { status: 400 })
  }
  return { openid: data.openid, unionid: data.unionid, sessionKey: data.session_key }
}

/** 获取小程序全局 access_token（Redis 缓存，提前 5 分钟过期重取） */
export async function getAccessToken(): Promise<string> {
  const appid = process.env.WX_APPID
  const secret = process.env.WX_SECRET
  if (!appid || !secret) {
    throw Object.assign(new Error('未配置微信小程序密钥'), { status: 500 })
  }
  const redis = getRedis()
  const cached = await redis.get(CacheKey.WX_ACCESS_TOKEN)
  if (cached) return cached

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
  const resp = await fetch(url)
  const data = (await resp.json()) as { access_token?: string; expires_in?: number; errcode?: number; errmsg?: string }
  if (!data.access_token) {
    throw Object.assign(new Error(`获取 access_token 失败: ${data.errmsg || data.errcode}`), { status: 400 })
  }
  // 提前 300s 过期，避免边界失效
  const ttl = Math.max(60, (data.expires_in || 7200) - 300)
  await redis.set(CacheKey.WX_ACCESS_TOKEN, data.access_token, 'EX', ttl)
  return data.access_token
}

/**
 * 用手机号授权 code 换取用户真实手机号（小程序 getPhoneNumber）。
 * 缺密钥时返回空串，由调用方决定兜底。
 */
export async function getPhoneNumber(phoneCode: string): Promise<{ phone: string; countryCode?: string }> {
  const appid = process.env.WX_APPID
  const secret = process.env.WX_SECRET
  if (!appid || !secret) {
    return { phone: '' }
  }
  const token = await getAccessToken()
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${token}`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: phoneCode }),
  })
  const data = (await resp.json()) as {
    errcode?: number
    errmsg?: string
    phone_info?: { phoneNumber?: string; purePhoneNumber?: string; countryCode?: string }
  }
  const phone = data.phone_info?.purePhoneNumber || data.phone_info?.phoneNumber
  if (!phone) {
    throw Object.assign(new Error(`获取手机号失败: ${data.errmsg || data.errcode}`), { status: 400 })
  }
  return { phone, countryCode: data.phone_info?.countryCode }
}
