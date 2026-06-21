// 静态资源模块声明：让 TS 识别 `import icon from '@/assets/xxx.webp'` 返回打包后的 URL 字符串。
declare module '*.webp' {
  const src: string
  export default src
}
