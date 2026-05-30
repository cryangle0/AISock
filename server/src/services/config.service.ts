/**
 * 小程序运营配置领域服务（app_config 表）。
 * key→JSON 单表存储，读多写少，app 端读取走 Redis 短缓存。
 */
import { query, queryOne, execute } from '../db.js'
import { getRedis } from '../redis.js'

export interface AppConfig {
  id: number
  config_key: string
  title: string | null
  value: unknown
  status: number
  remark: string | null
  updated_at: string
}

const CACHE_PREFIX = 'app:config:'
const CACHE_TTL = 60 // 秒

function parseValue(row: AppConfig): AppConfig {
  // mysql2 对 JSON 列已自动 parse；字符串兜底再 parse 一次
  if (typeof row.value === 'string') {
    try {
      row.value = JSON.parse(row.value)
    } catch {
      /* 保留原值 */
    }
  }
  return row
}

/** 后台：全部配置项（含停用） */
export async function listConfigs(): Promise<AppConfig[]> {
  const rows = await query<AppConfig>('SELECT * FROM app_config ORDER BY config_key ASC')
  return rows.map(parseValue)
}

/** 后台：单个配置项 */
export async function getConfig(key: string): Promise<AppConfig | null> {
  const row = await queryOne<AppConfig>('SELECT * FROM app_config WHERE config_key = ?', [key])
  return row ? parseValue(row) : null
}

/** app 端：取启用配置的 value（带 Redis 短缓存）；不存在返回 fallback */
export async function getPublicValue<T = unknown>(key: string, fallback: T): Promise<T> {
  const redis = getRedis()
  const cacheKey = `${CACHE_PREFIX}${key}`
  const cached = await redis.get(cacheKey)
  if (cached) {
    try {
      return JSON.parse(cached) as T
    } catch {
      /* 落库重取 */
    }
  }
  const row = await queryOne<AppConfig>(
    'SELECT value FROM app_config WHERE config_key = ? AND status = 1',
    [key],
  )
  if (!row) return fallback
  const parsed = parseValue(row as AppConfig).value as T
  await redis.set(cacheKey, JSON.stringify(parsed), 'EX', CACHE_TTL)
  return parsed
}

/** 后台：新增或更新配置（upsert by key） */
export async function upsertConfig(input: {
  configKey: string
  title?: string
  value: unknown
  status?: number
  remark?: string
}): Promise<void> {
  await execute(
    `INSERT INTO app_config (config_key, title, value, status, remark)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE title = VALUES(title), value = VALUES(value),
       status = VALUES(status), remark = VALUES(remark)`,
    [
      input.configKey,
      input.title ?? null,
      JSON.stringify(input.value ?? null),
      input.status ?? 1,
      input.remark ?? null,
    ],
  )
  await invalidate(input.configKey)
}

/** 后台：仅更新某 key 的 value（功能区编辑常用） */
export async function updateConfigValue(key: string, value: unknown, status?: number): Promise<void> {
  await execute(
    `UPDATE app_config SET value = ?${status !== undefined ? ', status = ?' : ''} WHERE config_key = ?`,
    status !== undefined ? [JSON.stringify(value), status, key] : [JSON.stringify(value), key],
  )
  await invalidate(key)
}

export async function deleteConfig(key: string): Promise<void> {
  await execute('DELETE FROM app_config WHERE config_key = ?', [key])
  await invalidate(key)
}

async function invalidate(key: string): Promise<void> {
  await getRedis().del(`${CACHE_PREFIX}${key}`)
}
