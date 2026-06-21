<template>
  <div class="home">
    <!-- 主区 892 -->
    <div class="main">
      <!-- Hero Banner 892×223 r20 -->
      <section class="hero" @click="goEditor()">
        <img class="hero-img" :src="heroImg" alt="主题随心订 花型选不停" draggable="false" />
      </section>

      <!-- 快捷入口 4×（205×74 r16） -->
      <section class="quick">
        <button class="qtile" @click="goEditor()">
          <span class="qico green"><AppIcon name="design" :size="20" /></span>
          <span class="qtxt"><b>AI 设计</b><i>进入袜版编辑器</i></span>
          <AppIcon class="qarrow" name="chevron-right" :size="12" />
        </button>
        <button class="qtile" @click="goAuthed('Mine')">
          <span class="qico terra"><AppIcon name="folder" :size="20" /></span>
          <span class="qtxt"><b>我的设计</b><i>{{ overview.designs }} 个模板</i></span>
          <AppIcon class="qarrow" name="chevron-right" :size="12" />
        </button>
        <button class="qtile" @click="goAuthed('Cart')">
          <span class="qico orange"><AppIcon name="cart" :size="20" /></span>
          <span class="qtxt"><b>购物车</b><i>{{ orderTotal }} 个订单</i></span>
          <AppIcon class="qarrow" name="chevron-right" :size="12" />
        </button>
        <button class="qtile" @click="goEditor()">
          <span class="qico pink"><AppIcon name="image" :size="20" /></span>
          <span class="qtxt"><b>素材库</b><i>公共 + 个人花型</i></span>
          <AppIcon class="qarrow" name="chevron-right" :size="12" />
        </button>
      </section>

      <!-- 袜版设计预设 卡片 r12 -->
      <section class="presets">
        <div class="sec-head">
          <h2 class="sec-title">袜版设计预设</h2>
          <span class="sec-sub">✨ 从模板快速开局，一键进入编辑器调整即用</span>
          <button class="sec-more" @click="goEditor()">查看更多模板 <AppIcon name="chevron-right" :size="12" /></button>
        </div>
        <div v-if="presetsLoading" class="preset-grid">
          <div v-for="n in 10" :key="'sk' + n" class="preset-skel" />
        </div>
        <div v-else class="preset-grid">
          <button v-for="p in presets" :key="p.id" class="preset-card" @click="openPreset(p)">
            <div class="preset-cover">
              <img v-if="p.cover" :src="p.cover" :alt="p.title" loading="lazy" />
              <div v-else class="preset-fallback" :style="{ background: p.bg || 'var(--card-pink)' }" />
            </div>
            <div class="preset-name">{{ p.title }}</div>
            <div class="preset-tag">花型模板</div>
          </button>
        </div>
      </section>
    </div>

    <!-- 右侧信息栏 241 -->
    <aside class="rail-right">
      <!-- 我的订单 -->
      <div class="rcard">
        <div class="rcard-head">
          <h3>我的订单</h3>
          <button class="rmore" @click="goAuthed('Cart')">查看更多 <AppIcon name="chevron-right" :size="11" /></button>
        </div>
        <div class="ostats">
          <div class="ostat"><span class="onum num">{{ orderTotal }}</span><span class="olabel">订单总数</span></div>
          <div class="ostat"><span class="onum num">{{ overview.orders.pending ?? 0 }}</span><span class="olabel">待确认</span></div>
          <div class="ostat"><span class="onum num">{{ overview.orders.producing ?? 0 }}</span><span class="olabel">生产中</span></div>
          <div class="ostat"><span class="onum num">{{ overview.orders.done ?? 0 }}</span><span class="olabel">已完成</span></div>
        </div>
      </div>

      <!-- 常见问题 -->
      <button class="faq-card" @click="openFaq">
        <span class="faq-ico"><AppIcon name="chat" :size="20" color="var(--primary)" /></span>
        <span class="faq-txt"><b>常见问题</b><i>快速查看使用说明</i></span>
      </button>

      <!-- 设计灵感 -->
      <div class="rcard">
        <div class="rcard-head"><h3>设计灵感</h3></div>
        <div class="tips">
          <div v-for="(t, i) in tips" :key="i" class="tip">
            <span class="tip-dot"><AppIcon name="sparkle" :size="8" color="#e08a2e" /></span>
            <span class="tip-text">{{ t }}</span>
          </div>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="rcard">
        <div class="rcard-head"><h3>最近活动</h3></div>
        <div class="acts">
          <span class="act-line" />
          <div v-if="!activities.length" class="act-empty">登录后查看你的最近动态</div>
          <div v-for="(a, i) in activities" :key="i" class="act">
            <span class="act-dot" />
            <span class="act-text">{{ a.text }}</span>
            <span class="act-time">{{ a.time }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 常见问题 弹层 -->
    <div v-if="faqOpen" class="faq-mask" @click="faqOpen = false">
      <div class="faq-panel" @click.stop>
        <div class="faq-head">
          <h3>常见问题</h3>
          <button class="faq-close" @click="faqOpen = false">✕</button>
        </div>
        <div class="faq-list">
          <div v-for="(f, i) in FAQS" :key="i" class="faq-item">
            <div class="faq-q"><AppIcon name="sparkle" :size="15" color="var(--primary)" /> {{ f.q }}</div>
            <div class="faq-a">{{ f.a }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { catalogApi, userApi, designApi, type HomeConfigItem } from '@/api'
import { useUserStore } from '@/store'
import { useAuthModal } from '@/composables/useAuthModal'
import { parsePatternIdFromLink, detailRoute, resolveCfgImg } from '@/domain/catalog'
import AppIcon from '@/components/ui/AppIcon.vue'

const router = useRouter()
const userStore = useUserStore()
const { openLogin } = useAuthModal()
const heroImg = ref(import.meta.env.BASE_URL + 'home-hero.png')
const presets = ref<HomeConfigItem[]>([])
const presetsLoading = ref(true)
const overview = reactive<{ designs: number; orders: Record<string, number> }>({ designs: 0, orders: {} })
const orderTotal = computed(() => overview.orders.total ?? 0)

const tips = ['尝试用 AI 延展生成同款变体', '搭配色卡映射快速换季配色', '亲子袜一键生成成人+儿童款']

interface Act { text: string; time: string }
const activities = ref<Act[]>([])

const faqOpen = ref(false)
const FAQS = [
  { q: '如何开始设计一双袜子？', a: '进入「AI 设计」，从公共库选花型或用 AI 生成图案，拖到袜版上即可，支持调节配色与排布。' },
  { q: '怎么下单和付款？', a: '设计完成后点「下单」填写数量尺码，确认报价后支付；网页端为演示下单，真实付款请在微信小程序内完成。' },
  { q: '支持哪些材质和工艺？', a: '提供多种材质与印花 / 针织工艺，下单时可选，价格按材质 + 工艺 + 数量实时计算。' },
  { q: '设计能保存以后再改吗？', a: '可以。点「保存」存到「我的设计」，之后从「我的」进入可继续编辑。' },
]

function goEditor(presetId?: string) {
  router.push({ name: 'Editor', query: typeof presetId === 'string' ? { preset: presetId } : {} })
}
function openPreset(p: HomeConfigItem) {
  const pid = parsePatternIdFromLink(p.link)
  if (pid) {
    router.push(detailRoute(pid))
    return
  }
  if (p.cover) {
    router.push({ name: 'Editor', query: { cover: p.cover, name: p.title || '' } })
    return
  }
  router.push({ name: 'Feed' })
}
function openFaq() { faqOpen.value = true }
function goAuthed(name: string) {
  if (!userStore.isLogin) {
    openLogin(name === 'Mine' ? '/mine' : '/cart')
    return
  }
  router.push({ name })
}

onMounted(async () => {
  try {
    const h = await catalogApi.home()
    const d = h.data
    if (d.cases?.length) {
      presets.value = d.cases.map((c) => ({
        ...c,
        cover: c.cover ? resolveCfgImg(c.cover, c.cover) : c.cover,
      }))
    }
    const b = (d.banners?.[0] ?? null) as { image_url?: string } | null
    if (b?.image_url) heroImg.value = b.image_url
  } catch { /* 用静态兜底 */ } finally { presetsLoading.value = false }
  if (!userStore.isLogin) return
  try {
    const ov = await userApi.overview()
    overview.designs = ov.data.designs
    overview.orders = ov.data.orders
  } catch { /* 忽略 */ }
  try {
    const ds = await designApi.list()
    activities.value = ds.data.slice(0, 3).map((d) => ({ text: `保存了「${d.name}」设计`, time: (d.created_at || '').slice(5, 10) }))
  } catch { /* 忽略 */ }
})
</script>

<style scoped>
/* 内容区：左 892 主区 + 12 间距 + 241 右栏，内边距 16/12 */
.home {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 12px;
  overflow-y: auto;
}
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }

/* Hero 自适应宽 × 高 223 r20 */
.hero {
  width: 100%; height: clamp(220px, 24vw, 320px);
  border-radius: var(--r-hero);
  overflow: hidden; cursor: pointer;
  background: #cfeedd;
  box-shadow: var(--shadow-sm);
}
.hero-img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }

