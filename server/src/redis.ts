/**
 * Redis 单例 + 缓存 key 前缀常量
 */
import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null
        return Math.min(times * 200, 2000)
      },
    })
  }
  return redis
}

export async function closeRedis() {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

/** 缓存 key 前缀（统一命名 as:xxx） */
export const CacheKey = {
  TOKEN: 'as:token:',
  SMS_CODE: 'as:sms:code:',
  SMS_LIMIT: 'as:sms:limit:',
  USER_INFO: 'as:user:info:',
  AI_QUOTA: 'as:ai:quota:', // 每日免费生图次数
  RATE_LIMIT: 'as:rate:',
  WX_ACCESS_TOKEN: 'as:wx:access_token', // 小程序全局 access_token
} as const
