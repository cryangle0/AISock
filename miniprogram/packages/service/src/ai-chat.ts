/**
 * AI 对话流式客户端。
 *
 * 微信小程序不支持 EventSource / fetch 流，使用 uni.request 的 `enableChunked` +
 * `onChunkReceived` 接收 SSE 分块；跨 chunk 的多字节字符由 utf8 流式解码器兜底。
 * 对外暴露回调式接口（onDelta/onDone/onError）并返回可中断句柄。
 */
import { API_BASE_URL, STORAGE_KEYS } from '@aisock/common/constants'
import { createUtf8StreamDecoder } from './internal/utf8-stream.js'

export interface StreamChatTurn {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamChatPayload {
  messages: StreamChatTurn[]
  scene?: string
  styles?: string[]
}

export interface StreamChatHandlers {
  /** 收到一段文本增量 */
  onDelta: (text: string) => void
  /** 正常结束 */
  onDone: () => void
  /** 失败（网络 / 上游 / 不支持分块） */
  onError: (err: Error) => void
}

export interface StreamChatHandle {
  /** 主动中断对话 */
  abort: () => void
}

const CHAT_URL = `${API_BASE_URL}/api/v1/app/ai/chat`
const REQUEST_TIMEOUT = 60000

/** uni.request 的扩展入参（enableChunked 为微信小程序特有，uni 公共类型未声明） */
interface ChunkedRequestOptions {
  url: string
  method: 'POST'
  timeout: number
  enableChunked: boolean
  header: Record<string, string>
  data: unknown
  fail: (e: { errMsg?: string }) => void
  complete: () => void
}

/**
 * 发起流式对话。
 * @returns 句柄，可调用 abort() 中断
 */
export function streamChat(payload: StreamChatPayload, handlers: StreamChatHandlers): StreamChatHandle {
  const token = uni.getStorageSync(STORAGE_KEYS.TOKEN) || ''
  const decoder = createUtf8StreamDecoder()

  let settled = false
  const settle = (fn: () => void) => {
    if (settled) return
    settled = true
    fn()
  }

  // SSE 文本缓冲：按空行（\n\n）分隔事件
  let textBuf = ''
  function consume(text: string) {
    if (!text) return
    textBuf += text
    let sep: number
    while ((sep = textBuf.indexOf('\n\n')) >= 0) {
      const rawEvent = textBuf.slice(0, sep)
      textBuf = textBuf.slice(sep + 2)
      const dataLine = rawEvent.split('\n').find((l) => l.startsWith('data:'))
      if (!dataLine) continue
      const data = dataLine.slice(5).trim()
      if (!data) continue
      try {
        const evt = JSON.parse(data) as { delta?: string; done?: boolean; error?: string }
        if (evt.error) {
          settle(() => handlers.onError(new Error(evt.error)))
        } else if (evt.done) {
          settle(handlers.onDone)
        } else if (typeof evt.delta === 'string') {
          handlers.onDelta(evt.delta)
        }
      } catch {
        /* 不完整 / 心跳，忽略 */
      }
    }
  }

  const chunkedRequest = uni.request as unknown as (
    o: ChunkedRequestOptions,
  ) => { onChunkReceived?: (cb: (res: { data: ArrayBuffer }) => void) => void; abort?: () => void }

  const task = chunkedRequest({
    url: CHAT_URL,
    method: 'POST',
    timeout: REQUEST_TIMEOUT,
    enableChunked: true,
    header: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    data: payload,
    fail: (e: { errMsg?: string }) => settle(() => handlers.onError(new Error(e?.errMsg || '网络请求失败'))),
    // 请求整体结束兜底：若服务端未显式下发 done 事件，也保证收尾
    complete: () => settle(handlers.onDone),
  })

  if (task && typeof task.onChunkReceived === 'function') {
    task.onChunkReceived((res) => {
      try {
        consume(decoder.push(res.data))
      } catch (err) {
        settle(() => handlers.onError(err instanceof Error ? err : new Error('CHUNK_DECODE_FAILED')))
      }
    })
  } else {
    // 旧基础库 / 非微信端不支持分块 → 立即报错，由上层回退非流式方案
    settle(() => handlers.onError(new Error('CHUNK_UNSUPPORTED')))
  }

  return {
    abort: () => {
      try {
        task?.abort?.()
      } catch {
        /* ignore */
      }
      settle(handlers.onDone)
    },
  }
}
