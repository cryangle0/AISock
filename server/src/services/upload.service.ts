/**
 * 文件上传：默认本地磁盘（uploads/），生产环境配置 OSS 凭证后切换。
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { execute } from '../db.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads')
const PUBLIC_BASE = process.env.UPLOAD_BASE_URL || `http://localhost:${process.env.PORT || 8199}/uploads`

export interface UploadResult {
  id: number
  name: string
  url: string
  path: string
  size: number
  mime: string
}

function genName(orig: string): string {
  const ext = path.extname(orig).toLowerCase().slice(0, 8)
  const id = randomBytes(8).toString('hex')
  const d = new Date()
  const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
  return `${yyyymm}/${id}${ext}`
}

/**
 * 落本地磁盘 + 写库。生产可替换为 OSS putObject。
 */
export async function saveBuffer(
  userId: number | null,
  origName: string,
  mime: string,
  data: Buffer,
): Promise<UploadResult> {
  const relPath = genName(origName)
  const abs = path.join(UPLOAD_DIR, relPath)
  await mkdir(path.dirname(abs), { recursive: true })
  await writeFile(abs, data)
  const url = `${PUBLIC_BASE}/${relPath.replace(/\\/g, '/')}`
  const r = await execute(
    'INSERT INTO `upload` (user_id, name, mime, size, path, url) VALUES (?,?,?,?,?,?)',
    [userId, origName, mime, data.byteLength, relPath, url],
  )
  return { id: r.insertId, name: origName, url, path: relPath, size: data.byteLength, mime }
}

/** OSS hook：未配置 OSS_ACCESS_KEY 时返回 null，调用方走本地。 */
export function ossEnabled(): boolean {
  return !!(process.env.OSS_ACCESS_KEY && process.env.OSS_SECRET_KEY && process.env.OSS_BUCKET)
}
