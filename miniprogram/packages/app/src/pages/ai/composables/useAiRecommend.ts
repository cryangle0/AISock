/**
 * AI 智能推荐
 * 数据源：后端公共花型库（真实 http 图，可直接下单），客户端按场景/风格/意图打分排序。
 * 失败时回退到已缓存数据或空结果，绝不阻断对话流程。
 */
import { ref } from 'vue'
import { catalogApi } from '@aisock/service'
import type { Pattern } from '@aisock/common/types'
import type { RecommendCandidate, AiRecommendation } from '../types/chat'

/** 场景 → 关键词（用于与花型名/分类名做语义匹配打分） */
const SCENE_KEYWORDS: Record<string, string[]> = {
  lover: ['浪漫', '花', '玫瑰', '爱心', '粉', '情侣', '樱'],
  bff: ['活力', '运动', '清新', '卡通', '彩虹', '萌'],
  elder: ['经典', '简约', '纯色', '回纹', '祥', '节气', '竹', '梅'],
  self: ['艺术', '插画', '个性', '国潮', '几何'],
}

/** 风格名 → 关键词 */
const STYLE_KEYWORDS: Record<string, string[]> = {
  浪漫花卉: ['花', '玫瑰', '樱', '牡丹', '浪漫'],
  爱心情侣: ['爱心', '情侣', '心'],
  运动活力: ['运动', '活力', '几何'],
  复古格纹: ['格', '复古', '条纹'],
  简约纯色: ['纯色', '简约', '米白', '燕麦'],
  萌趣卡通: ['卡通', '萌', '猫', '熊'],
  艺术插画: ['插画', '艺术'],
  国潮纹样: ['国潮', '祥', '龙', '云', '回纹', '观音', '飞天', '节气'],
}

// 模块级缓存：避免每次推荐重复拉取
let patternCache: Pattern[] | null = null
const categoryNameMap = new Map<number, string>()

export function useAiRecommend() {
  const isRecommending = ref(false)
  const lastRecommendation = ref<AiRecommendation | null>(null)

  /** 拉取并缓存公共花型 + 分类名 */
  async function ensurePatterns(): Promise<Pattern[]> {
    if (patternCache && patternCache.length) return patternCache
    try {
      const [patternRes, catRes] = await Promise.all([
        catalogApi.listPatterns({ pageNum: 1, pageSize: 50 }),
        catalogApi.listPatternCategories(),
      ])
      catRes.data?.forEach((c) => categoryNameMap.set(c.id, c.name))
      patternCache = patternRes.data?.list ?? []
    } catch (error) {
      console.warn('[AI Recommend] load patterns failed:', error)
      patternCache = patternCache || []
    }
    return patternCache
  }

  /** 计算花型与意图的匹配分数 */
  function scorePattern(p: Pattern, intent: string, scene?: string, styles?: string[]): number {
    const haystack = `${p.name} ${categoryNameMap.get(p.category_id ?? -1) || ''}`
    let score = 0.5

    const keywords = new Set<string>()
    if (scene && SCENE_KEYWORDS[scene]) SCENE_KEYWORDS[scene].forEach((k) => keywords.add(k))
    styles?.forEach((s) => STYLE_KEYWORDS[s]?.forEach((k) => keywords.add(k)))

    keywords.forEach((k) => {
      if (haystack.includes(k)) score += 0.25
    })

    // 意图原文里的字也参与匹配（用户自由输入）
    const intentText = (intent || '').toLowerCase()
    if (intentText && haystack.toLowerCase().includes(intentText)) score += 0.4
    if (p.name && intentText.includes(p.name)) score += 0.5

    return Math.min(score, 1)
  }

  /** 花型 → 推荐候选 */
  function toCandidate(p: Pattern, score = 0): RecommendCandidate {
    return {
      id: String(p.id),
      name: p.name,
      imageUrl: p.image_url,
      tags: categoryNameMap.get(p.category_id ?? -1) ? [categoryNameMap.get(p.category_id ?? -1)!] : [],
      score,
    }
  }

  /** 取分数最高的若干花型（排除指定 id），并打散同分以增加多样性 */
  function pickTop(patterns: Pattern[], intent: string, scene: string | undefined, styles: string[] | undefined, count: number, excludeIds: string[]): RecommendCandidate[] {
    return patterns
      .filter((p) => !excludeIds.includes(String(p.id)))
      .map((p) => ({ p, score: scorePattern(p, intent, scene, styles) + Math.random() * 0.05 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(({ p, score }) => toCandidate(p, score))
  }

  /** 生成推荐理由 */
  function buildReasoning(top: RecommendCandidate[], scene?: string): string {
    const first = top[0]
    if (!first) return '为你精选了这几款花型～'
    const sceneHint = scene === 'lover' ? '送爱人很合适' : scene === 'bff' ? '和闺蜜很搭' : scene === 'elder' ? '长辈会喜欢' : scene === 'self' ? '很有个人风格' : '挺适合你'
    return `「${first.name}」${sceneHint}～为你挑了这几款：`
  }

  /** 智能推荐 */
  async function recommend(intent: string, scene?: string, styles?: string[], count = 3): Promise<AiRecommendation> {
    isRecommending.value = true
    try {
      const patterns = await ensurePatterns()
      const candidates = pickTop(patterns, intent, scene, styles, count, [])
      const recommendation: AiRecommendation = {
        candidates,
        reasoning: buildReasoning(candidates, scene),
        confidence: candidates[0]?.score ?? 0.5,
      }
      lastRecommendation.value = recommendation
      return recommendation
    } finally {
      isRecommending.value = false
    }
  }

  /** 换一批（排除已展示，可选项不足时回到全量） */
  async function shuffle(intent: string, scene?: string, styles?: string[], count = 3, excludeIds: string[] = []): Promise<AiRecommendation> {
    isRecommending.value = true
    try {
      const patterns = await ensurePatterns()
      const remaining = patterns.filter((p) => !excludeIds.includes(String(p.id)))
      const pool = remaining.length >= count ? remaining : patterns
      const candidates = pickTop(pool, intent, scene, styles, count, remaining.length >= count ? excludeIds : [])
      return {
        candidates,
        reasoning: '为你换了一批花型～',
        confidence: candidates[0]?.score ?? 0.5,
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
