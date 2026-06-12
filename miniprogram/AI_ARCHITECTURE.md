# AI 助手真实对话系统 - 架构文档

## 🏛️ 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      pages/ai/index.vue                      │
│                    (UI层 + 交互编排)                         │
│  • 用户交互响应                                               │
│  • 页面跳转控制                                               │
│  • 组件渲染协调                                               │
└──────────────┬──────────────────────────────────────────────┘
               │
    ┌──────────┼──────────┬──────────────┬──────────────┐
    │          │          │              │              │
    ▼          ▼          ▼              ▼              ▼
┌────────┐ ┌──────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐
│useAi   │ │useAi │  │useAi    │  │Chat      │  │UI组件库 │
│Chat    │ │Stream│  │Recommend│  │Message   │  │(Gift,    │
│        │ │      │  │         │  │          │  │ Style,   │
│对话管理│ │流式  │  │智能推荐 │  │消息展示  │  │ Recommend│
│        │ │处理  │  │         │  │          │  │ Input)   │
└────┬───┘ └──┬───┘  └────┬────┘  └──────────┘  └──────────┘
     │        │           │
     ▼        │           │
┌─────────────┴───────────┴────────────────────────────────┐
│                   types/chat.ts                           │
│                  (类型定义层)                              │
│  • ChatMessage                                            │
│  • ChatContext                                            │
│  • RecommendCandidate                                     │
│  • AiRecommendation                                       │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     后端服务层                               │
│  • aiApi.optimizePrompt()    - AI 提示词优化                │
│  • aiApi.generateImage()     - AI 图片生成                  │
│  • aiApi.recognizeVoice()    - 语音识别                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 模块详解

### 1. index.vue - 主页面（UI层）

**职责**:
- 渲染页面 UI
- 响应用户交互
- 协调各个 composable
- 处理页面跳转

**核心方法**:
```typescript
onGift()           // 处理礼赠场景选择
onStylesConfirm()  // 处理风格确认
onSend()           // 处理用户输入
onShuffle()        // 处理换一批
loadRecommendations() // 加载推荐结果
```

**状态管理**:
```typescript
selectedGift     // 当前选择的礼赠场景
showStyles       // 是否显示风格选择
showRecommend    // 是否显示推荐卡
recMain          // 主推荐花型
candidates       // 候选花型列表
```

---

### 2. useAiChat - 对话核心逻辑

**职责**:
- 管理对话消息列表
- 调用后端 AI API
- 维护对话上下文
- 处理错误和重试

**核心流程**:
```
用户输入
  ↓
addUserMessage()         // 添加用户消息
  ↓
optimizeUserInput()      // 调用 AI 优化输入
  ↓
generateAiReply()        // 生成 AI 回复
  ↓
buildSystemPrompt()      // 构建系统提示词
  ↓
generateSceneBasedReply() // 基于场景生成回复
  ↓
simulateStream()         // 流式显示（调用 useAiStream）
  ↓
更新 context.history     // 更新对话历史
```

**关键方法**:
```typescript
sendMessage()       // 发送用户消息 + 获取 AI 回复
setScene()          // 设置礼赠场景上下文
setStyles()         // 设置风格偏好上下文
retryLastMessage()  // 重试最后一条消息
clearMessages()     // 清空对话
```

**状态维护**:
```typescript
messages          // 消息列表 (ChatMessage[])
context           // 对话上下文 (ChatContext)
  ├─ scene        // 礼赠场景
  ├─ styles       // 风格偏好
  ├─ intent       // 用户意图
  └─ history      // 历史消息（最近10条）
isProcessing      // 是否处理中
```

---

### 3. useAiStream - 流式返回处理

**职责**:
- 实现流式文字显示
- 打字机动画效果
- 滚动控制
- 超时保护

**核心算法**:
```typescript
simulateStream(message, fullText, onScroll) {
  1. 显示 typing 动画（480ms 思考停顿）
  2. 逐字符显示文本（30ms/字符）
  3. 每4个字符触发一次滚动
  4. 30秒超时保护
  5. 完成时更新状态为 'done'
}
```

**性能优化**:
- **字符延迟**: 30ms/字符（可调）
- **滚动节流**: 每4个字符滚动一次
- **超时保护**: 30秒自动终止
- **内存清理**: 定时器及时清理

**扩展性**:
```typescript
receiveStream()  // 真实 SSE 流式接收（预留接口）
stopStream()     // 停止流式输出
```

---

### 4. useAiRecommend - 智能推荐引擎

**职责**:
- 计算花型匹配分数
- 排序和筛选候选项
- 生成推荐理由
- 处理换一批逻辑

**匹配算法**:
```typescript
calculateScore(pattern, intent, scene, styles) {
  基础分 = 0.5
  
  // 场景匹配加分
  if (scene === 'lover' && pattern.tags.includes('浪漫'))
    score += 0.3
  
  // 风格匹配加分
  if (styles.includes('国潮纹样') && pattern.tags.includes('国潮'))
    score += 0.4
  
  // 关键词匹配加分
  if (intent.includes(pattern.tags[i]))
    score += 0.2
  
  // 精确名称匹配加分
  if (intent.includes(pattern.name))
    score += 0.5
  
  return min(score, 1.0)
}
```

