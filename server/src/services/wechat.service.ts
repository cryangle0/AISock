/**
 * 微信小程序：code → openid（jscode2session）
 * 缺少 WX_APPID/WX_SECRET 时返回模拟 openid，前端能继续走演示流程。
 */
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
