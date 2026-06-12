/**
 * AI 聊天相关类型定义
 */

/** 消息角色 */
export type MessageRole = 'ai' | 'user' | 'system'

/** 消息状态 */
export type MessageStatus = 'sending' | 'streaming' | 'done' | 'error'

/** 聊天消息 */
export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  status: MessageStatus
  /** 是否正在输入（显示三点动画） */
  typing?: boolean
  /** 错误信息 */
  error?: string
  /** 创建时间 */
  createdAt: number
}

/** 推荐候选项 */
export interface RecommendCandidate {
  id: string
  name: string
  description?: string
  imageUrl?: string
  tags?: string[]
  score?: number
}

/** AI 推荐结果 */
export interface AiRecommendation {
  candidates: RecommendCandidate[]
  reasoning?: string
  confidence?: number
}

/** 聊天上下文 */
export interface ChatContext {
  /** 礼赠场景 */
  scene?: string
  /** 风格偏好 */
  styles?: string[]
  /** 用户意图 */
  intent?: string
  /** 历史消息 */
  history: ChatMessage[]
}

/** AI 回复选项 */
export interface AiReplyOptions {
  /** 是否调用真实 AI 优化（自由文本输入为 true，结构化选择为 false） */
  useAi?: boolean
  /** 是否启用流式返回 */
  stream?: boolean
  /** 超时时间（ms） */
  timeout?: number
  /** 最大重试次数 */
  maxRetries?: number
}
