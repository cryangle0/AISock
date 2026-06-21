/**
 * AI 智能推荐
 * 数据源：后端公共花型库，按「礼赠场景 + 风格」标签真实筛选（维度间 AND，维度内 OR）。
 * 命中为空时逐级放宽：场景+风格 → 仅场景 → 仅风格 → 关键词 → 全部，保证有结果、不阻断对话。
 */
import { ref } from 'vue'
import { catalogApi } from '@aisock/service'
import type { Pattern } from '@aisock/common/types'
import type { RecommendCandidate, AiRecommendation } from '../types/chat'

export interface RecommendParams {
  /** 场景 code（lover/bff/elder/self），仅用于推荐理由文案 */
  sceneCode?: string
  /** 场景标签 id（真实筛选用，<=0 视为未选） */
  sceneTagId?: number
  /** 风格标签 id 列表（真实筛选用） */
  styleTagIds?: number[]
  /** 自由文本意图（按花型名模糊匹配） */
  keyword?: string
}

function toCandidate(p: Pattern): RecommendCandidate {
  return { id: String(p.id), name: p.name, imageUrl: p.image_url }
}

function buildReasoning(top: RecommendCandidate[], sceneCode?: string): string {
  const first = top[0]
  if (!first) return '为你精选了这几款花型～'
  const hint =
    sceneCode === 'lover' ? '送爱人很合适'
    : sceneCode === 'bff' ? '和闺蜜很搭'
    : sceneCode === 'elder' ? '长辈会喜欢'
    : sceneCode === 'self' ? '很有个人风格'
    : '挺适合你'
  return `「${first.name}」${hint}～为你挑了这几款：`
}

/** 洗牌取前 N（排除指定 id），增加「换一批」多样性 */
function pickN(pool: RecommendCandidate[], count: number, excludeIds: string[]): RecommendCandidate[] {
  return pool
    .filter((c) => !excludeIds.includes(c.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

export function useAiRecommend() {
  const isRecommending = ref(false)
  const lastRecommendation = ref<AiRecommendation | null>(null)

  /** 逐级放宽拉取候选池：场景+风格 → 仅场景 → 仅风格 → 关键词 → 全部 */
  async function fetchPool(params: RecommendParams): Promise<RecommendCandidate[]> {
    const scene = params.sceneTagId && params.sceneTagId > 0 ? [params.sceneTagId] : undefined
    const styles = (params.styleTagIds || []).filter((n) => n > 0)
    const keyword = params.keyword?.trim() || undefined

    const attempts: Array<{ sceneIds?: number[]; styleIds?: number[]; keyword?: string }> = []
    if (scene && styles.length) attempts.push({ sceneIds: scene, styleIds: styles })
    if (scene) attempts.push({ sceneIds: scene })
    if (styles.length) attempts.push({ styleIds: styles })
    if (keyword) attempts.push({ keyword })
    attempts.push({}) // 全部（最终兜底）

    for (const a of attempts) {
      try {
        const res = await catalogApi.listPatterns({ pageNum: 1, pageSize: 30, ...a })
        const list = res.data?.list ?? []
        if (list.length) return list.map(toCandidate)
      } catch (error) {
        console.warn('[AI Recommend] listPatterns failed:', error)
      }
    }
    return []
  }

  /** 智能推荐 */
  async function recommend(params: RecommendParams, count = 3): Promise<AiRecommendation> {
    isRecommending.value = true
    try {
      const pool = await fetchPool(params)
      const candidates = pickN(pool, count, [])
      const recommendation: AiRecommendation = {
        candidates,
        reasoning: buildReasoning(candidates, params.sceneCode),
        confidence: candidates.length ? 0.8 : 0,
      }
      lastRecommendation.value = recommendation
      return recommendation
    } finally {
      isRecommending.value = false
    }
  }

  /** 换一批（优先排除已展示，可选项不足时回到全量重洗） */
  async function shuffle(params: RecommendParams, count = 3, excludeIds: string[] = []): Promise<AiRecommendation> {
    isRecommending.value = true
    try {
      const pool = await fetchPool(params)
      const remaining = pool.filter((c) => !excludeIds.includes(c.id))
      const candidates = remaining.length >= count ? pickN(remaining, count, []) : pickN(pool, count, [])
      return {
        candidates,
        reasoning: '为你换了一批花型～',
        confidence: candidates.length ? 0.8 : 0,
      }
    } finally {
      isRecommending.value = false
    }
  }

  return {
    isRecommending,
    lastRecommendation,
    recommend,
    shuffle,
  }
}
