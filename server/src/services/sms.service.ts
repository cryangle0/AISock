/**
 * 短信下发
 * - SMS_PROVIDER=dev 或缺凭证：打日志（前端开发用固定 1234）
 * - SMS_PROVIDER=aliyun：直接用阿里云 SMS RPC 风格签名请求（无需额外 SDK 依赖）
 */
import { createHmac, randomUUID } from 'node:crypto'

const PROVIDER = process.env.SMS_PROVIDER || 'dev'

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~')
}

/** 阿里云 RPC 签名（HMAC-SHA1） */
function aliyunSign(params: Record<string, string>, secret: string): string {
  const sortedKeys = Object.keys(params).sort()
  const canonical = sortedKeys.map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`).join('&')
  const stringToSign = `GET&${percentEncode('/')}&${percentEncode(canonical)}`
  const sign = createHmac('sha1', `${secret}&`).update(stringToSign).digest('base64')
  return sign
}

async function sendAliyun(phone: string, code: string): Promise<void> {
  const accessKey = process.env.SMS_ACCESS_KEY!
  const accessSecret = process.env.SMS_SECRET_KEY!
  const signName = process.env.SMS_SIGN_NAME || ''
  const templateCode = process.env.SMS_TEMPLATE_CODE || ''
  const region = process.env.SMS_REGION || 'cn-hangzhou'

  const params: Record<string, string> = {
    AccessKeyId: accessKey,
    Action: 'SendSms',
    Format: 'JSON',
    PhoneNumbers: phone,
    RegionId: region,
    SignName: signName,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: randomUUID(),
    SignatureVersion: '1.0',
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2017-05-25',
  }
  params.Signature = aliyunSign(params, accessSecret)

  const qs = Object.keys(params)
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&')
  const url = `https://dysmsapi.aliyuncs.com/?${qs}`

  const resp = await fetch(url)
  const data = (await resp.json()) as { Code?: string; Message?: string }
  if (data.Code !== 'OK') {
    throw new Error(`阿里云短信失败: ${data.Code} ${data.Message}`)
  }
}

export async function sendSms(phone: string, code: string): Promise<void> {
  if (PROVIDER === 'aliyun' && process.env.SMS_ACCESS_KEY && process.env.SMS_SIGN_NAME) {
    try {
      await sendAliyun(phone, code)
      console.log(`[sms:aliyun] sent -> ${phone}`)
      return
    } catch (err: any) {
      console.error(`[sms:aliyun] 发送失败，回退日志: ${err.message}`)
    }
  }
  console.log(`[sms:dev] -> ${phone} : ${code}`)
}
