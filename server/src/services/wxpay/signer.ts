/**
 * 微信支付 V3 签名 / 验签 / 回调解密 —— 纯 crypto 实现，无第三方依赖。
 *
 * 依赖凭证（来自环境变量）：
 *   WXPAY_MCHID            商户号
 *   WXPAY_SERIAL           商户证书序列号
 *   WXPAY_APIV3_KEY        APIv3 密钥（32 字节，用于回调 AEAD 解密）
 *   WXPAY_PRIVATE_KEY_PATH 商户 API 私钥 apiclient_key.pem 路径
 *   （或 WXPAY_PRIVATE_KEY 直接内联 PEM 文本）
 */
import { createSign, createDecipheriv, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'

let cachedPrivateKey: string | null = null

/** 读取商户 API 私钥（文件优先，其次内联环境变量） */
export function getPrivateKey(): string | null {
  if (cachedPrivateKey) return cachedPrivateKey
  const inline = process.env.WXPAY_PRIVATE_KEY
  if (inline && inline.includes('BEGIN')) {
    cachedPrivateKey = inline.replace(/\\n/g, '\n')
    return cachedPrivateKey
  }
  const path = process.env.WXPAY_PRIVATE_KEY_PATH
  if (path) {
    try {
      cachedPrivateKey = readFileSync(path, 'utf-8')
      return cachedPrivateKey
    } catch {
      return null
    }
  }
  return null
}

/** 是否具备真实下单能力（私钥就绪） */
export function canRealPay(): boolean {
  return !!(process.env.WXPAY_MCHID && process.env.WXPAY_SERIAL && getPrivateKey())
}

/**
 * 构造 Authorization 头（商户私钥对 请求方法+URL+时间戳+随机串+body 做 SHA256-RSA 签名）
 */
export function buildAuthToken(method: string, urlPath: string, body: string): string {
  const mchid = process.env.WXPAY_MCHID!
  const serialNo = process.env.WXPAY_SERIAL!
  const privateKey = getPrivateKey()!
  const nonceStr = randomBytes(16).toString('hex').toUpperCase()
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${body}\n`
  const signature = createSign('RSA-SHA256').update(message).sign(privateKey, 'base64')
  return (
    `WECHATPAY2-SHA256-RSA2048 ` +
    `mchid="${mchid}",nonce_str="${nonceStr}",signature="${signature}",` +
    `timestamp="${timestamp}",serial_no="${serialNo}"`
  )
}

/**
 * 生成小程序 wx.requestPayment 所需的支付参数（用商户私钥签名 prepay_id）
 */
export function buildJsapiPayParams(appid: string, prepayId: string): {
  timeStamp: string
  nonceStr: string
  package: string
  signType: 'RSA'
  paySign: string
} {
  const privateKey = getPrivateKey()!
  const timeStamp = Math.floor(Date.now() / 1000).toString()
  const nonceStr = randomBytes(16).toString('hex').toUpperCase()
  const pkg = `prepay_id=${prepayId}`
  const message = `${appid}\n${timeStamp}\n${nonceStr}\n${pkg}\n`
  const paySign = createSign('RSA-SHA256').update(message).sign(privateKey, 'base64')
  return { timeStamp, nonceStr, package: pkg, signType: 'RSA', paySign }
}

/**
 * 回调通知解密：AEAD-AES-256-GCM。
 * @param ciphertext base64 密文
 * @param nonce      随机串
 * @param associatedData 附加数据
 * @returns 明文 JSON 字符串
 */
export function decryptNotify(ciphertext: string, nonce: string, associatedData: string): string {
  const key = process.env.WXPAY_APIV3_KEY
  if (!key) throw new Error('缺少 WXPAY_APIV3_KEY')
  const data = Buffer.from(ciphertext, 'base64')
  const authTagLength = 16
  const authTag = data.subarray(data.length - authTagLength)
  const payload = data.subarray(0, data.length - authTagLength)
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'utf-8'), Buffer.from(nonce, 'utf-8'))
  decipher.setAuthTag(authTag)
  decipher.setAAD(Buffer.from(associatedData, 'utf-8'))
  return Buffer.concat([decipher.update(payload), decipher.final()]).toString('utf-8')
}
