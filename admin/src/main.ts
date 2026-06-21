import { createApp } from 'vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
// 全量样式保留（仅 ~49KB gzip），保证按需导入的组件样式齐全；组件 JS 改为按需（见 vite.config 的 ArcoResolver）
import '@arco-design/web-vue/dist/arco.css'
import App from './App.vue'
import router from './router'
import store from './store'
import './api/interceptor'
import './assets/style/global.less'

const app = createApp(App)
app.use(ArcoVueIcon)
app.use(store)
app.use(router)
app.mount('#app')
