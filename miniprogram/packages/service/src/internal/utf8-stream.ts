/**
 * 流式 UTF-8 解码器（小程序端 onChunkReceived 返回 ArrayBuffer，
 * 多字节中文字符可能被切分在两个 chunk 之间，必须跨 chunk 缓存半个字符的字节）。
 *
 * 不依赖 TextDecoder（微信基础库不保证可用），纯手写解码，安全可控。
 */

/** 把一段「完整」的 UTF-8 字节解码为字符串（调用方需保证不含截断的多字节序列） */
function decodeComplete(bytes: Uint8Array): string {
  let out = ''
  let i = 0
  const len = bytes.length
  while (i < len) {
    const b0 = bytes[i]
    if (b0 < 0x80) {
      out += String.fromCharCode(b0)
      i += 1
    } else if (b0 >= 0xc0 && b0 < 0xe0) {
      const cp = ((b0 & 0x1f) << 6) | (bytes[i + 1] & 0x3f)
      out += String.fromCharCode(cp)
      i += 2
    } else if (b0 >= 0xe0 && b0 < 0xf0) {
      const cp = ((b0 & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      out += String.fromCharCode(cp)
      i += 3
    } else {
      // 4 字节 → 需用码点（含 emoji），fromCodePoint 处理代理对
      const cp =
        ((b0 & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f)
      out += String.fromCodePoint(cp)
      i += 4
    }
  }
  return out
}

/** 计算末尾「不完整多字节序列」的起始位置：返回可安全解码的字节数 */
function safeEnd(bytes: Uint8Array): number {
  const len = bytes.length
  // 最多回看 3 个字节即可覆盖 2/3/4 字节序列
  for (let back = 1; back <= 4 && back <= len; back++) {
    const b = bytes[len - back]
    if (b < 0x80) {
      // ASCII：它本身完整，其后无挂起字节
      return back === 1 ? len : len - (back - 1)
    }
    if (b >= 0xc0) {
      // 多字节序列起始字节，判断该序列是否完整
      const seqLen = b >= 0xf0 ? 4 : b >= 0xe0 ? 3 : 2
      const avail = back
      return avail >= seqLen ? len : len - avail
    }
    // 0x80~0xbf：续字节，继续往前找起始字节
  }
  return len
}

export interface Utf8StreamDecoder {
  /** 输入一段字节，返回当前可安全解码出的字符串（不完整字节会留到下次） */
  push(chunk: ArrayBuffer | Uint8Array): string
}

/** 创建一个有状态的流式解码器 */
export function createUtf8StreamDecoder(): Utf8StreamDecoder {
  let pending = new Uint8Array(0)

  return {
    push(chunk: ArrayBuffer | Uint8Array): string {
      const incoming = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)
      const bytes = new Uint8Array(pending.length + incoming.length)
      bytes.set(pending, 0)
      bytes.set(incoming, pending.length)

      const end = safeEnd(bytes)
      const decodable = bytes.subarray(0, end)
      pending = bytes.slice(end) // 复制残留字节，留到下次
      return decodeComplete(decodable)
    },
  }
}
