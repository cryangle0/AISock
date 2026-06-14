# 小程序静态大图 → CDN 上传包

为通过微信「代码质量 - 图片和音频资源总量 ≤ 200K」，已把 8 张较大的内容图从小程序代码包移到 CDN。
本目录 `cdn-upload/aisock/` 的结构与 CDN 路径一一对应，**整体上传到 `cdn.onnsa.cn` 对应 OSS bucket 的 `aisock/` 前缀下即可**。

## 路径映射（上传后必须能访问到这些 URL）

| 本地文件（已删） | 上传后 CDN 地址 |
| --- | --- |
| static/images/feed-hero.webp | https://cdn.onnsa.cn/aisock/static/images/feed-hero.webp |
| static/images/showcase.webp | https://cdn.onnsa.cn/aisock/static/images/showcase.webp |
| static/images/hero-dunhuang.webp | https://cdn.onnsa.cn/aisock/static/images/hero-dunhuang.webp |
| static/images/rec-main.webp | https://cdn.onnsa.cn/aisock/static/images/rec-main.webp |
| pkg/static/detail/hangzhou-hero.webp | https://cdn.onnsa.cn/aisock/pkg/static/detail/hangzhou-hero.webp |
| pkg/static/detail/hangzhou-1.webp | https://cdn.onnsa.cn/aisock/pkg/static/detail/hangzhou-1.webp |
| pkg/static/detail/hangzhou-2.webp | https://cdn.onnsa.cn/aisock/pkg/static/detail/hangzhou-2.webp |
| pkg/static/detail/hangzhou-3.webp | https://cdn.onnsa.cn/aisock/pkg/static/detail/hangzhou-3.webp |

代码侧已统一通过 `src/config/cdn.ts` 的 `CDN_BASE = 'https://cdn.onnsa.cn/aisock'` 引用，
若 CDN 根路径不同，改这一个常量即可。

## 上传方式（任选其一，BUCKET 换成实际桶名）

阿里云 OSS（ossutil）：
```bash
ossutil cp -r cdn-upload/aisock/ oss://BUCKET/aisock/ --update --meta Content-Type:image/webp
```

腾讯云 COS（coscli）：
```bash
coscli cp -r cdn-upload/aisock/ cos://BUCKET/aisock/
```

上传后浏览器直接访问上表任一 URL 应能打开图片（webp）。确认 200 后再用微信开发者工具重新构建上传。

> 说明：微信 `<image>` 组件加载 https 图片无需配置「业务域名」白名单，可直接生效。
> 留在本地的均为图标/小缩略图（合计约 111KB < 200K），即使 CDN 未就绪，核心导航/启动页/网格也不受影响。
