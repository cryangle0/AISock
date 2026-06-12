# AI对话逻辑深度分析报告

## 🔍 现状分析

### 当前实现：模拟对话系统

#### 1. 流式返回是"假的"（前端模拟）

**实现代码：**
```typescript
function streamAiReply(fullText: string): Promise<void> {
  return new Promise((resolve) => {
    if (streamTimer) { clearInterval(streamTimer); streamTimer = null }
    replying.value = true
    messages.value.push({ role: 'ai', text: '', typing: true })
    const idx = messages.value.length - 1
    scrollBottom()
    
    // 先显示"正在输入"480ms
    setTimeout(() => {
      messages.value[idx].typing = false
      let i = 0
      // 每30ms显示一个字符，模拟打字机效果
      streamTimer = setInterval(() => {
        i += 1
        messages.value[idx].text = fullText.slice(0, i)
        if (i % 4 === 0) scrollBottom()
        if (i >= fullText.length) {
          if (streamTimer) clearInterval(streamTimer)
          streamTimer = null
          replying.value = false
          scrollBottom()
          resolve()
        }
      }, 30)
    }, 480)
  })
}
```

**问题：**
- ❌ 不是真正的流式返回，只是用 `setInterval` 逐字显示
- ❌ 回复内容是硬编码的固定文本
- ❌ 没有调用任何AI API
- ❌ 所有回复都是预设的，无法根据用户输入动态生成

---

### 2. 对话逻辑是"硬编码"的

**用户点击礼赠场景：**
```typescript
async function onGift(g: GiftItem) {
  if (replying.value) return
  selectedGift.value = g
  showStyles.value = false
  showRecommend.value = false
  pushUser(g.title)
  // ❌ 固定回复，不考虑用户选择了什么
  await streamAiReply('送 TA 一双舒适好袜，让每一步都温暖贴心～先选个喜欢的风格吧：')
  showStyles.value = true
  scrollBottom()
}
```

**用户确认风格选择：**
```typescript
async function onStylesConfirm(ids: string[]) {
  showStyles.value = false
  const names = styles.filter((s) => ids.includes(s.id)).map((s) => s.name).join('、')
  if (names) intent.value = names
  pushUser(names ? `我喜欢：${names}` : '需要推荐')
  // ❌ 固定回复，不管选了什么风格
  await streamAiReply('新国潮融合水墨丹青与潮流几何，特别显气质～为你推荐这几款花型：')
  showRecommend.value = true
  scrollBottom()
}
```

**用户直接输入文本：**
```typescript
async function onSend(text: string) {
  if (replying.value) return
  intent.value = text
  showStyles.value = false
  pushUser(text)
  // ❌ 无论用户说什么，都是这个回复
  await streamAiReply('收到～根据你的描述，为你匹配了这几款花型：')
  showRecommend.value = true
  scrollBottom()
}
```

**问题：**
- ❌ 所有回复都是预设的固定文本
- ❌ 不考虑用户输入的实际内容
- ❌ 用户说"我要蓝色的"和"我要粉色的"，AI回复完全一样

---

### 3. 推荐是"假的"（固定数据）

**推荐候选池：**
```typescript
const ALL_CANDS: Candidate[] = [
  { id: 'crane', name: '仙鹤', bg: '...', url: '/static/images/rec-crane.jpg' },
  { id: 'fret', name: '回纹', bg: '...', url: '/static/images/rec-fret.jpg' },
  { id: 'dragon', name: '祥龙', bg: '...', url: '/static/images/rec-dragon.jpg' },
  { id: 'lotus', name: '莲纹', bg: '...', url: '/static/images/rec-crane.jpg' },
  { id: 'cloud', name: '祥云', bg: '...', url: '/static/images/rec-fret.jpg' },
  { id: 'peony', name: '牡丹', bg: '...', url: '/static/images/rec-dragon.jpg' },
]

const candidates = ref<Candidate[]>(ALL_CANDS.slice(0, 3))
```

**换一批功能：**
```typescript
function shuffle() {
  const start = Math.floor(Math.random() * (ALL_CANDS.length - 3))
  candidates.value = ALL_CANDS.slice(start, start + 3)
  uni.showToast({ title: '已换一批', icon: 'none', duration: 600 })
}
```

**问题：**
- ❌ 只有6个固定的花型
- ❌ "换一批"只是随机显示这6个中的3个
- ❌ 不是根据用户意图智能推荐的
- ❌ 无论用户喜欢什么风格，都是这6个花型

---

## 🎯 后端能力分析

### 后端已有的AI能力

#### 1. AI生图 API ✅
```typescript
// 后端：server/src/routes/app/ai.ts
aiRouter.post('/generate', async (c) => {
  const { type, prompt, refImage, platform } = await c.req.json()
  const task = await createTask(userId, await dailyLimit(userId), {
    type,
    prompt,
    refImage,
    platform,
  })
  return ok(c, task)
})
```

