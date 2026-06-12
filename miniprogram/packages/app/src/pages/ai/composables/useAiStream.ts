/**
 * AI 流式返回处理
 * 负责接收 AI 实时生成的文本，提供流畅的打字机效果
 */
import { ref, onUnmounted } from 'vue'
import type { ChatMessage } from '../types/chat'

export interface StreamOptions {
  /** 每个字符的延迟（ms），模拟打字速度 */
  charDelay?: number
  /** 每次滚动的延迟间隔 */
  scrollInterval?: number
  /** 流式超时时间（ms） */
  timeout?: number
}

export function useAiStream(options: StreamOptions = {}) {
  const {
    charDelay = 30,
    scrollInterval = 4,
    timeout = 30000,
  } = options

  const isStreaming = ref(false)
  const currentStreamId = ref<string | null>(null)
  
  let streamTimer: ReturnType<typeof setInterval> | null = null
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 清理定时器
   */
  function cleanup() {
    if (streamTimer) {
      clearInterval(streamTimer)
      streamTimer = null
    }
    if (timeoutTimer) {
      clearTimeout(timeoutTimer)
      timeoutTimer = null
    }
    isStreaming.value = false
    currentStreamId.value = null
  }

  /**
   * 模拟流式显示文本（用于兜底，当真实流式不可用时）
   * @param message 要更新的消息对象
   * @param fullText 完整文本
   * @param onScroll 滚动回调
   * @returns Promise
   */
  function simulateStream(
    message: ChatMessage,
    fullText: string,
    onScroll?: () => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      cleanup()
      
      isStreaming.value = true
      currentStreamId.value = message.id
      message.typing = true
      message.status = 'streaming'
      message.content = ''

      // 超时保护
      timeoutTimer = setTimeout(() => {
        cleanup()
        message.typing = false
        message.status = 'error'
        message.error = '响应超时'
        reject(new Error('Stream timeout'))
      }, timeout)

      // 思考停顿
      setTimeout(() => {
        message.typing = false
        let charIndex = 0

        streamTimer = setInterval(() => {
          if (charIndex < fullText.length) {
            charIndex++
            message.content = fullText.slice(0, charIndex)
            
            // 定期触发滚动
            if (charIndex % scrollInterval === 0 && onScroll) {
              onScroll()
            }
          } else {
            cleanup()
            message.status = 'done'
            if (onScroll) onScroll()
            resolve()
          }
        }, charDelay)
      }, 480) // 思考停顿
    })
  }

  /**
   * 真实流式接收（SSE 或分块接收）
   * @param message 要更新的消息对象
   * @param chunks 文本块的异步迭代器
   * @param onScroll 滚动回调
   * @returns Promise
   */
  async function receiveStream(
    message: ChatMessage,
    chunks: AsyncIterable<string>,
    onScroll?: () => void,
  ): Promise<void> {
    cleanup()
    
    isStreaming.value = true
    currentStreamId.value = message.id
    message.typing = true
    message.status = 'streaming'
    message.content = ''

    // 超时保护
    timeoutTimer = setTimeout(() => {
      cleanup()
      message.typing = false
      message.status = 'error'
      message.error = '响应超时'
    }, timeout)

    try {
      // 思考停顿
      await new Promise(resolve => setTimeout(resolve, 480))
      message.typing = false

      let charCount = 0
      for await (const chunk of chunks) {
        if (!isStreaming.value) break
        
        message.content += chunk
        charCount++

        // 定期触发滚动
        if (charCount % scrollInterval === 0 && onScroll) {
          onScroll()
        }
      }

      cleanup()
      message.status = 'done'
      if (onScroll) onScroll()
    } catch (error) {
      cleanup()
      message.typing = false
      message.status = 'error'
      message.error = error instanceof Error ? error.message : '流式接收失败'
      throw error
    }
  }

  /**
   * 停止当前流式输出
   */
  function stopStream() {
    cleanup()
  }

  /**
   * 创建「推送式」流写入器，用于真实流式对话（onChunkReceived 回调驱动）。
   * - 首段到达时收起"正在输入"动画
   * - 滚动按段节流，避免频繁抖动
   * - 空闲超时保护：长时间无新增则判定失败
   */
  function createWriter(message: ChatMessage, onScroll?: () => void) {
    cleanup()
    isStreaming.value = true
    currentStreamId.value = message.id
    message.typing = true
    message.status = 'streaming'
    message.content = ''

    let firstChunk = true
    let sinceScroll = 0

    const armIdleTimer = () => {
      if (timeoutTimer) clearTimeout(timeoutTimer)
      timeoutTimer = setTimeout(() => {
        if (!isStreaming.value) return
        cleanup()
        message.typing = false
        message.status = 'error'
        message.error = '响应超时'
      }, timeout)
    }
    armIdleTimer()

    return {
      push(text: string) {
        if (!isStreaming.value || !text) return
        if (firstChunk) {
          message.typing = false
          firstChunk = false
        }
        message.content += text
        sinceScroll += text.length
        armIdleTimer()
        if (onScroll && sinceScroll >= scrollInterval) {
          sinceScroll = 0
          onScroll()
        }
      },
      done() {
        if (!isStreaming.value) return
        const hadContent = message.content.length > 0
        cleanup()
        message.typing = false
        message.status = hadContent ? 'done' : 'error'
        if (!hadContent) message.error = '未收到回复'
        if (onScroll) onScroll()
      },
      fail(error: unknown) {
        cleanup()
        message.typing = false
        message.status = 'error'
        message.error = error instanceof Error ? error.message : 'AI 回复失败'
      },
      /** 当前是否已产出内容（用于决定是否回退本地文案） */
      hasContent: () => message.content.length > 0,
    }
  }

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    isStreaming,
    currentStreamId,
    simulateStream,
    receiveStream,
    createWriter,
    stopStream,
  }
}
