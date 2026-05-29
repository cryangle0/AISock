<template>
  <div class="home">
    <div class="home-main">
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">从一根花线到成品</h1>
          <p class="hero-desc">3 分钟出袜款，AI 同款一键延展，提交至爱花型工厂量产。</p>
          <div class="hero-cta">
            <button class="btn-primary" @click="$router.push({ name: 'Editor' })">开始设计</button>
            <button class="btn-ghost" @click="$router.push({ name: 'Feed' })">浏览灵感</button>
          </div>
        </div>
        <div class="hero-banner">敦煌梦 · 千年壁画艺术之旅</div>
      </section>

      <section class="quick">
        <button class="quick-card" @click="$router.push({ name: 'Editor' })">
          <span class="quick-icon">✏️</span>
          <span class="quick-text"><b>开始设计</b><i>进入袜版编辑器</i></span>
        </button>
        <button class="quick-card" @click="goAuthed('Mine')">
          <span class="quick-icon">📁</span>
          <span class="quick-text"><b>我的设计</b><i>{{ overview.designs }} 个袜版</i></span>
        </button>
        <button class="quick-card" @click="goAuthed('Cart')">
          <span class="quick-icon">🛒</span>
          <span class="quick-text"><b>购物车</b><i>{{ orderTotal }} 个订单</i></span>
        </button>
        <button class="quick-card" @click="$router.push({ name: 'Feed' })">
          <span class="quick-icon">🎨</span>
          <span class="quick-text"><b>推荐灵感</b><i>主题 + 配色</i></span>
        </button>
      </section>

      <section class="section">
        <h2 class="section-title">袜版设计预设</h2>
        <div class="preset-grid">
          <button v-for="p in presets" :key="p.id" class="preset-card" :style="{ background: p.bg }" @click="$router.push({ name: 'Editor' })">
            <span class="preset-name">{{ p.name }}</span>
          </button>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">袜型一览</h2>
        <div class="sock-grid">
          <div v-for="s in socks" :key="s.id" class="sock-card">
            <div class="sock-name">{{ s.name }}</div>
            <div class="sock-meta">{{ s.craft }} · ¥{{ s.unit_price }} 起</div>
          </div>
        </div>
      </section>
    </div>

    <!-- 右侧资讯栏（对齐原型三栏布局） -->
    <aside class="home-rail">
      <div class="rail-card">
        <h3 class="rail-title">资讯中心</h3>
        <div v-for="n in news" :key="n.title" class="news-item">
          <span class="news-icon" :style="{ background: n.bg }">{{ n.emoji }}</span>
          <div class="news-text">
            <div class="news-t">{{ n.title }}</div>
            <div class="news-d">{{ n.date }}</div>
          </div>
        </div>
      </div>

      <div class="rail-card">
        <h3 class="rail-title">我的订单</h3>
        <div class="order-stats">
          <div class="os"><b>{{ orderTotal }}</b><i>订单总数</i></div>
          <div class="os"><b>{{ overview.orders.producing ?? 0 }}</b><i>生产中</i></div>
          <div class="os"><b>{{ overview.orders.done ?? 0 }}</b><i>已完成</i></div>
        </div>
      </div>

      <div class="rail-card tips">
        <h3 class="rail-title">设计灵感</h3>
        <div v-for="(t, i) in tips" :key="i" class="tip">
          <span class="tip-num">{{ String(i + 1).padStart(2, '0') }}</span>
          <span>{{ t }}</span>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { catalogApi, userApi, type SockModel } from '@/api'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()
const socks = ref<SockModel[]>([])
const overview = reactive<{ designs: number; orders: Record<string, number> }>({ designs: 0, orders: {} })
const orderTotal = computed(() => overview.orders.total ?? 0)

