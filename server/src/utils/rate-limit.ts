/**
 * 简易频控（Redis 固定窗口计数）。
 * 用于 AI 文本对话 / 语音识别 / 提示词优化等「不走生图配额但消耗上游费用」的端点，
 * 以及后台登录等需要防暴力尝试的入口。
 */
import { getRedis, CacheKey } from '../redis.js'

/**
 * 检查并计数：同一 key 在 windowSeconds 内最多 limit 次，超出抛 429。
 * @param bucket 业务桶名（如 'ai-chat'）
 * @param key    主体标识（用户 id / IP / 用户名）
 */
export async function assertRateLimit(
  bucket: string,
  key: string | number,
  limit: number,
  windowSeconds: number,
  message = '操作过于频繁，请稍后再试',
): Promise<void> {
  const redis = getRedis()
  const redisKey = `${CacheKey.RATE_LIMIT}${bucket}:${key}`
  const count = await redis.incr(redisKey)
  if (count === 1) await redis.expire(redisKey, windowSeconds)
  if (count > limit) {
    throw Object.assign(new Error(message), { status: 429 })
  }
}
