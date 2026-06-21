<template>
  <div class="app-bg">
    <!-- 背景薄荷光晕（设计稿 #94edd8 椭圆） -->
    <span class="glow glow-a" />
    <span class="glow glow-b" />

    <!-- 固定 1280 设计画布 -->
    <div class="canvas">
      <!-- 顶栏 1280×64（透明，浮在绿色渐变上） -->
      <header class="topbar">
        <div class="brand"><img class="brand-logo" :src="logoSrc" alt="" /><span>{{ brandName }}</span></div>
        <div class="topbar-right">
          <button class="glass-btn" :title="theme === 'dark' ? '日间模式' : '夜间模式'" @click.stop="toggleTheme">
            <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" color="#fff" />
          </button>
          <div class="hbtn">
            <button class="glass-btn" title="搜索" @click.stop="toggleSearch"><AppIcon name="search" :size="16" color="#fff" /></button>
            <div v-if="searchOpen" class="hpanel search-panel" @click.stop>
              <div class="sp-input">
                <AppIcon name="search" :size="16" color="var(--text-3)" />
                <input ref="searchInput" v-model="searchKw" placeholder="搜索花型…" @keyup.enter="doSearch" />
                <button v-if="searchKw" class="sp-clear" @click="searchKw = ''"><AppIcon name="close" :size="14" color="var(--text-3)" /></button>
              </div>
              <div v-if="searchLoading" class="sp-hint">搜索中…</div>
              <div v-else-if="searched && !searchResults.length" class="sp-hint">没有找到「{{ lastKw }}」相关花型</div>
              <div v-else-if="searchResults.length" class="sp-grid">
                <button v-for="p in searchResults" :key="p.id" class="sp-card" @click="openPattern(p)">
                  <img :src="p.thumb_url || p.image_url" :alt="p.name" loading="lazy" />
                  <span>{{ p.name }}</span>
                </button>
              </div>
              <div v-else class="sp-hint">输入关键词搜索公共花型</div>
            </div>
          </div>
          <div class="hbtn">
            <button class="glass-btn" title="消息" @click.stop="toggleMsg"><AppIcon name="chat" :size="16" color="#fff" /></button>
            <div v-if="msgOpen" class="hpanel msg-panel" @click.stop>
              <div class="mp-head">消息</div>
              <div class="mp-empty"><AppIcon name="bell" :size="26" color="var(--text-3)" /><p>暂无新消息</p></div>
              <button class="mp-service" @click="contactService"><AppIcon name="headset" :size="16" /> 联系客服</button>
            </div>
          </div>
          <span class="hdivider" />
          <div class="user" @click.stop="onUserClick">
            <span class="user-avatar">
              <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" alt="" />
              <span v-else class="user-initial">{{ avatarText }}</span>
            </span>
            <span class="user-name">{{ userStore.isLogin ? (userStore.userInfo?.nickname || '用户') : '登录' }}</span>
            <AppIcon name="chevron-down" :size="16" color="rgba(255,255,255,.9)" />
          </div>
          <div v-if="menuOpen" class="user-menu" @click.stop>
            <button v-if="userStore.isLogin" class="um-item" @click="go('Mine')">个人中心</button>
            <button v-if="userStore.isLogin" class="um-item" @click="go('Cart')">我的订单</button>
            <button v-if="userStore.isLogin" class="um-item danger" @click="onLogout">退出登录</button>
            <button v-else class="um-item" @click="loginNow">登录 / 注册</button>
          </div>
        </div>
      </header>

      <!-- 主面板 1240×818 r32 -->
      <div class="panel">
        <!-- 左侧细导航 71px -->
        <aside class="rail">
          <button
            v-for="t in tabs"
            :key="t.name"
            :class="['rail-item', { active: isActive(t) }]"
            @click="onNav(t)"
          >
            <span class="rail-ico"><AppIcon :name="isActive(t) ? t.iconActive : t.icon" :size="22" /></span>
            <span class="rail-label">{{ t.label }}</span>
          </button>
        </aside>

        <!-- 内容区 #f5faf9（各页面在此渲染，宽 1169） -->
        <main class="content">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore, useSiteConfigStore } from '@/store'
