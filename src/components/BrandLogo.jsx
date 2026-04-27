// 共享品牌 logo — 彩色条纹袜对照（位图资源）。
// 加 import.meta.env.BASE_URL 是为了兼容 GitHub Pages 子路径。

import './BrandLogo.css'

const LOGO_SRC = `${import.meta.env.BASE_URL}brand-logo.png`

export function BrandLogo({ size = 32, alt = '爱花型 logo' }) {
  return (
    <span className="brand-logo" style={{ width: size, height: size }}>
      <img src={LOGO_SRC} alt={alt} draggable={false}/>
    </span>
  )
}
