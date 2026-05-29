# aisock-server · 后端服务

爱花型 · AI 袜版设计系统的后端，基于 **Hono + TypeScript(ESM) + MySQL + Redis**。

## 目录结构

```
src/
├── index.ts            # 入口：装配中间件 + 路由
├── db.ts               # MySQL 连接池 + query/execute/transaction
├── redis.ts            # Redis 单例 + 缓存 key
├── middleware/
│   ├── auth.ts         # JWT + Redis 会话鉴权（含进程内缓存）
│   └── error-handler.ts
├── utils/
│   ├── response.ts     # ok / fail / paginated 统一响应
│   ├── jwt.ts          # token 签发/校验
│   └── context.ts      # 取登录态 / 分页参数
├── services/           # 领域服务（纯业务逻辑，不依赖 Hono）
│   ├── auth.service.ts
│   ├── sock.service.ts
│   ├── pattern.service.ts
│   ├── design.service.ts
│   ├── order.service.ts
│   └── ai.service.ts
└── routes/             # 路由层（只做参数校验 + 调 service + 返回）
    ├── app/            # 小程序 / web 端
    └── admin/          # 运营后台
```

**分层原则**：`routes`（HTTP 适配）→ `services`（业务逻辑）→ `db`（数据访问）。
services 不感知 Hono，便于单测与复用。

## 快速开始

```bash
cp .env.example .env       # 配置 MySQL / Redis
# 在 MySQL 执行 migrations/001_init.sql 建表
npm install
npm run seed               # 初始化 admin / 袜型 / 花型 / banner
npm run dev                # 启动（默认 :8199）
```

默认后台账号：`admin / admin123`

## API 约定

- 统一响应：`{ code, data, message }`，`code=0` 为成功
- 分页：`{ list, total, pageNum, pageSize, pages }`
- 鉴权：请求头 `Authorization: Bearer <token>`
- App 端前缀 `/api/v1/app/*`，后台前缀 `/api/v1/admin/*`

## 接口总览

App 端（`/api/v1/app`）：
- `auth`：sms-send / sms-login / wechat-login(code2session) / logout
- `user`：profile / overview
- `home`：首页聚合（banner + 袜型 + 分类）
- `socks` / `patterns`（含 mine 个人库 CRUD）
- `designs`：设计稿 CRUD
- `orders`：列表 / 详情 / 创建 / stats / 改备注
- `ai`：quota（新用户7天5次/后2次）/ generate / tasks / derive(款式衍生) / family(亲子袜) / invite-bonus
- `pay`：prepay(微信预下单) / notify(回调) / mock-paid(开发)
- `feed`：推荐流 / news / faq
- `shipment`：物流轨迹查询
- `upload`：multipart 文件上传（本地磁盘，OSS 可切换）

Admin 端（`/api/v1/admin`）：
- `auth`(账密) / `socks` / `patterns` / `orders` / `users` / `banners` / `dashboard`
- `articles`(推荐/资讯/FAQ) / `shipments`(录单+轨迹) / `ai-tasks`(监控+设计稿)

## 微信支付 / OSS / 短信 接入

- 微信支付：配置 `WXPAY_*` 后在 `wxpay.service.ts` 启用 `wechatpay-node-v3`（预下单/回调验签 hook 已留）
- 短信：配置 `SMS_PROVIDER` + 厂商凭证（`sms.service.ts`）
- OSS：配置 `OSS_*` 后在 `upload.service.ts` 切换（本地磁盘为默认）
- 文件静态访问：`/uploads/*`
