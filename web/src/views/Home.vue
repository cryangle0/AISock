<template>
  <div class="home">
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
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { catalogApi, type SockModel } from '@/api'

const socks = ref<SockModel[]>([])
const presets = [
  { id: 1, name: '敦煌九色鹿', bg: 'linear-gradient(135deg,#C9B89A,#8C5A3C)' },
  { id: 2, name: '飞天乐舞', bg: 'linear-gradient(135deg,#A8C4B0,#5a8a7d)' },
  { id: 3, name: '千手观音', bg: 'linear-gradient(135deg,#D6A87A,#A05A3C)' },
  { id: 4, name: '二十四节气', bg: 'linear-gradient(135deg,#E8D5B8,#C9B89A)' },
  { id: 5, name: '文创物语', bg: 'linear-gradient(135deg,#DEC38A,#C7A66E)' },
  { id: 6, name: '色卡推荐', bg: 'linear-gradient(135deg,#F0E4D1,#C5483C)' },
]

onMounted(async () => {
  try {
    const res = await catalogApi.listSocks()
    socks.value = res.data
  } catch {
    /* 后端未启动时静默 */
  }
})
</script>

<style scoped>
.hero {
  display: flex;
  gap: 24px;
  background: radial-gradient(80% 60% at 100% 0%, rgba(222, 195, 138, 0.4), transparent 70%), linear-gradient(135deg, #fffcf6, #f2e6d2);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 40px 36px;
  align-items: center;
}
.hero-content {
  flex: 1;
}
.hero-title {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 0.04em;
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
  width: 280px;
  height: 140px;
  border-radius: 14px;
  background: linear-gradient(135deg, #bfa990, #8c7359);
  color: #2b1f14;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}
.section {
  margin-top: 32px;
}
.section-title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 16px;
}
.preset-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}
.preset-card {
  height: 160px;
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
  font-size: 16px;
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
  padding: 20px;
}
.sock-name {
  font-size: 16px;
  font-weight: 700;
}
.sock-meta {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-3);
}
@media (max-width: 960px) {
  .preset-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .hero-banner {
    display: none;
  }
}
</style>