/* 快捷入口 4×205 r16，间距 24 */
.quick { display: flex; gap: 24px; }
.qtile {
  flex: 1; min-width: 0; height: 74px;
  display: flex; align-items: center;
  padding: 17px 16px;
  background: var(--bg-card); border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  text-align: left;
  transition: transform 0.16s, box-shadow 0.16s;
}
.qtile:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.qico {
  width: 40px; height: 40px; border-radius: var(--r-12);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-right: 12px;
}
.qico.green { background: var(--tile-green-bg); color: var(--tile-green); }
.qico.terra { background: var(--tile-terra-bg); color: var(--tile-terra); }
.qico.orange { background: var(--tile-orange-bg); color: var(--tile-orange); }
.qico.pink { background: var(--tile-pink-bg); color: var(--tile-pink); }
.qtxt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.qtxt b { font-size: 14px; font-weight: 600; color: var(--ink); white-space: nowrap; }
.qtxt i { font-size: 12px; color: var(--text-3); font-style: normal; white-space: nowrap; }
.qarrow { color: var(--text-3); flex-shrink: 0; }

/* 预设卡 r12 */
.presets {
  background: var(--bg-card); border-radius: var(--r-12);
  padding: 16px; box-shadow: var(--shadow-card);
}
.sec-head { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.sec-title { font-size: 20px; font-weight: 600; color: var(--text); }
.sec-sub { font-size: 12px; color: var(--text-3); }
.sec-more {
  margin-left: auto; display: inline-flex; align-items: center; gap: 2px;
  font-size: 12px; color: var(--link-stone);
}
.sec-more:hover { color: var(--primary); }
.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  column-gap: 19px; row-gap: 12px;
}
.preset-card { display: flex; flex-direction: column; gap: 8px; text-align: left; transition: transform 0.16s; }
.preset-card:hover { transform: translateY(-3px); }
.preset-cover {
  width: 100%; aspect-ratio: 157 / 165;
  border-radius: var(--r-12);
  background: var(--card-pink);
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.preset-cover img { width: 100%; height: 100%; object-fit: cover; }
.preset-fallback { width: 100%; height: 100%; }
.preset-name { font-size: 14px; font-weight: 700; color: var(--text); }
.preset-tag { font-size: 10px; color: var(--text-3); }
.preset-skel {
  aspect-ratio: 157 / 200;
  border-radius: var(--r-12);
  background: linear-gradient(100deg, var(--surface-2) 30%, var(--bg-hover) 50%, var(--surface-2) 70%);
  background-size: 280% 100%; animation: home-sh 1.3s linear infinite;
}
@keyframes home-sh { 0% { background-position: 180% 0; } 100% { background-position: -80% 0; } }

/* 右栏 241 */
.rail-right { width: 241px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
.rcard { background: var(--bg-card); border-radius: var(--r-card); padding: 12px; box-shadow: var(--shadow-card); }
.rcard-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.rcard-head h3 { font-size: 16px; font-weight: 600; color: var(--text); }
.rmore { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; color: var(--text-3); }
.rmore:hover { color: var(--primary); }
.ostats { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.ostat {
  background: var(--surface-2); border-radius: var(--r-12);
  padding: 12px; height: 67px;
  display: flex; flex-direction: column; justify-content: center; gap: 6px;
}
.onum { font-size: 20px; font-weight: 700; color: var(--text); line-height: 1; }
.olabel { font-size: 12px; color: var(--text-3); }

/* 常见问题卡 */
.faq-card {
  background: var(--bg-card); border-radius: var(--r-card); padding: 12px;
  box-shadow: var(--shadow-card);
  display: flex; align-items: center; gap: 11px; text-align: left;
  transition: transform 0.16s, box-shadow 0.16s;
}
.faq-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
.faq-card .faq-ico {
  width: 32px; height: 32px; border-radius: var(--r-8);
  background: var(--bg-card); box-shadow: var(--shadow-sm);
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.faq-txt { display: flex; flex-direction: column; gap: 3px; }
.faq-txt b { font-size: 14px; font-weight: 600; color: var(--text); }
.faq-txt i { font-size: 10px; color: var(--text-3); font-style: normal; }

/* 设计灵感 */
.tips { display: flex; flex-direction: column; gap: 8px; }
.tip { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-2); }
.tip-dot {
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--chip-cream);
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tip-text { line-height: 1.3; }

/* 最近活动 */
.acts { position: relative; display: flex; flex-direction: column; gap: 8px; padding-left: 20px; }
.act-line { position: absolute; left: 4px; top: 4px; bottom: 4px; width: 1px; background: var(--divider); }
.act { position: relative; display: flex; align-items: center; gap: 0; font-size: 10px; }
.act-dot {
  position: absolute; left: -20px; top: 50%; transform: translateY(-50%);
  width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong);
}
.act-text { flex: 1; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.act-time { font-size: 9px; color: var(--text-3); flex-shrink: 0; margin-left: 8px; }
.act-empty { font-size: 11px; color: var(--text-3); }

/* 常见问题弹层 */
.faq-mask { position: fixed; inset: 0; z-index: 300; background: rgba(20, 40, 32, 0.4); display: flex; align-items: center; justify-content: center; padding: 20px; }
.faq-panel { width: 100%; max-width: 480px; background: var(--bg-card); border-radius: 18px; box-shadow: var(--shadow-md); overflow: hidden; }
.faq-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--border); }
.faq-head h3 { font-size: 17px; font-weight: 700; }
.faq-close { font-size: 16px; color: var(--text-3); }
.faq-list { padding: 12px 22px 22px; max-height: 60vh; overflow-y: auto; }
.faq-item { padding: 14px 0; border-bottom: 1px solid var(--line); }
.faq-item:last-child { border-bottom: none; }
.faq-q { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.faq-a { font-size: 13px; color: var(--text-2); line-height: 1.6; }
</style>