import { useAuthModal } from '@/composables/useAuthModal'
import { useTheme } from '@/composables/useTheme'
import { catalogApi, type Pattern } from '@/api'
import { detailRoute } from '@/domain/catalog'
import { useServiceQr } from '@/composables/useServiceQr'
import AppIcon from '@/components/ui/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const site = useSiteConfigStore()
const { openLogin } = useAuthModal()
const { theme, toggleTheme } = useTheme()
const { openServiceQr } = useServiceQr()
const menuOpen = ref(false)

// 顶栏：搜索 / 消息浮层
const searchOpen = ref(false)
const msgOpen = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
const searchKw = ref('')
const searchResults = ref<Pattern[]>([])
const searchLoading = ref(false)
const searched = ref(false)
const lastKw = ref('')

function closePanels() { menuOpen.value = false; searchOpen.value = false; msgOpen.value = false }
function toggleSearch() {
  msgOpen.value = false; menuOpen.value = false
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) nextTick(() => searchInput.value?.focus())
}
function toggleMsg() { searchOpen.value = false; menuOpen.value = false; msgOpen.value = !msgOpen.value }
async function doSearch() {
  const kw = searchKw.value.trim()
  if (!kw) { searchResults.value = []; searched.value = false; return }
  searchLoading.value = true; lastKw.value = kw
  try {
    const res = await catalogApi.listPatterns({ pageNum: 1, pageSize: 12, keyword: kw })
    searchResults.value = res.data?.list ?? []
  } catch {
    searchResults.value = []
  } finally {
    searchLoading.value = false; searched.value = true
  }
}
function openPattern(p: Pattern) {
  searchOpen.value = false
  router.push(detailRoute(p.id))
}
function contactService() { msgOpen.value = false; openServiceQr() }

const brandName = computed(() => site.config.brandName || '爱花型 · 设计')
const logoSrc = computed(() => site.config.logoUrl || import.meta.env.BASE_URL + 'logo.png')

interface Tab { name: string; label: string; icon: string; iconActive: string; auth?: boolean }
const tabs: Tab[] = [
  { name: 'Home', label: '首页', icon: 'home', iconActive: 'home-fill' },
  { name: 'Feed', label: '推荐', icon: 'palette', iconActive: 'palette' },
  { name: 'Editor', label: 'AI设计', icon: 'sparkle', iconActive: 'sparkle-fill' },
  { name: 'Cart', label: '购物车', icon: 'bag', iconActive: 'bag', auth: true },
  { name: 'Mine', label: '我的', icon: 'user', iconActive: 'user', auth: true },
]

const avatarText = computed(() => (userStore.userInfo?.nickname || '客').charAt(0))
function isActive(t: Tab) {
  if (t.name === 'Cart') return route.name === 'Cart' || route.name === 'OrderDetail'
  if (t.name === 'Feed') return route.name === 'Feed' || route.name === 'ProductDetail'
  return route.name === t.name
}
function onNav(t: Tab) {
  if (t.auth && !userStore.isLogin) {
    openLogin(t.name === 'Mine' ? '/mine' : '/cart')
    return
  }
  if (route.name !== t.name) router.push({ name: t.name })
}
function onUserClick() {
  if (!userStore.isLogin) { openLogin(); return }
  menuOpen.value = !menuOpen.value
}
function go(name: string) { menuOpen.value = false; router.push({ name }) }
function loginNow() { menuOpen.value = false; openLogin() }
async function onLogout() {
  menuOpen.value = false
  await userStore.logout()
  router.push({ name: 'Home' })
}

onMounted(() => {
  if (userStore.isLogin) userStore.refreshProfile().catch(() => {})
  document.addEventListener('click', closePanels)
})
</script>