const presets = [
  { id: 1, name: '敦煌九色鹿', bg: 'linear-gradient(135deg,#C9B89A,#8C5A3C)' },
  { id: 2, name: '飞天乐舞', bg: 'linear-gradient(135deg,#A8C4B0,#5a8a7d)' },
  { id: 3, name: '千手观音', bg: 'linear-gradient(135deg,#D6A87A,#A05A3C)' },
  { id: 4, name: '二十四节气', bg: 'linear-gradient(135deg,#E8D5B8,#C9B89A)' },
  { id: 5, name: '文创物语', bg: 'linear-gradient(135deg,#DEC38A,#C7A66E)' },
  { id: 6, name: '色卡推荐', bg: 'linear-gradient(135deg,#F0E4D1,#C5483C)' },
]
const news = [
  { emoji: '🌸', title: '2024 春夏趋势花型发布', date: '2024-06-20', bg: 'rgba(222,195,138,0.4)' },
  { emoji: '🏆', title: '敦煌主题设计大赛开启', date: '2024-06-15', bg: 'rgba(197,72,60,0.18)' },
  { emoji: '⚙️', title: '系统升级维护通知', date: '2024-05-15', bg: 'rgba(90,138,125,0.2)' },
]
const tips = ['尝试用 AI 延展生成同款变体', '搭配色卡映射快速换季配色', '亲子袜一键生成成人 + 儿童款']

function goAuthed(name: string) {
  if (!userStore.isLogin) {
    router.push({ name: 'Login', query: { redirect: name === 'Mine' ? '/mine' : '/cart' } })
    return
  }
  router.push({ name })
}

onMounted(async () => {
  try {
    const res = await catalogApi.listSocks()
    socks.value = res.data
  } catch {
    /* 后端未启动时静默 */
  }
  if (userStore.isLogin) {
    try {
      const ov = await userApi.overview()
      overview.designs = ov.data.designs
      overview.orders = ov.data.orders
    } catch {
      /* 忽略 */
    }
  }
})
</script>

<style scoped>
.home {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: start;
}
.hero {
  display: flex;
  gap: 24px;
  background: radial-gradient(80% 60% at 100% 0%, rgba(222, 195, 138, 0.4), transparent 70%), linear-gradient(135deg, #fffcf6, #f2e6d2);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 36px;
  align-items: center;
}
.hero-content {
  flex: 1;
}
.hero-title {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0.04em;
  font-family: var(--font-art);
}
.hero-desc {
  margin: 12px 0 20px;
  color: var(--text-2);
  font-size: 14px;
}
.hero-cta {
  display: flex;
  gap: 12px;
}
.hero-banner {
  width: 240px;
  height: 130px;
  border-radius: 14px;
  background: linear-gradient(135deg, #bfa990, #8c7359);
  color: #2b1f14;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  font-family: var(--font-art);
}
.quick {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 20px;
}
.quick-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  text-align: left;
  transition: transform 0.15s;
}
.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}
.quick-icon {
  font-size: 26px;
}
.quick-text {
  display: flex;
  flex-direction: column;
}
.quick-text b {
  font-size: 14px;
}
.quick-text i {
  font-size: 12px;
  color: var(--text-3);
  font-style: normal;
}
.section {
  margin-top: 28px;
}
.section-title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 16px;
  font-family: var(--font-art);
  letter-spacing: 0.04em;
}
.preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.preset-card {
  height: 150px;
  border: none;
  border-radius: 16px;
  display: flex;
  align-items: flex-end;
  padding: 16px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.18s;
}
.preset-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.preset-name {
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  font-family: var(--font-art);
}
.sock-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.sock-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
}
.sock-name {
  font-size: 15px;
  font-weight: 700;
}
.sock-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-3);
}
/* 右栏 */
.home-rail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rail-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
}
.rail-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}
.news-item {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.news-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.news-t {
  font-size: 13px;
  font-weight: 600;
}
.news-d {
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-3);
}
.order-stats {
  display: flex;
  justify-content: space-between;
}
.os {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.os b {
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
}
.os i {
  font-size: 11px;
  color: var(--text-3);
  font-style: normal;
}
.tips .tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--text-2);
}
.tip-num {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
@media (max-width: 1024px) {
  .home {
    grid-template-columns: 1fr;
  }
  .home-rail {
    display: none;
  }
}
@media (max-width: 720px) {
  .preset-grid,
  .quick {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-banner {
    display: none;
  }
}
</style>
