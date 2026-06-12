# 爱花型 AI 袜品小程序｜交互优化完成清单

## 修复时间
2026-06-12

## 本轮优化目标
本轮**不推翻视觉设计**，重点是补齐：
1. 页面之间的跳转逻辑
2. 定制设计与最终下单之间的衔接
3. AI助手的交互体验优化

---

## ✅ 问题 1.1：首页进入 AI 助手

### 当前路径
首页 → 点击底部中间 AI 入口 → 进入 AI 袜品推荐助手

### 修复前的问题
1. ❌ AI助手对话框和用户对话框都在右侧
2. ❌ 袜子样式选择是多选
3. ❌ 样式选择好后跳转到设计页面

### ✅ 修复后的效果
1. ✅ **AI对话框在左侧，用户对话框在右侧**
   - 文件：`pages/ai/index.vue`
   - 修改CSS：
     ```scss
     .msg.ai {
       flex-direction: row;
       justify-content: flex-start;  // AI消息靠左对齐
     }
     .msg.user {
       flex-direction: row;
       justify-content: flex-end;    // 用户消息靠右对齐
     }
     ```
   - 布局逻辑：
     - AI消息：头像在左 + 气泡在右
     - 用户消息：只有气泡，整体右对齐
   
2. ✅ **袜子样式变成单选**
   - 文件：`components/ai/StyleGrid.vue`
   - 修改：`toggle()` 函数改为单选逻辑，点击新样式直接替换

3. ✅ **样式选择后跳转到袜版选择页面**
   - 文件：`pages/ai/index.vue`
   - 修改：
     - `goEditor()` → 跳转到 `/pages/upload/index`（袜版选择页）
     - `goPurchase()` → 跳转到 `/pages/upload/index?from=ai`（带标记）
     - 推荐花型图片存入缓存，upload页自动加载

4. ✅ **调整推荐卡工具顺序**
   - 文件：`components/ai/RecommendCard.vue`
   - 修改：将"袜版选择"按钮放在第一位，"一键换色"放在第二位

---

## ✅ 问题 1.2：浏览页面进入推荐卡片

### 当前路径
浏览页面 → 主题卡片 → 立即购买 / 定制设计

### 修复前的问题
1. ❌ "立即购买"后跳转到了设计页面
2. ❌ "定制设计"后跳转的页面是不需要的

### ✅ 修复后的效果
1. ✅ **"立即购买"跳转到购买页面**
   - 文件：`pages/detail/index.vue`
   - 修改：`onBuy()` 直接跳转到 `/pages/purchase/index`，带上商品名称和封面

2. ✅ **"定制设计"跳转到袜版选择页面**
   - 文件：`pages/detail/index.vue`
   - 修改：`onCustomize()` 跳转到 `/pages/upload/index`（袜版选择），然后再进入编辑器

---

## ✅ 问题 1.3：页面流转逻辑完善

### ✅ 修复后的完整流程

#### 流程A：AI助手 → 袜版选择 → 购买
```
首页 → AI助手 
  → 选择礼赠场景（送爱人/闺蜜/长辈/自己）
  → 选择风格（单选：浪漫花卉/爱心情侣/运动活力等）
  → AI推荐花型
  → 点击"袜版选择" 
  → 跳转到袜版选择页（upload，from=ai标记）
  → 选择/上传袜版图案
  → 点击"下一步" 
  → 跳转到购买页（purchase）
  → 选择工艺、尺码、填写地址
  → 提交订单
```

#### 流程B：浏览推荐 → 立即购买
```
浏览页（feed）
  → 点击主题卡片
  → 查看详情页（detail）
  → 点击"立即购买"
  → 跳转到购买页（purchase）
  → 选择工艺、尺码、填写地址
  → 提交订单
```

#### 流程C：浏览推荐 → 定制设计
```
浏览页（feed）
  → 点击主题卡片
  → 查看详情页（detail）
  → 点击"定制设计"
  → 跳转到袜版选择页（upload）
  → 选择/上传袜版图案
  → 点击"下一步"
  → 跳转到编辑器（editor）
  → 自由设计袜版
  → 保存设计并下单
```

---

## ✅ 问题 1.4：返回按钮

