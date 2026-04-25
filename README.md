# AISock — 爱花型袜版设计系统

> AI 驱动的袜版花型设计原型 · React + Vite

在线预览：<https://cryangle0.github.io/AISock/>

## 主要功能

- **可视化袜版编辑器**：袜口 / 螺口 / 主体+袜跟 / 袜头 四区独立填花
- **花型素材库**：内置碎花 / 条纹 / 圆点 / 方格 / 大花 / 蓝花 / 单色 / 金色 / 薄荷 9 套花型
- **AI 同款生成**：基于当前设计生成 1 / 2 / 4 个风格变体（前端模拟）
- **设计参数面板**:密度 / 旋转 / 间距 三个滑块 + 平铺 / 拉伸 / 智能分块 三种填充策略
- **下单流程**:尺码 / 数量 / 材质 / 收货地址 / 备注，一键提交至爱花型
- **我的设计 + 订单管理**：设计稿网格视图 + 订单状态列表
- **小程序端预览**：右下角悬浮微信小程序模拟器，移动端版式实时预览

## 技术栈

- React 19 + Vite 8
- Lucide Icons
- 纯 SVG `<pattern>` 模拟花型 — 单文件零图片依赖
- GitHub Actions 自动部署到 GitHub Pages

## 本地开发

```bash
npm install
npm run dev
```

打开 <http://localhost:5173/AISock/>

## 生产构建

```bash
npm run build
npm run preview
```

## 部署

推送到 main 分支即触发 `.github/workflows/deploy-pages.yml`，自动构建并发布到 GitHub Pages。
