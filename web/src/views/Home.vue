<template>
  <div class="home-page">
    <!-- 中间主区 -->
    <div class="home-main">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">从一根花线到成品</h1>
          <p class="hero-desc">
            3 分钟出袜款，或直接进入设计器<br />
            自由编辑模板匹配花型，AI 同款一键延展<br />
            提交至爱花型工厂量产。
          </p>
          <div class="hero-cta">
            <button class="btn-primary" @click="goEditor">▶ 开始设计</button>
            <button class="btn-ghost" @click="$router.push({ name: 'Feed' })">浏览灵感</button>
          </div>
        </div>
        <div class="hero-stage">
          <img class="hero-sock" src="/image-tool/sock.png" alt="袜款展示" draggable="false" />
        </div>
      </section>

      <!-- 4 格快捷入口 -->
      <section class="quick">
        <button class="quick-card" @click="goEditor">
          <span class="quick-icon">✏️</span>
          <span class="quick-text"><b>开始设计</b><i>进入袜版编辑器</i></span>
          <span class="quick-arrow">›</span>
        </button>
        <button class="quick-card" @click="goAuthed('Mine')">
          <span class="quick-icon">📁</span>
          <span class="quick-text"><b>我的设计</b><i>{{ overview.designs }} 个模板</i></span>
          <span class="quick-arrow">›</span>
        </button>
        <button class="quick-card" @click="goAuthed('Cart')">
          <span class="quick-icon">🛒</span>
          <span class="quick-text"><b>购物车</b><i>{{ orderTotal }} 个订单</i></span>
          <span class="quick-arrow">›</span>
        </button>
        <button class="quick-card" @click="$router.push({ name: 'Feed' })">
          <span class="quick-icon">🎨</span>
          <span class="quick-text"><b>推荐灵感</b><i>主题 + 配色</i></span>
          <span class="quick-arrow">›</span>
        </button>
      </section>

      <!-- 袜版设计预设 -->
      <section class="section">
        <div class="section-head">
          <h2 class="section-title">袜版设计预设 ✨</h2>
          <span class="section-sub">从模板快速开局，一键进入编辑器调整即用</span>
          <button class="section-more" @click="goEditor">查看更多模板 ›</button>
        </div>
        <div class="preset-grid">
          <button v-for="p in presets" :key="p.id" class="preset-card" @click="goEditor">
            <div class="preset-cover">
              <SockMiniSvg :uid="p.id" :regions="p.regions" />
            </div>
            <div class="preset-meta">
              <div class="preset-name">{{ p.name }}</div>
              <div class="preset-desc">4 区模板</div>
            </div>
          </button>
        </div>
      </section>
    </div>

    <!-- 右侧信息栏 -->
    <aside class="home-rail">
      <div class="rp-card">
        <div class="rp-head"><h3 class="rp-title">资讯中心</h3><button class="rp-more">查看更多 ›</button></div>
        <div class="rp-news">
          <div v-for="n in news" :key="n.title" class="rp-news-item">
            <span class="rp-news-icon" :style="{ background: n.bg }">{{ n.emoji }}</span>
            <div class="rp-news-text">
              <div class="rp-news-title">{{ n.title }}</div>
              <div class="rp-news-meta">{{ n.meta }}</div>
              <div class="rp-news-date">{{ n.date }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="rp-card">
        <div class="rp-head"><h3 class="rp-title">我的订单</h3><button class="rp-more" @click="goAuthed('Cart')">查看更多 ›</button></div>
        <div class="rp-orders">
          <div class="rp-stat"><span class="rp-stat-num">{{ orderTotal }}</span><span class="rp-stat-label">订单总数</span></div>
          <div class="rp-stat"><span class="rp-stat-num">{{ overview.orders.pending ?? 0 }}</span><span class="rp-stat-label">待确认</span></div>
          <div class="rp-stat"><span class="rp-stat-num">{{ overview.orders.producing ?? 0 }}</span><span class="rp-stat-label">生产中</span></div>
          <div class="rp-stat"><span class="rp-stat-num">{{ overview.orders.done ?? 0 }}</span><span class="rp-stat-label">已完成</span></div>
        </div>
      </div>

      <div class="rp-card rp-faq">
        <div class="rp-faq-icon">🧦</div>
        <div class="rp-faq-text">
          <h3 class="rp-title">常见问题</h3>
          <p class="rp-faq-desc">快速查看使用说明</p>
        </div>
        <button class="rp-faq-btn">查看详情</button>
      </div>

      <div class="rp-card">
        <div class="rp-head"><h3 class="rp-title">设计灵感</h3></div>
        <div class="rp-tips">
          <div v-for="(t, i) in tips" :key="i" class="rp-tip">
            <span class="rp-tip-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="rp-tip-text">{{ t }}</span>
          </div>
        </div>
      </div>

      <div class="rp-card">
        <div class="rp-head"><h3 class="rp-title">最近活动</h3></div>
        <div class="rp-activity">
          <div v-for="(a, i) in activities" :key="i" class="rp-act-item">
            <span class="rp-act-dot" />
            <span class="rp-act-text">{{ a.text }}</span>
            <span class="rp-act-time">{{ a.time }}</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api'
import { useUserStore } from '@/store'
import SockMiniSvg from '@/components/SockMiniSvg.vue'
import { PRESETS } from '@/data/presets'

const router = useRouter()
const userStore = useUserStore()
const presets = PRESETS
const overview = reactive<{ designs: number; orders: Record<string, number> }>({ designs: 0, orders: {} })
const orderTotal = computed(() => overview.orders.total ?? 0)

const news = [
  { emoji: '🌸', title: '2024 春夏趋势花型发布', meta: '最新花型趋势已上线，快来获取灵感！', date: '2024-06-20', bg: 'rgba(222,195,138,0.4)' },
  { emoji: '🏆', title: '敦煌主题设计大赛开启', meta: '参与赢取丰厚奖励，展示你的创意！', date: '2024-06-15', bg: 'rgba(197,72,60,0.18)' },
  { emoji: '⚙️', title: '系统升级维护通知', meta: '9月25日 02:00~04:00 系统升级维护', date: '2024-05-15', bg: 'rgba(90,138,125,0.2)' },
]
const tips = ['尝试用 AI 延展生成同款变体', '搭配色卡映射快速换季配色', '亲子袜一键生成成人 + 儿童款']
const activities = [
  { text: '保存了「经典条纹袜」设计', time: '2 小时前' },
  { text: '提交了订单 AS20260524', time: '昨天' },
  { text: '上传了 3 张新素材', time: '3 天前' },
]

function goEditor() {
  router.push({ name: 'Editor' })
}
function goAuthed(name: string) {
  if (!userStore.isLogin) {
    router.push({ name: 'Login', query: { redirect: name === 'Mine' ? '/mine' : '/cart' } })
    return
  }
  router.push({ name })
}

onMounted(async () => {
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
.home-page {
  display: flex;
  gap: 0;
  height: 100%;
}
.home-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 20px 32px;
  overflow-y: auto;
}
.home-main > * {
  flex-shrink: 0;
}

/* Hero */
.hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px 36px;
  background:
    radial-gradient(80% 60% at 100% 0%, rgba(222, 195, 138, 0.4), transparent 70%),
    linear-gradient(135deg, #fffcf6 0%, #f2e6d2 100%);
  border: 1px solid var(--border);
  border-radius: 18px;
  min-height: 200px;
  position: relative;
  overflow: hidden;
}
.hero-content {
  flex: 1;
  min-width: 0;
}
.hero-title {
  margin: 0 0 12px;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.2;
  font-family: var(--font-art);
}
.hero-desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.85;
}
.hero-cta {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.hero-stage {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-sock {
  width: 180px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.08));
}

/* 快捷入口 */
.quick {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.quick-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  text-align: left;
  transition: all 0.18s;
}
.quick-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.quick-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--bg-hover);
  flex-shrink: 0;
}
.quick-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.quick-text b {
  font-size: 13px;
}
.quick-text i {
  font-size: 11px;
  color: var(--text-3);
  font-style: normal;
}
.quick-arrow {
  color: var(--text-3);
}

