// 一次性上传 cdn-upload/aisock/** 到阿里云 OSS（bucket: onnsa），key 保留相对路径。
// 复用后端 oss.service.ts 的 V1 签名实现。仅新增对象，不删除/覆盖其它文件。
// 用法：node cdn-upload/upload-oss.mjs
import { createHash, createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const ACCESS_KEY = process.env.OSS_ACCESS_KEY
const SECRET_KEY = process.env.OSS_SECRET_KEY
const BUCKET = process.env.OSS_BUCKET || 'onnsa'
const ENDPOINT = process.env.OSS_ENDPOINT || 'oss-cn-hangzhou.aliyuncs.com'
const CDN = process.env.OSS_CDN_DOMAIN || 'cdn.onnsa.cn'

const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }

function walk(dir) {
  const out = []
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

async function putObject(objectKey, data, mime) {
  const date = new Date().toUTCString()
  const contentMd5 = createHash('md5').update(data).digest('base64')
  const resource = `/${BUCKET}/${objectKey}`
  const stringToSign = ['PUT', contentMd5, mime, date, resource].join('\n')
  const signature = createHmac('sha1', SECRET_KEY).update(stringToSign).digest('base64')
  const host = `${BUCKET}.${ENDPOINT}`
  const resp = await fetch(`https://${host}/${objectKey}`, {
    method: 'PUT',
    headers: {
      Host: host,
      Date: date,
      'Content-Type': mime,
      'Content-MD5': contentMd5,
      Authorization: `OSS ${ACCESS_KEY}:${signature}`,
    },
    body: data,
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`OSS PUT ${resp.status}: ${text.slice(0, 200)}`)
  }
  return `https://${CDN}/${objectKey}`
}

async function main() {
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.error('缺少 OSS_ACCESS_KEY / OSS_SECRET_KEY 环境变量')
    process.exit(1)
  }
  const root = path.dirname(fileURLToPath(import.meta.url))
  const baseDir = path.join(root, 'aisock')
  const files = walk(baseDir)
  for (const f of files) {
    const key = 'aisock/' + path.relative(baseDir, f).split(path.sep).join('/')
    const ext = path.extname(f).slice(1).toLowerCase()
    const mime = MIME[ext] || 'application/octet-stream'
    const url = await putObject(key, readFileSync(f), mime)
    console.log('OK', url)
  }
  console.log('全部上传完成')
}
main().catch((e) => { console.error('上传失败:', e.message); process.exit(1) })
