/**
 * AI 设计能力组合式函数 —— 把「意图分析 / 文生图 / 指令改色」三类 AI 调用收敛到一处，
 * 让组件只负责交互与展示，不直接耦合接口细节。
 *
 * 职责：
 *   - quota：剩余生成次数（生成 / 改色后自动刷新）
 *   - optimizePrompt：意图分析，把模糊指令优化成高质量提示词（失败回退原文）
 *   - generate：文生图，返回结果图 URL
 *   - recolor：图生图 / 指令改色，基于参考图 + 指令生成
 */
import { reactive, ref } from 'vue'
import { aiApi } from '@/api'

export function useAiDesign() {
  const quota = reactive({ limit: 0, remaining: 0, loaded: false })
  const generating = ref(false)

  async function refreshQuota() {
    try {
      const res = await aiApi.quota()
      quota.limit = res.data.limit
      quota.remaining = res.data.remaining
      quota.loaded = true
    } catch {
      /* 未登录或网络异常：忽略，不阻断设计 */
    }
  }

  /** 意图分析：返回优化后的提示词；失败 / 无变化时返回原文 */
  async function optimize(prompt: string): Promise<string> {
    const raw = prompt.trim()
    if (!raw) return raw
    try {
      const res = await aiApi.optimizePrompt(raw)
      return res.data.optimized?.trim() || raw
    } catch {
      return raw
    }
  }

  /** 文生图：成功返回结果图 URL，失败抛错由调用方提示 */
  async function generate(prompt: string): Promise<string | null> {
    if (!prompt.trim() || generating.value) return null
    generating.value = true
    try {
      const res = await aiApi.generate({ type: 'text2img', prompt: prompt.trim() })
      const url = res.data.result_urls?.[0] ?? null
      void refreshQuota()
      return url
    } finally {
      generating.value = false
    }
  }

  /** 指令改色 / 改背景：基于参考图 + 指令做图生图（1–9 张） */
  async function remix(refImages: string[], prompt: string): Promise<string | null> {
    const refs = refImages.filter(Boolean).slice(0, 9)
    if (!refs.length || !prompt.trim() || generating.value) return null
    generating.value = true
    try {
      const res = await aiApi.remix(refs, prompt.trim())
      const url = res.data.result_urls?.[0] ?? null
      void refreshQuota()
      return url
    } finally {
      generating.value = false
    }
  }

  return { quota, generating, refreshQuota, optimize, generate, remix, recolor: remix }
}
