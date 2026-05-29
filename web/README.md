# aisock-web · Web 前端

爱花型 · AI 袜版设计系统的 Web 端，基于 **Vue3 + TypeScript + Vite + Pinia + Vue Router**，复用 `server` 的 App 接口。

## 目录结构

```
src/
├── main.ts
├── App.vue
├── api/            # http(axios 拦截器) + index(领域接口)
├── store/          # Pinia（user）
├── router/         # 路由 + 守卫
├── layout/         # MainLayout（敦煌主题顶导，5 tab 与小程序对齐）
├── views/          # Home / Feed / Editor / Cart / Mine / Login
└── styles/         # 全局 token
```

## 快速开始

```bash
npm install
npm run dev      # http://127.0.0.1:5199（/api 代理到 :8199）
```

需先启动 `server`。导航与小程序保持一致：首页 / 推荐 / AI 设计 / 购物车 / 我的。
