/**
 * AI 生成领域服务
 * - 每日免费生图次数限额（Redis 计数，每日 0 点自然过期）
 * - 任务落库 + 调用外部文/图生图接口（占位实现）
 */
import { query, queryOne, execute } from '../db.js'
import { getRedis, CacheKey } from '../redis.js'

export type AiTaskType = 'text2img' | 'img2img' | 'remix' | 'style'

export interface AiTask {
  id: number
  user_id: number
  type: AiTaskType
  prompt: string | null
  ref_image: string | null
  result_urls: string[] | null
  status: 'pending' | 'running' | 'success' | 'failed'
  error: string | null
  created_at: string
  finished_at: string | null
}

/** 当天剩余免费次数 */
export async function getRemainingQuota(userId: number, dailyLimit: number): Promise<number> {
  const used = Number((await getRedis().get(quotaKey(userId))) || 0)
  return Math.max(0, dailyLimit - used)
}

function quotaKey(userId: number): string {
  const today = new Date().toISOString().slice(0, 10)
  return `${CacheKey.AI_QUOTA}${today}:${userId}`
}

function secondsUntilMidnight(): number {
  const now = new Date()
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  return Math.ceil((end.getTime() - now.getTime()) / 1000)
}

/** 消耗一次配额（原子自增 + 首次设置当日过期） */
async function consumeQuota(userId: number, dailyLimit: number): Promise<void> {
  const redis = getRedis()
  const key = quotaKey(userId)
  const used = await redis.incr(key)
  if (used === 1) await redis.expire(key, secondsUntilMidnight())
  if (used > dailyLimit) {
    await redis.decr(key)
    throw Object.assign(new Error('今日免费生图次数已用完'), { status: 429 })
  }
}

export interface CreateTaskInput {
  type: AiTaskType
  prompt?: string
  refImage?: string
}

/** 创建并执行 AI 任务 */
export async function createTask(userId: number, dailyLimit: number, input: CreateTaskInput): Promise<AiTask> {
  await consumeQuota(userId, dailyLimit)

  const r = await execute(
    `INSERT INTO ai_task (user_id, type, prompt, ref_image, status) VALUES (?,?,?,?, 'running')`,
    [userId, input.type, input.prompt ?? null, input.refImage ?? null],
  )
  const taskId = r.insertId

  try {
    const urls = await invokeProvider(input)
    await execute(
      `UPDATE ai_task SET status = 'success', result_urls = ?, finished_at = NOW() WHERE id = ?`,
      [JSON.stringify(urls), taskId],
    )
  } catch (err: any) {
    await execute(
      `UPDATE ai_task SET status = 'failed', error = ?, finished_at = NOW() WHERE id = ?`,
      [String(err?.message || 'AI 生成失败').slice(0, 200), taskId],
    )
  }

  const task = await queryOne<AiTask>('SELECT * FROM ai_task WHERE id = ?', [taskId])
  return task!
}

/**
 * 调用外部文/图生图接口。
 * 未配置 AI_IMAGE_API_URL 时返回占位结果，方便前端联调。
 */
async function invokeProvider(input: CreateTaskInput): Promise<string[]> {
  const apiUrl = process.env.AI_IMAGE_API_URL
  if (!apiUrl) {
    // 占位：回显一张示意图（生产环境必须配置真实接口）
    return [`https://placehold.co/1024x1024?text=${encodeURIComponent(input.prompt || 'AI')}`]
  }
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI_IMAGE_API_KEY || ''}`,
    },
    body: JSON.stringify({ prompt: input.prompt, image: input.refImage, type: input.type }),
  })
  if (!resp.ok) throw new Error(`AI 接口返回 ${resp.status}`)
  const data = (await resp.json()) as { urls?: string[] }
  return data.urls ?? []
}

export async function listTasks(userId: number, limit = 20): Promise<AiTask[]> {
  return query<AiTask>('SELECT * FROM ai_task WHERE user_id = ? ORDER BY id DESC LIMIT ?', [userId, limit])
}
