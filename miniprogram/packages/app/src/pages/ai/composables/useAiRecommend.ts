/**
 * AI 智能推荐
 * 负责根据用户意图推荐花型、生成推荐理由
 */
import { ref } from 'vue'
import type { RecommendCandidate, AiRecommendation } from '../types/chat'

// 花型数据库（实际应该从后端API获取）
const PATTERN_DATABASE: RecommendCandidate[] = [
  { id: 'crane', name: '仙鹤', imageUrl: '/static/images/rec-crane.jpg', tags: ['国潮', '优雅', '寓意好'], score: 0 },
  { id: 'fret', name: '回纹', imageUrl: '/static/images/rec-fret.jpg', tags: ['国潮', '经典', '几何'], score: 0 },
  { id: 'dragon', name: '祥龙', imageUrl: '/static/images/rec-dragon.jpg', tags: ['国潮', '霸气', '吉祥'], score: 0 },
  { id: 'lotus', name: '莲纹', imageUrl: '/static/images/rec-crane.jpg', tags: ['国潮', '清雅', '佛系'], score: 0 },
  { id: 'cloud', name: '祥云', imageUrl: '/static/images/rec-fret.jpg', tags: ['国潮', '飘逸', '仙气'], score: 0 },
  { id: 'peony', name: '牡丹', imageUrl: '/static/images/rec-dragon.jpg', tags: ['国潮', '富贵', '花卉'], score: 0 },
  { id: 'plum', name: '梅花', imageUrl: '/static/images/rec-crane.jpg', tags: ['国潮', '清新', '文艺'], score: 0 },
  { id: 'bamboo', name: '竹纹', imageUrl: '/static/images/rec-fret.jpg', tags: ['国潮', '清雅', '君子'], score: 0 },
  { id: 'wave', name: '海浪', imageUrl: '/static/images/rec-dragon.jpg', tags: ['自然', '动感', '清爽'], score: 0 },
  { id: 'cherry', name: '樱花', imageUrl: '/static/images/rec-crane.jpg', tags: ['浪漫', '粉嫩', '少女'], score: 0 },
]

export function useAiRecommend() {
  const isRecommending = ref(false)
  const lastRecommendation = ref<AiRecommendation | null>(null)

  /**
   * 计算花型与意图的匹配分数
   */
  function calculateScore(
    pattern: RecommendCandidate,
    intent: string,
    scene?: string,
    styles?: string[],
  ): number {
    let score = 0.5 // 基础分

    // 根据场景加分
    if (scene === 'lover' && pattern.tags?.includes('浪漫')) score += 0.3
    if (scene === 'bff' && pattern.tags?.includes('清新')) score += 0.2
    if (scene === 'elder' && pattern.tags?.includes('经典')) score += 0.3
    if (scene === 'self' && pattern.tags?.includes('文艺')) score += 0.2

    // 根据风格加分
    if (styles?.includes('国潮纹样') && pattern.tags?.includes('国潮')) score += 0.4
    if (styles?.includes('浪漫花卉') && pattern.tags?.includes('花卉')) score += 0.4
    if (styles?.includes('简约纯色') && pattern.tags?.includes('几何')) score += 0.3

    // 根据意图关键词加分
    const intentLower = intent.toLowerCase()
    pattern.tags?.forEach(tag => {
      if (intentLower.includes(tag)) score += 0.2
    })
    if (intentLower.includes(pattern.name)) score += 0.5

    return Math.min(score, 1.0)
  }

  /**
   * 智能推荐花型
   */
  async function recommend(
    intent: string,
    scene?: string,
    styles?: string[],
    count: number = 3,
  ): Promise<AiRecommendation> {
    isRecommending.value = true

    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800))

      // 计算每个花型的匹配分数
      const scoredPatterns = PATTERN_DATABASE.map(pattern => ({
        ...pattern,
        score: calculateScore(pattern, intent, scene, styles),
      }))

      // 按分数排序，取前 N 个
      const topPatterns = scoredPatterns
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, count)

      // 生成推荐理由
      const reasoning = generateReasoning(topPatterns, scene, styles)

      const recommendation: AiRecommendation = {
        candidates: topPatterns,
        reasoning,
        confidence: topPatterns[0]?.score || 0.5,
      }

      lastRecommendation.value = recommendation
      return recommendation

    } catch (error) {
      console.error('[AI Recommend] Recommendation failed:', error)
      
      // 失败回退：随机选择
      const fallback = PATTERN_DATABASE
        .sort(() => Math.random() - 0.5)
        .slice(0, count)

      return {
        candidates: fallback,
        reasoning: '为你精选了这几款经典花型',
        confidence: 0.5,
      }
    } finally {
      isRecommending.value = false
    }
  }

  /**
   * 生成推荐理由
   */
  function generateReasoning(
    patterns: RecommendCandidate[],
    scene?: string,
    styles?: string[],
  ): string {
    const topPattern = patterns[0]
    if (!topPattern) return '为你推荐这几款花型'

    const reasons: string[] = []

    // 基于场景
    if (scene === 'lover') reasons.push('特别适合送爱人')
    if (scene === 'bff') reasons.push('和闺蜜一起穿最有爱')
    if (scene === 'elder') reasons.push('长辈会喜欢这种稳重的设计')
    if (scene === 'self') reasons.push('独特又有品味')

    // 基于风格
    if (styles?.includes('国潮纹样')) reasons.push('融合传统与现代')
    if (styles?.includes('浪漫花卉')) reasons.push('温柔又浪漫')
    if (styles?.includes('运动活力')) reasons.push('清爽有活力')

    // 基于花型特点
    if (topPattern.tags?.includes('吉祥')) reasons.push('寓意吉祥')
    if (topPattern.tags?.includes('清雅')) reasons.push('雅致大方')

    return reasons.length > 0 
      ? `${topPattern.name}${reasons.join('，')}～`
      : `${topPattern.name}是个不错的选择～`
  }

  /**
   * 换一批推荐
   */
  async function shuffle(
    intent: string,
    scene?: string,
    styles?: string[],
    count: number = 3,
    excludeIds: string[] = [],
  ): Promise<AiRecommendation> {
    const available = PATTERN_DATABASE.filter(p => !excludeIds.includes(p.id))
    
    if (available.length <= count) {
      // 可选项不足，重新推荐全部
      return recommend(intent, scene, styles, count)
    }

    // 从剩余选项中推荐
    const scoredPatterns = available
      .map(pattern => ({
        ...pattern,
        score: calculateScore(pattern, intent, scene, styles),
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, count)

    return {
      candidates: scoredPatterns,
      reasoning: '为你换了一批花型～',
      confidence: scoredPatterns[0]?.score || 0.5,
    }
  }

  /**
   * 获取推荐详情
   */
  function getRecommendationDetail(id: string): RecommendCandidate | undefined {
    return PATTERN_DATABASE.find(p => p.id === id)
  }

  return {
    isRecommending,
    lastRecommendation,
    recommend,
    shuffle,
    getRecommendationDetail,
  }
}
