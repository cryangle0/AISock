# aisock-miniprogram · 微信小程序

爱花型 · AI 袜版设计系统的微信小程序，基于 **uni-app + Vue3 + TypeScript + Pinia**，pnpm monorepo（参考 hive-miniprogram 结构）。

## 包结构

```
packages/
├── common/        # @aisock/common —— 常量 / 类型 / 工具 / SCSS 变量
├── service/       # @aisock/service —— http 封装 + 领域 API（auth/catalog/design/order/ai/user）
├── composition/   # @aisock/composition —— Pinia stores（useUserStore / useCatalogStore）
└── app/           # @aisock/app —— uni-app 应用（pages / components）
```

**分层**：`app`（页面/UI）→ `composition`（状态）→ `service`（接口）→ `common`（基础设施）。

## 页面（5 tab + 子页）

- 首页 `pages/home` —— 敦煌主题（品牌带 + banner + 主题随心订 + 预设 carousel）
- 推荐 `pages/feed`
- AI 设计 `pages/editor` —— 袜型选择前移 + AI 生图（每日免费配额）+ 右侧固定保存/下单
- 购物车 `pages/cart`
- 我的 `pages/mine` —— 未登录引导登录；数据概览 + 我的设计/订单入口
- 登录 `pages/login` —— 短信验证码 + 微信登录
- 子页：我的设计 `pages/designs`、订单管理 `pages/orders`

底部栏为自定义组件 `CustomTabBar`，中间「AI 设计」为凸起圆形 FAB。

## 快速开始

```bash
pnpm install
pnpm dev:mp-weixin   # 用微信开发者工具打开 packages/app/dist/dev/mp-weixin
```

需先启动 `server`（修改 `packages/common/src/constants` 的 `API_BASE_URL`）。
