/**
 * AI 对话核心逻辑
 * 负责管理对话状态、调用真实流式 AI、处理消息流与降级
 */
import { ref, computed, onUnmounted } from 'vue'
import { aiApi, type StreamChatTurn, type StreamChatHandle } from '@aisock/service'
import { STORAGE_KEYS } from '@aisock/common/constants'
import { useAiStream } from './useAiStream'
import type { ChatMessage, ChatContext, AiReplyOptions } from '../types/chat'

/** API 多轮上下文携带的最大历史条数 */
const MAX_API_HISTORY = 10

export function useAiChat() {
  const messages = ref<ChatMessage[]>([])
  const context = ref<ChatContext>({
    history: [],
  })
  const isProcessing = ref(false)
  const lastReplyOptions = ref<AiReplyOptions>({})

  const { simulateStream, createWriter, isStreaming, stopStream } = useAiStream()

  // 当前进行中的流式请求句柄（用于切换/卸载时中断）
  let activeHandle: StreamChatHandle | null = null
  let disposed = false

  /**
   * 生成唯一消息 ID
   */
  function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  /**
   * 添加用户消息
   */
  function addUserMessage(content: string): ChatMessage {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      status: 'done',
      createdAt: Date.now(),
    }
    messages.value.push(message)
    context.value.history.push(message)
    return message
  }

  /**
   * 添加 AI 消息（初始为空，等待流式填充）
   */
  function addAiMessage(): ChatMessage {
    const message: ChatMessage = {
      id: generateMessageId(),
      role: 'ai',
      content: '',
      status: 'sending',
      typing: true,
      createdAt: Date.now(),
    }
    messages.value.push(message)
    return message
  }

  /**
   * 构建发往后端的多轮消息（ai 角色映射为 assistant，附带最近历史）
   */
  function buildApiMessages(): StreamChatTurn[] {
    return context.value.history
      .slice(-MAX_API_HISTORY)
      .filter((m) => m.status === 'done' && m.content.trim())
      .map((m) => ({
        role: m.role === 'ai' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
        content: m.content,
      }))
  }

  /**
   * 真实流式对话：调用后端 SSE 接口，逐段写入消息气泡。
   * 失败且未产出任何内容时，回退到本地场景化文案，保证体验不中断。
   */
  function streamRealReply(userInput: string, onScroll?: () => void): Promise<void> {
    const aiMessage = addAiMessage()
    // 空闲超时 → 中断底层请求（触发 onAbort 收尾并释放 isProcessing），避免「重试」死路
    const writer = createWriter(aiMessage, onScroll, () => {
      activeHandle?.abort()
    })

    return new Promise<void>((resolve) => {
      let finished = false

      // 收尾：产出过内容则正常完成，否则回退本地文案
      const finalize = async () => {
        finished = true
        activeHandle = null
        // 页面已卸载：不再触碰动画/DOM
        if (disposed) {
          resolve()
          return
        }
        if (writer.hasContent()) {
          writer.done()
          context.value.history.push(aiMessage)
        } else {
          const text = context.value.scene
            ? generateSceneBasedReply(userInput)
            : generateDefaultReply(userInput)
          await simulateStream(aiMessage, text, onScroll)
          context.value.history.push(aiMessage)
        }
        resolve()
      }

      // 主动中断 / 超时中断：保留已产出内容，但不回退本地兜底文案
      const finalizeAborted = () => {
        finished = true
        activeHandle = null
        if (disposed) {
          resolve()
          return
        }
        if (writer.hasContent()) {
          writer.done()
          context.value.history.push(aiMessage)
        } else if (aiMessage.status !== 'error') {
          aiMessage.typing = false
          aiMessage.status = 'error'
          aiMessage.error = aiMessage.error || '已停止'
        }
        resolve()
      }

      // 未登录 / 登录过期：明确提示并引导登录，而不是伪装成正常回复
      const finalizeUnauthorized = () => {
        finished = true
        activeHandle = null
        if (!disposed) {
          writer.fail(new Error('请先登录，登录后即可与推荐官畅聊'))
          uni.setStorageSync(STORAGE_KEYS.LOGIN_RETURN_TO, '/pages/ai/index')
          uni.showToast({ title: '请先登录', icon: 'none' })
          setTimeout(() => {
            uni.navigateTo({ url: '/pages/login/index' })
          }, 600)
        }
        resolve()
      }

      const handle = aiApi.streamChat(
        {
          messages: buildApiMessages(),
          scene: context.value.scene,
          styles: context.value.styles,
        },
        {
          onDelta: (t) => writer.push(t),
          onDone: () => { void finalize() },
          onError: (err) => {
            if (err?.name === 'UNAUTHORIZED') {
              finalizeUnauthorized()
              return
            }
            console.warn('[AI Chat] stream error, fallback to local:', err?.message)
            void finalize()
          },
          onAbort: () => finalizeAborted(),
        },
      )
      // CHUNK_UNSUPPORTED 等同步错误可能在返回前就已收尾，避免残留已结束的句柄
      if (!finished) activeHandle = handle
    })
  }

  /**
   * 生成 AI 回复
   * @param userInput 用户输入
   * @param onScroll 滚动回调
   * @param options.useAi 是否调用真实流式 AI（仅自由文本输入需要；结构化选择用本地文案，零配额、零延迟）
   */
  async function generateAiReply(
    userInput: string,
    onScroll?: () => void,
    options: AiReplyOptions = {},
  ): Promise<void> {
    if (isProcessing.value) {
      console.warn('[AI Chat] Already processing, skipping')
      return
    }

    isProcessing.value = true

    try {
      if (options.useAi) {
        // 自由文本 → 真实流式对话
        await streamRealReply(userInput, onScroll)
      } else {
        // 结构化选择（礼赠场景 / 风格）→ 本地场景化文案，即时打字机展示
        const aiMessage = addAiMessage()
        const replyContent = context.value.scene
          ? generateSceneBasedReply(userInput)
          : generateDefaultReply(userInput)
        await simulateStream(aiMessage, replyContent, onScroll)
        context.value.history.push(aiMessage)
      }
    } catch (error) {
      console.error('[AI Chat] Reply generation failed:', error)
      const last = messages.value[messages.value.length - 1]
      if (last?.role === 'ai') {
        last.status = 'error'
        last.error = error instanceof Error ? error.message : 'AI 回复生成失败'
        last.typing = false
      }
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 根据场景生成回复
   */
  function generateSceneBasedReply(input: string): string {
    const scene = context.value.scene
    const styles = context.value.styles || []

    if (scene === 'lover') {
      if (styles.includes('浪漫花卉')) {
        return '浪漫花卉风格特别适合送爱人～粉色系的花朵图案温柔又甜蜜。根据你的描述，为你推荐这几款心动花型：'
      }
      return '送给爱人的袜子，温柔贴心最重要～为你精选了几款浪漫花型：'
    }

    if (scene === 'bff') {
      if (styles.includes('运动活力')) {
        return '和闺蜜一起运动最有活力啦～为你推荐这几款清爽的运动风花型：'
      }
      return '和闺蜜的友谊要像袜子一样舒适～为你推荐这几款百搭花型：'
    }

    if (scene === 'elder') {
      return '送长辈的袜子要注重品质和舒适～为你推荐这几款沉稳大气的花型：'
    }

    if (scene === 'self') {
      if (styles.includes('简约纯色')) {
        return '取悦自己，从脚开始～简约风最百搭！为你推荐这几款质感花型：'
      }
      return '给自己选袜子，喜欢最重要～为你推荐这几款独特花型：'
    }

    return `收到你的需求"${input}"，为你匹配了这几款花型：`
  }

  /**
   * 生成默认回复
   */
  function generateDefaultReply(input: string): string {
    if (input.includes('花') || input.includes('图案')) {
      return '好的！根据你喜欢的花卉元素，为你推荐这几款花型：'
    }
    if (input.includes('简约') || input.includes('纯色')) {
      return '简约风格最经典～为你推荐这几款质感花型：'
    }
    if (input.includes('运动') || input.includes('活力')) {
      return '运动风格清爽舒适～为你推荐这几款活力花型：'
    }
    return `收到～根据你的描述"${input}"，为你推荐这几款花型：`
  }

  /**
   * 发送用户消息并获取 AI 回复
   * @param content 用户输入内容
   * @param onScroll 滚动回调
   * @param options.useAi 是否调用真实 AI（自由文本传 true，结构化选择传 false）
   */
  async function sendMessage(
    content: string,
    onScroll?: () => void,
    options?: AiReplyOptions,
  ): Promise<void> {
    if (!content.trim()) return

    // 闸门前置：回复进行中不插入「悬空」用户消息（入口处已 toast 提示）
    if (isProcessing.value) return

    // 记住本次回复策略，供失败重试复用
    lastReplyOptions.value = options || {}

    // 添加用户消息
    addUserMessage(content)
    context.value.intent = content

    // 获取 AI 回复
    await generateAiReply(content, onScroll, options)
  }

  /**
   * 更新场景上下文
   */
  function setScene(scene: string) {
    context.value.scene = scene
  }

  /**
   * 更新风格偏好
   */
  function setStyles(styles: string[]) {
    context.value.styles = styles
  }

  /**
   * 清空对话
   */
  function clearMessages() {
    messages.value = []
    context.value.history = []
  }

  /**
   * 重试最后一条消息
   */
  async function retryLastMessage(onScroll?: () => void): Promise<void> {
    if (isProcessing.value) {
      uni.showToast({ title: '正在回复中，请稍候', icon: 'none' })
      return
    }
    const lastUserMsg = [...messages.value].reverse().find(msg => msg.role === 'user')
    if (!lastUserMsg) return

    // 移除最后一条 AI 消息（如果是错误状态）
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg?.role === 'ai' && lastMsg.status === 'error') {
      messages.value.pop()
    }

    // 复用上次的回复策略（自由文本需重新调用 AI）
    await generateAiReply(lastUserMsg.content, onScroll, lastReplyOptions.value)
  }

  /**
   * 停止当前对话（中断网络流 + 清理动画定时器）
   */
  function stop() {
    if (activeHandle) {
      activeHandle.abort()
      activeHandle = null
    }
    stopStream()
    isProcessing.value = false
  }

  // 页面卸载时中断进行中的请求，避免回调悬挂
  onUnmounted(() => {
    disposed = true
    if (activeHandle) {
      activeHandle.abort()
      activeHandle = null
    }
  })

  return {
    // 状态
    messages,
    context,
    isProcessing,
    isStreaming,

    // 方法
    sendMessage,
    setScene,
    setStyles,
    clearMessages,
    retryLastMessage,
    stopStream: stop,

    // 计算属性
    hasMessages: computed(() => messages.value.length > 0),
    canRetry: computed(() => {
      const lastMsg = messages.value[messages.value.length - 1]
      return lastMsg?.role === 'ai' && lastMsg.status === 'error'
    }),
  }
}