#### 2. 意图分析/提示词优化 API ✅
```typescript
// 后端：server/src/routes/app/ai.ts
aiRouter.post('/optimize-prompt', async (c) => {
  const { prompt } = await c.req.json()
  const { optimizePrompt } = await import('../../services/aiText.service.js')
  const optimized = await optimizePrompt(prompt)
  return ok(c, { original: prompt, optimized })
})
```

**服务实现：**
```typescript
// server/src/services/aiText.service.ts
// 使用 DeepSeek API 把用户输入的模糊指令优化成高质量提示词
export async function optimizePrompt(userInput: string): Promise<string> {
  const resp = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }),
  })
  // 返回优化后的提示词
}
```

#### 3. 语音识别 API ✅
```typescript
// 后端：server/src/routes/app/ai.ts
aiRouter.post('/asr', async (c) => {
  const { audioUrl } = await c.req.json()
  const { transcribeAudio } = await import('../../services/asr.service.js')
  const text = await transcribeAudio(audioUrl)
  return ok(c, { text })
})
```

#### 4. 款式衍生 API ✅
```typescript
aiRouter.post('/derive', async (c) => {
  const { count } = await c.req.json()
  return ok(c, deriveStyleVariants(count || 2))
})
```

---

### 前端已封装的AI API

**文件：** `miniprogram/packages/service/src/ai.ts`

```typescript
// ✅ 已封装
export function generate(data: { type?: string; prompt?: string; refImage?: string; platform?: string })
export function optimizePrompt(prompt: string)
export function remixImage(refImage: string, prompt: string)
export function listTasks()
export function asr(audioUrl: string)
export function derive(count: number)
export function family()
```

---

## ❌ 核心问题总结

### AI助手页面（pages/ai/index.vue）的问题

| 功能 | 当前状态 | 问题 |
|-----|---------|-----|
| **对话** | 硬编码固定回复 | 不调用AI API，无法理解用户意图 |
| **流式返回** | 前端模拟打字效果 | 不是真正的流式返回，无法实时显示AI生成过程 |
| **花型推荐** | 6个固定选项 | 不是智能推荐，与用户意图无关 |
| **意图理解** | 只存储不处理 | 有 `intent.value` 但不用来生成推荐 |
| **后端对接** | 0个API调用 | 完全没有调用后端AI能力 |

---

## ✅ 应该怎么做

### 方案1：调用现有的意图优化API

**改进对话逻辑：**
```typescript
import { aiApi } from '@aisock/service'

// 用户输入后，调用意图优化API
async function onSend(text: string) {
  if (replying.value) return
  showStyles.value = false
  pushUser(text)
  
  // ✅ 调用后端AI优化用户输入
  try {
    const { optimized } = await aiApi.optimizePrompt(text)
    intent.value = optimized
    await streamAiReply(`收到～根据你的描述"${text}"，为你匹配了这几款花型：`)
  } catch (error) {
    await streamAiReply('收到～为你推荐这几款花型：')
  }
  
  showRecommend.value = true
  scrollBottom()
}
```

### 方案2：根据意图动态生成推荐（需要新API）

**需要新增后端API：**
```typescript
// 后端新增：根据用户意图推荐花型
aiRouter.post('/recommend', async (c) => {
  const { intent, scene, styles } = await c.req.json()
  // 基于意图、场景、风格，从花型库智能推荐
  const patterns = await recommendPatterns(intent, scene, styles)
  return ok(c, patterns)
})
```

**前端调用：**
```typescript
async function onStylesConfirm(ids: string[]) {
  showStyles.value = false
  const names = styles.filter((s) => ids.includes(s.id)).map((s) => s.name).join('、')
  if (names) intent.value = names
  pushUser(names ? `我喜欢：${names}` : '需要推荐')
  
  // ✅ 调用后端智能推荐
  try {
    const recommendations = await aiApi.recommend({
      intent: intent.value,
      scene: selectedGift.value?.id,
      styles: ids,
    })
    candidates.value = recommendations.slice(0, 3)
    recMain.value = recommendations[0]
  } catch {
    // 失败回退到固定推荐
  }
  
  await streamAiReply('新国潮融合水墨丹青与潮流几何，特别显气质～为你推荐这几款花型：')
  showRecommend.value = true
  scrollBottom()
}
```

### 方案3：真正的流式对话（需要SSE）

**后端新增：流式对话API**
```typescript
// 后端：支持Server-Sent Events
aiRouter.post('/chat/stream', async (c) => {
  const { messages } = await c.req.json()
  
  // 设置SSE响应头
  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')
  
  const stream = await openAIChatStream(messages)
  
  // 流式返回
  return c.streamText(async (stream) => {
    for await (const chunk of stream) {
      await stream.write(`data: ${JSON.stringify(chunk)}\n\n`)
    }
    await stream.write('data: [DONE]\n\n')
  })
})
```

