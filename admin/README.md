# aisock-admin · 运营后台

爱花型 · AI 袜版设计系统的运营后台，基于 **Vue3 + TypeScript + Arco Design Vue + Pinia + Vue Router + Vite**（参考 haiying-admin 工程结构）。

## 目录结构

```
src/
├── main.ts             # 入口：Arco + 路由 + store + 拦截器
├── App.vue
├── api/                # 接口层（axios 封装，按领域拆分）
│   ├── interceptor.ts  # 统一响应 / 401 处理
│   ├── auth.ts socks.ts patterns.ts orders.ts users.ts banners.ts dashboard.ts
├── store/              # Pinia
│   ├── index.ts
│   └── modules/        # user / app
├── router/             # 路由
│   ├── index.ts routes.ts guard.ts
├── layout/             # 布局（侧边栏 + 头部）
│   └── default-layout.vue
├── views/              # 页面（按业务分目录）
│   ├── login dashboard socks patterns orders users banners not-found
├── utils/              # auth(token)
└── assets/style/       # 全局样式
```

## 快速开始

```bash
npm install
npm run dev      # http://127.0.0.1:5178（已配置 /api 代理到 :8199）
```

需先启动 `server`（:8199）并执行种子。默认登录：`admin / admin123`。

## 分层约定

`views`（页面）→ `api`（接口）→ axios 拦截器统一处理鉴权与错误；
跨页状态放 `store`，登录态走路由守卫 `guard.ts`。
