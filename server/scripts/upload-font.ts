/**
 * 把本地字体文件上传到 OSS 固定路径 fonts/ZCOOLKuaiLe-Regular.woff2。
 * 用法：cd server && npx tsx --env-file=.env scripts/upload-font.ts /tmp/ZCOOLKuaiLe-Regular.woff2
 */
import { readFileSync } from 'node:fs'
import { ossEnabled, putObject } from '../src/services/oss.service.js'

async function main() {
  const path = process.argv[2] || '/tmp/ZCOOLKuaiLe-Regular.woff2'
  if (!ossEnabled()) {
    console.error('OSS 未配置')
    process.exit(1)
  }
  const buf = readFileSync(path)
  const url = await putObject('fonts/ZCOOLKuaiLe-Regular.woff2', buf, 'font/woff2')
  console.log('上传成功:', url)
  // 回读校验
  const resp = await fetch(url)
  console.log('回读状态:', resp.status, resp.headers.get('content-type'))
}

main().catch((e) => {
  console.error('上传失败:', e?.message || e)
  process.exit(1)
})
