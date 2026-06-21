import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

// 后台固定部署在 /aisock-admin/ 子路径下。
// 防御 Git Bash / MSYS 把命令行的 `VITE_BASE=/aisock-admin/` 篡改成 `/Program Files/Git/...`
// （会导致 index.html 资源路径全错、线上 404）：仅当 VITE_BASE 看起来正常时才采用，
// 否则按构建模式回退到正确 base。这样无论用什么 shell、是否传 VITE_BASE，产物 base 都正确。
function resolveBase(mode: string): string {
  const raw = process.env.VITE_BASE
  if (raw && !raw.includes(' ') && !raw.includes('Program Files')) return raw
  return mode === 'production' ? '/aisock-admin/' : '/'
}

export default defineConfig(({ mode }) => ({
  base: resolveBase(mode),
  plugins: [
    vue(),
    // 按需导入 Arco 组件：模板里的 <a-xxx> 自动只打包用到的组件（JS），
    // 全量样式仍由 main.ts 的 arco.css 提供（零样式缺失风险）。dirs: [] 关闭本地组件自动导入，仅用解析器。
    Components({
      dirs: [],
      dts: false,
      resolvers: [ArcoResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8199',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 拆分长期不变的第三方库为独立可缓存 chunk：echarts(仅图表页加载) / arco / vue 全家桶 / 其它 vendor。
        // 重新部署时这些 chunk 哈希不变即可命中浏览器缓存，仅下载改动的业务 chunk。
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('echarts') || id.includes('zrender')) return 'echarts'
          if (id.includes('@arco-design')) return 'arco'
          if (/[\\/](vue|vue-router|pinia|@vue)[\\/]/.test(id)) return 'vue'
          return 'vendor'
        },
      },
    },
  },
}))
