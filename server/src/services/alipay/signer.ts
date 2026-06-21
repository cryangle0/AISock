/**
 * 支付宝开放平台 RSA2 签名 / 验签 —— 纯 node:crypto 实现，无第三方 SDK。
 *
 * 依赖凭证（来自环境变量）：
 *   ALIPAY_APPID                       应用 APPID
 *   ALIPAY_MERCHANT_PRIVATE_KEY_PATH   应用私钥 PEM 文件路径（PKCS8，-----BEGIN PRIVATE KEY-----）
 *   ALIPAY_PUBLIC_KEY_PATH             支付宝公钥 PEM 文件路径（用于验签回调）
 *   （或 ALIPAY_MERCHANT_PRIVATE_KEY / ALIPAY_PUBLIC_KEY 直接内联 PEM 文本）
 */
import { createSign, createVerify } from 'node:crypto'
import { readFileSync } from 'node:fs'

let cachedPrivateKey: string | null = null
let cachedPublicKey: string | null = null

function loadKey(path: string | undefined, inline: string | undefined, wrapType?: 'RSA PRIVATE KEY' | 'PUBLIC KEY'): string | null {
  let raw: string | null = null
  if (inline && inline.includes('BEGIN')) {
    raw = inline.replace(/\\n/g, '\n')
  } else if (inline && inline.trim() && !path) {
    raw = inline.trim()
  } else if (path) {
    try {
      raw = readFileSync(path, 'utf-8')
    } catch {
      return null
    }
  }
  if (!raw) return null
  raw = raw.trim()
  // 支持「裸 base64」密钥（无 PEM 头）：自动补 PEM 包装
  if (!raw.includes('BEGIN') && wrapType) {
    const body = raw.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n') ?? raw
    raw = `-----BEGIN ${wrapType}-----\n${body}\n-----END ${wrapType}-----`
  }
  return raw
}

/** 应用私钥（签名用） */
export function getPrivateKey(): string | null {
  if (cachedPrivateKey) return cachedPrivateKey
  cachedPrivateKey = loadKey(
    process.env.ALIPAY_MERCHANT_PRIVATE_KEY_PATH,
    process.env.ALIPAY_MERCHANT_PRIVATE_KEY,
    'RSA PRIVATE KEY',
  )
  return cachedPrivateKey
}

/** 支付宝公钥（验签回调用） */
export function getPublicKey(): string | null {
  if (cachedPublicKey) return cachedPublicKey
  cachedPublicKey = loadKey(process.env.ALIPAY_PUBLIC_KEY_PATH, process.env.ALIPAY_PUBLIC_KEY, 'PUBLIC KEY')
  return cachedPublicKey
}

/** 是否具备支付宝下单能力（APPID + 应用私钥就绪） */
export function canAlipay(): boolean {
  return !!(process.env.ALIPAY_APPID && getPrivateKey())
}

/** 待签名串：参数按 key 升序，过滤空值与 sign，拼成 k=v&k=v（值不做 url 编码） */
function buildSignContent(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
}

/** RSA2（SHA256withRSA）签名，返回 base64 */
export function sign(params: Record<string, string>): string {
  const privateKey = getPrivateKey()
  if (!privateKey) throw new Error('缺少支付宝应用私钥')
  const content = buildSignContent(params)
  return createSign('RSA-SHA256').update(content, 'utf-8').sign(privateKey, 'base64')
}

/** 验签：用支付宝公钥校验回调参数（异步通知 / 同步跳转） */
export function verify(params: Record<string, string>, signature: string): boolean {
  const publicKey = getPublicKey()
  if (!publicKey) return false
  const content = buildSignContent(params)
  try {
    return createVerify('RSA-SHA256').update(content, 'utf-8').verify(publicKey, signature, 'base64')
  } catch {
    return false
  }
}
