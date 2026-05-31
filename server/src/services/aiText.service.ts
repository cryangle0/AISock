/**
 * AI 文案服务（意图分析 / 提示词优化）。
 *
 * 用 DeepSeek（OpenAI 兼容 chat/completions）把用户输入的模糊、口语化指令
 * 优化成适合文生图的高质量提示词。未配置或失败时原样返回用户输入，绝不阻断生图。
 */

const SYSTEM_PROMPT = [
  '你是袜款印花设计的提示词专家。',
  '把用户的模糊描述改写成一句精炼、具体、适合文生图模型的中文提示词：',
  '补全风格、配色、构图、纹理等关键要素，保持无缝平铺、适合袜子印花。',
  '只输出优化后的提示词本身，不要解释、不要引号、不超过 60 字。',
].join('')

/**
 * 优化提示词。
 * @returns 优化后的提示词；未配置 DeepSeek / 调用失败 / 超时 → 返回原输入
 */
export async function optimizePrompt(userPrompt: string): Promise<string> {
  const raw = (userPrompt || '').trim()
  if (!raw) return raw

  const apiUrl = process.env.AI_TEXT_API_URL
  const apiKey = process.env.AI_TEXT_API_KEY
  const model = process.env.AI_TEXT_MODEL || 'deepseek-chat'
  if (!apiUrl || !apiKey) return raw

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const resp = await fetch(`${apiUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: raw },
        ],
        temperature: 0.7,
        max_tokens: 120,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!resp.ok) return raw
    const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const optimized = data.choices?.[0]?.message?.content?.trim()
    return optimized || raw
  } catch {
    return raw // 失败回退原输入，不阻断生图
  }
}