<style scoped>
.app-bg {
  position: relative;
  height: 100vh;
  overflow: hidden;
}
/* 薄荷光晕 */
.glow { position: fixed; border-radius: 50%; background: var(--mint); filter: blur(120px); opacity: 0.5; pointer-events: none; z-index: 0; }
.glow-a { width: 1060px; height: 675px; top: 120px; left: calc(50% - 180px); }
.glow-b { width: 710px; height: 546px; top: 330px; left: calc(50% + 140px); opacity: 0.4; }

/* 自适应铺满画布（不固定 1280） */
.canvas {
  position: relative;
  z-index: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── 顶栏 1280×64 ── */
.topbar {
  position: relative;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 50;
}
.brand { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 700; color: #fff; letter-spacing: 0.02em; }
.brand-logo { width: 34px; height: 34px; object-fit: contain; border-radius: 9px; background: rgba(255, 255, 255, 0.92); padding: 3px; flex-shrink: 0; }
.brand-sub { font-weight: 700; opacity: 0.95; }
.topbar-right { display: flex; align-items: center; gap: 24px; }
.glass-btn {
  width: 32px; height: 32px; border-radius: var(--r-hero);
  background: var(--white-glass);
  display: inline-flex; align-items: center; justify-content: center;
  transition: background 0.16s;
}
.glass-btn:hover { background: rgba(255, 255, 255, 0.32); }

/* 顶栏圆钮浮层（搜索 / 消息） + 分隔线 */
.hbtn { position: relative; display: inline-flex; }
.hdivider { width: 1px; height: 22px; background: rgba(255, 255, 255, 0.45); }
.hpanel {
  position: absolute; top: 46px; right: 0;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--r-12); box-shadow: var(--shadow-md);
  z-index: 60; padding: 12px;
}
.search-panel { width: 340px; }
.sp-input { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; background: var(--surface); border-radius: var(--r-8); }
.sp-input input { flex: 1; font-size: 13px; color: var(--text); }
.sp-clear { display: inline-flex; }
.sp-hint { padding: 18px 4px; text-align: center; font-size: 12px; color: var(--text-3); }
.sp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; max-height: 320px; overflow-y: auto; }
.sp-card { display: flex; flex-direction: column; gap: 4px; text-align: left; }
.sp-card img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--r-8); background: var(--card-pink); }
.sp-card span { font-size: 11px; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg-panel { width: 240px; }
.mp-head { font-size: 14px; font-weight: 600; color: var(--text); padding: 4px 4px 10px; }
.mp-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 22px 0; color: var(--text-3); font-size: 12px; }
.mp-service { width: 100%; height: 38px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--r-8); background: var(--surface); color: var(--text); font-size: 13px; font-weight: 600; margin-top: 6px; }
.mp-service:hover { color: var(--primary); }
.user { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%; overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-initial { color: var(--primary); font-weight: 700; font-size: 15px; }
.user-name { font-size: 14px; font-weight: 500; color: #fff; }
.user-menu {
  position: absolute; top: 56px; right: 0;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-12);
  box-shadow: var(--shadow-md); padding: 6px; display: flex; flex-direction: column;
  min-width: 140px; z-index: 60;
}
.um-item { text-align: left; padding: 9px 14px; font-size: 14px; color: var(--text); border-radius: var(--r-8); }
.um-item:hover { background: var(--bg-hover); }
.um-item.danger { color: #e0584a; }

/* ── 主面板 1240×818 r32 ── */
.panel {
  flex: 1;
  min-height: 0;
  margin: 0 20px 20px;
  display: flex;
  background: var(--surface);
  border-radius: var(--r-panel);
  box-shadow: var(--shadow-panel);
  overflow: hidden;
}
.rail {
  width: 71px;
  flex-shrink: 0;
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
}
.rail-item {
  width: 46px; height: 66px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  border-radius: var(--r-nav);
  color: var(--text-mid);
  transition: color 0.15s, background 0.15s;
}
.rail-item:hover { color: var(--primary); }
.rail-ico { display: inline-flex; align-items: center; justify-content: center; }
.rail-item.active { background: var(--primary); color: #fff; }
.rail-label { font-size: 12px; font-weight: 400; }
.rail-item.active .rail-label { font-weight: 500; }

.content { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
</style>
