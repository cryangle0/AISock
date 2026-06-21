import { ref } from 'vue'

/** 全局明暗主题（单例）。moon/sun 按钮切换，持久化到 localStorage，应用到 <html data-theme>。 */
type Theme = 'light' | 'dark'
const STORAGE_KEY = 'aisock-theme'

function read(): Theme {
  try {
    return (localStorage.getItem(STORAGE_KEY) as Theme) || 'light'
  } catch {
    return 'light'
  }
}

const theme = ref<Theme>(read())

function apply(t: Theme) {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', t)
}

export function useTheme() {
  function setTheme(t: Theme) {
    theme.value = t
    apply(t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch { /* 忽略 */ }
  }
  function toggleTheme() { setTheme(theme.value === 'dark' ? 'light' : 'dark') }
  /** 应用启动时调用一次，确保持久化主题生效 */
  function initTheme() { apply(theme.value) }
  return { theme, setTheme, toggleTheme, initTheme }
}
