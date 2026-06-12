/**
 * 语音识别（ASR）服务 —— 阿里云百炼 · 通义千问语音识别。
 *
 * 默认模型 qwen3-asr-flash（专用 ASR，多语言/方言、带标点），模型名后台可配。
 * 调用「录音文件识别」多模态端点：传入可访问的音频 URL，返回转写文本。
 * 端点固定，仅 model 走配置，避免写死出错。
 */
import { resolvePlatformConfig } from './aiConfig.service.js'

interface AsrResponse {
  output?: {
    choices?: Array<{ message?: { content?: Array<{ text?: string }> } }>
    text?: string
  }
  code?: string
  message?: string
}

/**
 * 转写一段音频为文本。
 * @param audioUrl 可公网访问的音频 URL（小程序录音先上传 /upload 拿到 URL 再传入）
 * @returns 识别出的文本（失败抛错，由路由统一处理）
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  const cfg = await resolvePlatformConfig('default')
  // 密钥/基址：后台「AI 配置」优先（provider=dashscope 时用其 apiKey），留空回退环境变量
  const key = (cfg.provider === 'dashscope' ? cfg.apiKey : '') || process.env.DASHSCOPE_API_KEY
  if (!key) throw Object.assign(new Error('未配置语音识别服务'), { status: 503 })

  const base = cfg.apiBaseUrl || process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com'
  const model = cfg.asrModel || 'qwen3-asr-flash'

  const resp = await fetch(`${base}/api/v1/services/aigc/multimodal-generation/generation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      input: {
        messages: [
          { role: 'system', content: [{ text: '' }] },
          { role: 'user', content: [{ audio: audioUrl }] },
        ],
      },
      // 开启语种识别 + 逆文本规整（数字/标点更自然）
      parameters: { asr_options: { enable_lid: true, enable_itn: true } },
    }),
  })

  if (!resp.ok) {
    throw Object.assign(new Error(`语音识别接口返回 ${resp.status}`), { status: 502 })
  }
  const data = (await resp.json()) as AsrResponse
  if (data.code) throw Object.assign(new Error(data.message || data.code), { status: 502 })

  const parts = data.output?.choices?.[0]?.message?.content
  const text = (parts?.find((p) => typeof p.text === 'string')?.text || data.output?.text || '').trim()
  return text
}