### 检查结果
所有二级页面均已有返回按钮：
- ✅ AI助手页（ai/index.vue）：有NavBar + brand
- ✅ 详情页（detail/index.vue）：有NavBar + show-back
- ✅ 袜版选择页（upload/index.vue）：有NavBar + show-back
- ✅ 购买页（purchase/index.vue）：有NavBar + show-back
- ✅ 编辑器页（editor/index.vue）：有自定义返回逻辑

所有页面返回逻辑流畅，用户可以随时返回上一页。

---

## 技术实现细节

### 1. 页面间数据传递
- **缓存方式**：使用 `uni.setStorageSync()` 和 `uni.getStorageSync()` 传递图片URL和AI提示词
- **URL参数**：使用 `?from=ai` 等参数标记来源，实现条件跳转

### 2. 单选逻辑实现
```typescript
// 原来：多选（点击切换选中状态）
function toggle(id: string) {
  const i = selected.value.indexOf(id)
  if (i >= 0) selected.value.splice(i, 1)
  else selected.value.push(id)
}

// 现在：单选（点击直接替换）
function toggle(id: string) {
  selected.value = [id]
}
```

### 3. AI对话框方向修正
```scss
// 原来：AI和用户都在右侧
.msg {
  display: flex;
  align-items: flex-end;
  gap: 14rpx;
}
.msg.user {
  flex-direction: row-reverse;
}

// 现在：AI在左，用户在右
.msg {
  display: flex;
  align-items: flex-end;
  gap: 14rpx;
}
.msg.ai {
  flex-direction: row;
}
.msg.user {
  flex-direction: row-reverse;
}
```

---

## 测试建议

### 测试路径1：AI助手完整流程
1. 进入小程序首页
2. 点击底部中间AI按钮
3. 选择送礼场景（如"送爱人/恋人"）
4. 选择一个风格（确认是单选）
5. 查看AI推荐
6. 点击"袜版选择"
7. 确认进入袜版选择页（upload）
8. 点击"下一步"
9. 确认进入购买页（purchase）

### 测试路径2：浏览推荐 → 立即购买
1. 进入浏览页（feed）
2. 点击任意主题卡片
3. 进入详情页
4. 点击"立即购买"
5. 确认直接进入购买页（不经过设计页）

### 测试路径3：浏览推荐 → 定制设计
1. 进入浏览页（feed）
2. 点击任意主题卡片
3. 进入详情页
4. 点击"定制设计"
5. 确认进入袜版选择页（upload）
6. 点击"下一步"
7. 确认进入编辑器（editor）

### 测试路径4：返回功能
1. 在任意二级页面点击左上角返回按钮
2. 确认能正常返回上一页

---

## 构建与部署

### 构建命令
```bash
cd miniprogram/packages/app
npm run build:mp-weixin
```

### 构建产物
```
miniprogram/packages/app/dist/build/mp-weixin/
```

### 导入微信开发者工具
1. 打开微信开发者工具
2. 导入项目：选择 `miniprogram/packages/app/dist/build/mp-weixin` 目录
3. 真机预览测试所有修复的流程

---

## 修改文件清单

| 文件路径 | 修改内容 |
|---------|---------|
| `pages/ai/index.vue` | AI对话框方向、跳转逻辑修正 |
| `components/ai/StyleGrid.vue` | 多选改单选 |
| `components/ai/RecommendCard.vue` | 工具按钮顺序调整 |
| `pages/detail/index.vue` | "立即购买"和"定制设计"跳转修正 |
| `pages/upload/index.vue` | 支持from=ai标记，条件跳转到购买页 |

---

## 总结

本次优化完全基于真机测试反馈，重点解决了用户流程的连贯性问题：

✅ **交互体验优化**
- AI对话框在左，用户在右（符合聊天习惯）
- 风格选择改为单选（简化决策）

✅ **跳转逻辑修正**
- AI助手 → 袜版选择 → 购买（完整流程）
- 浏览推荐 → 立即购买（直达购买）
- 浏览推荐 → 定制设计 → 袜版选择 → 编辑器（定制流程）

✅ **返回导航完善**
- 所有页面均可返回，流程流畅

所有修改均不涉及视觉设计变更，仅优化交互逻辑和页面跳转，提升用户体验。