/* Section */
.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.section-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.section-title {
  font-size: 18px;
  font-weight: 800;
  font-family: var(--font-art);
  letter-spacing: 0.04em;
}
.section-sub {
  font-size: 12px;
  color: var(--text-3);
}
.section-more {
  margin-left: auto;
  background: transparent;
  border: none;
  color: var(--text-2);
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
}
.section-more:hover {
  background: var(--bg-hover);
  color: var(--text);
}

/* 预设 6 列 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
.preset-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  transition: all 0.18s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.preset-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
}
.preset-cover {
  aspect-ratio: 1;
  background: var(--bg-hover);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  overflow: hidden;
}
.preset-name {
  font-size: 12px;
  font-weight: 600;
}
.preset-desc {
  font-size: 10px;
  color: var(--text-3);
}

/* 右栏 */
.home-rail {
  width: 280px;
  flex-shrink: 0;
  padding: 16px 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}
.rp-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rp-title {
  font-size: 14px;
  font-weight: 700;
}
.rp-more {
  background: transparent;
  border: none;
  color: var(--text-3);
  font-size: 11px;
}
.rp-news {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rp-news-item {
  display: flex;
  gap: 10px;
}
.rp-news-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rp-news-title {
  font-size: 12px;
  font-weight: 600;
}
.rp-news-meta {
  font-size: 10px;
  color: var(--text-3);
  line-height: 1.4;
}
.rp-news-date {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 2px;
}
.rp-orders {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.rp-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0;
}
.rp-stat-num {
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
}
.rp-stat-label {
  font-size: 10px;
  color: var(--text-3);
}
.rp-faq {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}
.rp-faq-icon {
  font-size: 32px;
}
.rp-faq-text {
  flex: 1;
}
.rp-faq-desc {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
}
.rp-faq-btn {
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 11px;
  color: var(--text-2);
}
.rp-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rp-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.rp-tip-num {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.rp-tip-text {
  font-size: 11px;
  color: var(--text-2);
  line-height: 1.5;
}
.rp-activity {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rp-act-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}
.rp-act-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0.6;
  flex-shrink: 0;
}
.rp-act-text {
  flex: 1;
  color: var(--text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rp-act-time {
  font-size: 10px;
  color: var(--text-3);
  flex-shrink: 0;
}

@media (max-width: 1280px) {
  .preset-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .home-rail {
    width: 240px;
  }
}
@media (max-width: 1080px) {
  .home-rail {
    display: none;
  }
  .quick {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 720px) {
  .hero-stage {
    display: none;
  }
  .preset-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
