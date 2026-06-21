import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// 本站固定部署在 /aisock/ 子路径下。
// 防御 Git Bash / MSYS 把命令行的 `VITE_BASE=/aisock/` 篡改成 `/Program Files/Git/aisock/`
// （会导致 index.html 资源路径全错、线上 404）：仅当 VITE_BASE 看起来正常时才采用，
// 否则按构建模式回退到正确 base。这样无论用什么 shell、是否传 VITE_BASE，产物 base 都正确。
function resolveBase(mode: string): string {
  const raw = process.env.VITE_BASE
  if (raw && !raw.includes(' ') && !raw.includes('Program Files')) return raw
  return mode === 'production' ? '/aisock/' : '/'
}

export default defineConfig(({ mode }) => ({
  base: resolveBase(mode),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        // 本地开发默认走本地后端；如需联调线上，改为 https://onnsa.cn/aisock-api
        target: 'http://127.0.0.1:8199',
        changeOrigin: true,
      },
    },
  },
}))