**推荐流程**:
```
计算所有花型分数
  ↓
按分数降序排序
  ↓
取前 N 个候选项（默认3个）
  ↓
生成推荐理由
  ↓
返回结果 + 置信度
```

**换一批策略**:
```typescript
shuffle(intent, scene, styles, count, excludeIds) {
  1. 过滤已展示的花型（excludeIds）
  2. 从剩余花型中计算分数
  3. 排序后取前 N 个
  4. 如果可选项不足，则重新推荐全部
}
```

---

### 5. ChatMessage - 消息组件

**职责**:
- 渲染单条消息
- 展示消息状态
- 处理错误重试

**布局逻辑**:
```scss
// AI 消息（左侧）
.chat-message.ai {
  flex-direction: row;
  justify-content: flex-start;
  
  [头像] [白色气泡]
}

// 用户消息（右侧）
.chat-message.user {
  flex-direction: row;
  justify-content: flex-end;
  
  [棕色气泡]
}
```

**状态展示**:
- **typing**: 三点动画
- **streaming**: 流式文字
- **done**: 完整内容
- **error**: 错误提示 + 重试按钮

---

## 🔄 数据流向

### 用户发送消息
```
用户输入 "我想要红色的袜子"
  ↓
index.vue: onSend()
  ↓
useAiChat: sendMessage()
  ↓
useAiChat: addUserMessage()        → messages 列表更新
  ↓
useAiChat: optimizeUserInput()     → 调用 aiApi.optimizePrompt
  ↓
useAiChat: generateAiReply()       → 生成 AI 回复内容
  ↓
useAiStream: simulateStream()      → 流式显示
  ↓
useAiChat: 更新 context.history    → 上下文更新
  ↓
index.vue: loadRecommendations()
  ↓
useAiRecommend: recommend()        → 计算推荐
  ↓
index.vue: candidates 更新         → 推荐卡显示
```

### 用户点击换一批
```
用户点击 "换一批"
  ↓
index.vue: onShuffle()
  ↓
useAiRecommend: shuffle()
  ↓
过滤已展示的花型 ID
  ↓
计算剩余花型分数
  ↓
排序并返回前 3 个
  ↓
index.vue: candidates 更新
  ↓
推荐卡刷新显示
```

---

## 🧩 依赖关系

```
index.vue
  ├── useAiChat
  │   ├── useAiStream
  │   └── aiApi (后端服务)
  ├── useAiRecommend
  └── ChatMessage
      └── types/chat

所有模块依赖:
  └── types/chat.ts (类型定义)
```

**依赖原则**:
- ✅ 单向依赖（上层依赖下层）
- ✅ 类型定义独立（types/chat.ts）
- ✅ composables 互相独立（useAiStream 不依赖 useAiChat）
- ✅ UI 组件纯展示（ChatMessage 不包含业务逻辑）

---

## 🔌 API 接口

### aiApi.optimizePrompt()

**用途**: 优化用户输入的提示词

**请求**:
```typescript
aiApi.optimizePrompt(input: string): Promise<{ optimized: string }>
```

**示例**:
```typescript
// 输入
const input = "想要粉色的"

// 输出
const result = await aiApi.optimizePrompt(input)
// result.optimized = "粉色系浪漫花型，适合送爱人"
```

**调用位置**: `useAiChat.ts` → `optimizeUserInput()`

**错误处理**:
```typescript
try {
  const optimized = await aiApi.optimizePrompt(input)
  return optimized
} catch (error) {
  console.warn('优化失败，使用原文:', error)
  return input  // 降级方案：使用原文
}
```

---

## 📊 状态管理

### 全局状态（index.vue）
```typescript
selectedGift: Ref<GiftItem | null>     // 当前选择的礼赠场景
showStyles: Ref<boolean>               // 是否显示风格选择
showRecommend: Ref<boolean>            // 是否显示推荐卡
recMain: Ref<Candidate>                // 主推荐花型
candidates: Ref<Candidate[]>           // 候选花型列表（3个）
```

### 对话状态（useAiChat）
```typescript
messages: Ref<ChatMessage[]>           // 消息列表
context: Ref<ChatContext>              // 对话上下文
  ├─ scene: string?                    // 礼赠场景
  ├─ styles: string[]?                 // 风格偏好
  ├─ intent: string?                   // 用户意图
  └─ history: ChatMessage[]            // 历史消息
isProcessing: Ref<boolean>             // 是否处理中
```

### 流式状态（useAiStream）
```typescript
isStreaming: Ref<boolean>              // 是否正在流式输出
currentStreamId: Ref<string | null>    // 当前流式消息 ID
```

