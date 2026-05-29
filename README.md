# 爱花型 · AI 袜版设计系统

一套面向「AI 袜款设计 → 在线下单 → 工厂量产」的完整系统，包含 Web 前端、微信小程序、运营后台与后端服务。

## 仓库结构（Monorepo）

```
.
├── prototype/      # 原型（React + Vite）—— 交互/视觉验证，部署到 GitHub Pages
├── server/         # 后端服务（Hono + TypeScript + MySQL + Redis）
├── admin/          # 运营后台（Vue3 + Arco Design Pro + Vite）
├── miniprogram/    # 微信小程序（uni-app + Vue3 + Pinia，pnpm monorepo）
├── web/            # Web 前端（Vue3 + Vite，复用 server API）
└── docs/           # 文档（客户准备清单等）
```

各子项目均为**独立工程**，拥有各自的 `package.json`、依赖与构建脚本，互不耦合。

## 技术栈

| 子系统 | 技术框架 |
| --- | --- |
| 后端 `server` | Hono · TypeScript(ESM) · MySQL2 · ioredis · JWT · 微信支付 |
| 后台 `admin` | Vue3 · TypeScript · Arco Design Vue · Pinia · Vue Router · Vite · axios |
| 小程序 `miniprogram` | uni-app · Vue3 · TypeScript · Pinia（app/service/common/composition 分包） |
| Web `web` | Vue3 · TypeScript · Pinia · Vue Router · Vite |
| 原型 `prototype` | React 19 · Vite |

## 工程规范（所有子项目共同遵循）

- **组件化 / 模块化 / 工程化**：单文件职责单一，避免超长文件；按领域分目录。
- **逻辑清晰、性能优先**：请求统一封装、状态集中管理、按需加载。
- **易扩展**：领域模块解耦，新增功能不改动核心。
- **极致体验**：加载态、错误态、空态完备，交互即时反馈。
- **最佳工程规范**：TypeScript 全量类型、ESLint + Prettier 统一风格。

## 快速开始

各子项目的启动方式见对应目录下的 README。

## 部署

`prototype/` 通过 GitHub Actions 自动构建并发布到 GitHub Pages。
