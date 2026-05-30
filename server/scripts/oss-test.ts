/**
 * OSS 上传连通性测试：上传一张 1x1 PNG 到 ai/_test/，打印可访问 URL 并回读校验。
 * 用法：在 server 目录下 `npx tsx --env-file=.env scripts/oss-test.ts`
 */
import { ossEnabled, putObject, genObjectKey } from '../src/services/oss.service.js'

async function main() {
  console.log('ossEnabled =', ossEnabled())
  if (!ossEnabled()) {
    console.log('未配置 OSS 凭证，跳过')
    return
  }
  // 1x1 透明 PNG
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  )
  const key = genObjectKey('ai/_test', 'png')
  console.log('上传 key =', key)
  const url = await putObject(key, png, 'image/png')
  console.log('上传成功 url =', url)

  // 回读校验
  const resp = await fetch(url)
  console.log('回读状态 =', resp.status, 'content-type =', resp.headers.get('content-type'))
}

main().catch((e) => {
  console.error('OSS 测试失败:', e?.message || e)
  process.exit(1)
})