### 推荐状态（useAiRecommend）
```typescript
isRecommending: Ref<boolean>           // 是否正在推荐
lastRecommendation: Ref<AiRecommendation | null> // 最后一次推荐结果
```

---

## 🎯 关键设计模式

### 1. 组合式 API（Composition API）
使用 Vue 3 的 `<script setup>` 和 composables 实现逻辑复用。

```typescript
// composable 模式
export function useAiChat() {
  const messages = ref([])
  const sendMessage = () => { /* ... */ }
  return { messages, sendMessage }
}

// 使用
const { messages, sendMessage } = useAiChat()
```

### 2. 策略模式（Strategy Pattern）
根据场景和风格动态生成回复。

```typescript
function generateSceneBasedReply(input: string): string {
  const scene = context.value.scene
  const styles = context.value.styles

  if (scene === 'lover') {
    if (styles.includes('浪漫花卉')) {
      return '浪漫花卉风格特别适合送爱人～'
    }
    return '送给爱人的袜子，温柔贴心最重要～'
  }
  // ... 其他场景
}
```

### 3. 模板方法模式（Template Method）
流式显示的标准流程。

```typescript
async function simulateStream(message, fullText, onScroll) {
  // 1. 初始化
  cleanup()
  message.typing = true
  
  // 2. 思考停顿
  await delay(480)
  
  // 3. 逐字符输出（模板流程）
  for (let i = 0; i < fullText.length; i++) {
    message.content += fullText[i]
    if (i % 4 === 0) onScroll?.()
    await delay(30)
  }
  
  // 4. 完成
  cleanup()
  message.status = 'done'
}
```

### 4. 责任链模式（Chain of Responsibility）
推荐分数累加计算。

```typescript
function calculateScore(pattern, intent, scene, styles) {
  let score = 0.5  // 基础分
  
  // 链式加分
  score += scoreByScene(pattern, scene)
  score += scoreByStyle(pattern, styles)
  score += scoreByKeyword(pattern, intent)
  score += scoreByName(pattern, intent)
  
  return Math.min(score, 1.0)
}
```

---

## 🚀 性能优化策略

### 1. 响应式优化
- 使用 `ref` 而非 `reactive`（更细粒度）
- 避免深度嵌套的响应式对象
- 使用 `computed` 缓存计算结果

### 2. 渲染优化
- `v-for` 使用稳定的 `key`（消息 ID）
- 消息组件使用 `scoped` 样式避免污染
- 长列表使用虚拟滚动（未来优化）

### 3. 流式输出优化
- 字符延迟控制（30ms 可配置）
- 滚动节流（每4字符）
- 超时保护（30秒）

### 4. 内存管理
- 历史消息限制（最多10条）
- 定时器及时清理
- 图片资源懒加载

---

## 🔐 安全考虑

### 1. 输入验证
```typescript
function sendMessage(content: string) {
  if (!content.trim()) return  // 空输入过滤
  if (content.length > 500) {  // 长度限制
    content = content.slice(0, 500)
  }
  // ... 发送消息
}
```

### 2. XSS 防护
```vue
<!-- 使用 {{ }} 自动转义 -->
<text>{{ message.content }}</text>

<!-- 避免使用 v-html -->
```

### 3. API 鉴权
```typescript
// 后端 API 调用自动带上鉴权信息
aiApi.optimizePrompt(input)  // 内部已处理 token
```

---

## 📈 扩展性设计

### 1. 真实 SSE 流式接口
```typescript
// 预留接口（useAiStream）
async function receiveStream(
  message: ChatMessage,
  chunks: AsyncIterable<string>,  // SSE 事件流
  onScroll?: () => void
): Promise<void> {
  // ... 真实流式处理
}
```

### 2. 多种 AI 模型切换
```typescript
// 配置化 AI 模型
const AI_MODELS = {
  deepseek: { endpoint: '/ai/deepseek', type: 'chat' },
  qianwen: { endpoint: '/ai/qianwen', type: 'chat' },
  tongyi: { endpoint: '/ai/tongyi', type: 'image' },
}

async function callAiModel(model: keyof typeof AI_MODELS, input: string) {
  const config = AI_MODELS[model]
  return await fetch(config.endpoint, { body: input })
}
```

### 3. 推荐数据源扩展
```typescript
// 当前：本地花型数据库
const PATTERN_DATABASE: RecommendCandidate[] = [...]

// 未来：后端 API
async function fetchPatterns(): Promise<RecommendCandidate[]> {
  return await api.getPatterns()
}
```

---

## 🎓 最佳实践

### ✅ DO（推荐做法）
- 类型定义独立（types/chat.ts）
- composables 职责单一
- 错误处理完善（try-catch + 降级）
- 状态最小化更新
- 注释清晰完整

### ❌ DON'T（避免做法）
- 在 index.vue 中写业务逻辑
- composables 互相依赖
- 忽略错误处理
- 全量更新响应式对象
- 硬编码魔法数字

---

*架构文档版本: v1.0*  
*更新时间: 2026-06-12*
