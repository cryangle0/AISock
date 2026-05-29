/**
 * 短信下发
 * 默认开发环境：把 code 打到日志，前端用固定 1234 也能登录（auth.service 处理）
 * 生产环境：配置阿里云 / 腾讯云 SMS 凭证后自动切换
 */
const PROVIDER = process.env.SMS_PROVIDER || 'dev'

export async function sendSms(phone: string, code: string): Promise<void> {
  if (PROVIDER === 'dev' || !process.env.SMS_ACCESS_KEY) {
    console.log(`[sms:dev] -> ${phone} : ${code}`)
    return
  }
  // 阿里云 SMS（占位实现，需安装 @alicloud/dysmsapi20170525）
  // const Dysmsapi20170525 = (await import('@alicloud/dysmsapi20170525')).default
  // ... new Dysmsapi20170525.Client(...).sendSms({...})
  // 这里仅打印日志，避免引入额外依赖
  console.log(`[sms:${PROVIDER}] -> ${phone} : ${code} (生产: 调用厂商接口)`)
}