**前端：接收流式响应**
```typescript
async function streamAiReply(messages: Msg[]): Promise<void> {
  return new Promise((resolve, reject) => {
    replying.value = true
    const aiMsgIdx = messages.value.push({ role: 'ai', text: '', typing: true }) - 1
    scrollBottom()
    
    // ✅ 真正的流式请求
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/v1/app/ai/chat/stream', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    
    let buffer = ''
    xhr.onprogress = () => {
      const newData = xhr.responseText.substring(buffer.length)
      buffer = xhr.responseText
      
      // 解析SSE数据
      const lines = newData.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6)
          if (data === '[DONE]') {
            replying.value = false
            resolve()
            return
          }
          try {
            const chunk = JSON.parse(data)
            messages.value[aiMsgIdx].typing = false
            messages.value[aiMsgIdx].text += chunk.content
            scrollBottom()
          } catch {}
        }
      }
    }
    
    xhr.onerror = () => {
      replying.value = false
      reject()
    }
    
    xhr.send(JSON.stringify({ messages }))
  })
}
```

---

## 📊 对比表格

| 功能 | 当前实现 | 应该实现 | 技术方案 |
|-----|---------|---------|---------|
| **对话理解** | 硬编码固定回复 | AI理解用户意图 | 调用 `/ai/optimize-prompt` |
| **流式返回** | 前端模拟打字 | 真正流式SSE | 后端SSE + 前端xhr.onprogress |
| **花型推荐** | 6个固定选项 | 智能推荐匹配 | 新增 `/ai/recommend` API |
| **意图存储** | 只存不用 | 影响推荐结果 | 传递给推荐API |
| **API调用** | 0次 | 每次对话调用 | 集成现有AI API |

---

## 🚀 快速改进方案（最小改动）

### Step 1: 接入意图优化API（5分钟）

**文件：** `pages/ai/index.vue`

```diff
<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import { navigateTo } from '@aisock/common/utils'
+import { aiApi } from '@aisock/service'
import NavBar from '@/components/ui/NavBar.vue'
// ... 其他导入

async function onSend(text: string) {
  if (replying.value) return
  showStyles.value = false
  pushUser(text)
  
+ // 调用AI优化意图
+ try {
+   const { optimized } = await aiApi.optimizePrompt(text)
+   intent.value = optimized
+ } catch {
+   intent.value = text
+ }
  
  await streamAiReply('收到～根据你的描述，为你匹配了这几款花型：')
  showRecommend.value = true
  scrollBottom()
}
</script>
```

### Step 2: 改进回复内容（10分钟）

```diff
async function onStylesConfirm(ids: string[]) {
  showStyles.value = false
  const names = styles.filter((s) => ids.includes(s.id)).map((s) => s.name).join('、')
  if (names) intent.value = names
  pushUser(names ? `我喜欢：${names}` : '需要推荐')
  
+ // 根据用户选择定制回复
+ let reply = '为你推荐这几款花型：'
+ if (names.includes('浪漫花卉')) reply = '浪漫花卉风格特别适合约会～为你推荐：'
+ if (names.includes('运动活力')) reply = '运动风格清爽舒适～为你推荐：'
+ if (names.includes('国潮纹样')) reply = '新国潮融合水墨丹青，特别显气质～为你推荐：'
  
- await streamAiReply('新国潮融合水墨丹青与潮流几何，特别显气质～为你推荐这几款花型：')
+ await streamAiReply(reply)
  showRecommend.value = true
  scrollBottom()
}
```

---

## 📝 总结

### 当前状态：原型演示级别
- ✅ 有完整的UI和交互流程
- ✅ 有打字机视觉效果
- ❌ 所有回复都是硬编码的
- ❌ 没有调用任何AI能力
- ❌ 推荐是随机的，不是智能的

### 后端能力：完整AI引擎
- ✅ AI生图（DeepSeek/通义/Stable Diffusion）
- ✅ 意图优化（DeepSeek）
- ✅ 语音识别（千问ASR）
- ✅ 款式衍生
- ✅ API已封装到前端service

### 核心问题：前端未对接
**AI助手页面完全没有调用后端AI能力！**

### 建议：
1. **立即改进：** 接入意图优化API（5分钟）
2. **短期改进：** 根据意图定制回复（10分钟）
3. **中期改进：** 开发智能推荐API（1-2小时）
4. **长期改进：** 实现真正的流式对话（2-4小时）

当前的AI助手更像是一个**精美的交互原型**，而不是真正的AI对话系统。
