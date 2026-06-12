<template>
  <div class="lp-root">
    <!-- 左面板：品牌 + 动画角色（眼睛跟随鼠标） -->
    <aside class="lp-left">
      <header class="lp-left-header">
        <img class="lp-left-logo" src="/logo.png" alt="爱花型" />
        <span class="lp-left-brand">爱花型 · 运营后台</span>
      </header>

      <div class="lp-stage-wrap">
        <div ref="stageRef" class="lp-stage">
          <div
            v-for="c in characters"
            :key="c.key"
            :ref="(el) => setCharRef(c.key, el)"
            class="lp-char"
            :class="{ peeking: c.key === 'purple' && peeking }"
            :style="charStyle(c)"
          >
            <!-- 眼睛 -->
            <div class="lp-eyes" :style="eyesStyle(c)">
              <template v-if="c.eyeball">
                <span
                  v-for="i in 2"
                  :key="i"
                  class="lp-eyeball"
                  :class="{ blink: blink[c.key] }"
                  :style="{ width: c.eyeSize + 'px', height: (blink[c.key] ? 2 : c.eyeSize) + 'px' }"
                >
                  <span
                    v-show="!blink[c.key]"
                    class="lp-pupil"
                    :style="pupilStyle(c)"
                  />
                </span>
              </template>
              <template v-else>
                <span
                  v-for="i in 2"
                  :key="i"
                  class="lp-pupil bare"
                  :style="pupilStyle(c)"
                />
              </template>
            </div>
            <!-- 嘴巴（黄色角色） -->
            <div v-if="c.mouth" class="lp-mouth" />
          </div>
        </div>
      </div>

      <div class="lp-left-footer">AI 袜版设计 · 一站式运营管理平台</div>
      <div class="lp-left-grid" />
      <div class="lp-glow lp-glow-1" />
      <div class="lp-glow lp-glow-2" />
    </aside>

    <!-- 右面板：登录卡片 -->
    <main class="lp-right">
      <div class="lp-card">
        <div class="lp-mobile-brand">
          <img src="/logo.png" alt="爱花型" />
          <span>爱花型 · 运营后台</span>
        </div>

        <div class="lp-heading">
          <h1>欢迎回来 👋</h1>
          <p>登录管理后台，开始今天的运营工作</p>
        </div>

        <a-form :model="form" layout="vertical" @submit="onSubmit">
          <a-form-item field="username" hide-label>
            <a-input
              v-model="form.username"
              placeholder="用户名"
              size="large"
              @focus="isTyping = true"
              @blur="isTyping = false"
            >
              <template #prefix><icon-user /></template>
            </a-input>
          </a-form-item>
          <a-form-item field="password" hide-label>
            <a-input-password
              v-model="form.password"
              placeholder="密码"
              size="large"
              @focus="isTyping = true"
              @blur="isTyping = false"
              @keyup.enter="onSubmit"
            >
              <template #prefix><icon-lock /></template>
            </a-input-password>
          </a-form-item>
          <a-button type="primary" long size="large" :loading="loading" @click="onSubmit">
            登录
          </a-button>
        </a-form>

        <p class="lp-tip">默认账号：admin / admin123</p>
      </div>

      <div class="lp-copy">爱花型袜业 · 2026</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/store'

interface CharDef {
  key: string
  color: string
  left: number
  width: number
  height: number
  radius: string
  z: number
  eyeball: boolean
  eyeSize: number
  pupilSize: number
  gap: number
  eyeLeft: number
  eyeTop: number
  mouth?: boolean
}

// 4 个角色（紫/黑/橙/黄），紫黑有白眼球、橙黄仅瞳孔，黄色带嘴
const characters: CharDef[] = [
  { key: 'purple', color: '#6C3FF5', left: 70, width: 180, height: 400, radius: '12px 12px 0 0', z: 1, eyeball: true, eyeSize: 18, pupilSize: 7, gap: 30, eyeLeft: 46, eyeTop: 44 },
  { key: 'black', color: '#2D2D2D', left: 230, width: 120, height: 300, radius: '10px 10px 0 0', z: 2, eyeball: true, eyeSize: 16, pupilSize: 6, gap: 22, eyeLeft: 28, eyeTop: 34 },
  { key: 'orange', color: '#FF9B6B', left: 0, width: 230, height: 190, radius: '115px 115px 0 0', z: 3, eyeball: false, eyeSize: 0, pupilSize: 12, gap: 30, eyeLeft: 80, eyeTop: 88 },
  { key: 'yellow', color: '#E8D754', left: 300, width: 140, height: 220, radius: '70px 70px 0 0', z: 4, eyeball: false, eyeSize: 0, pupilSize: 12, gap: 22, eyeLeft: 50, eyeTop: 40, mouth: true },
]

const MAX_DIST = 6
const stageRef = ref<HTMLElement | null>(null)
const charRefs: Record<string, HTMLElement | null> = {}
function setCharRef(key: string, el: any) {
  charRefs[key] = (el as HTMLElement) || null
}

// 每个角色的瞳孔偏移 + 眨眼状态
const pupil = reactive<Record<string, { x: number; y: number }>>({
  purple: { x: 0, y: 0 }, black: { x: 0, y: 0 }, orange: { x: 0, y: 0 }, yellow: { x: 0, y: 0 },
})
const blink = reactive<Record<string, boolean>>({ purple: false, black: false })
const isTyping = ref(false)
const peeking = ref(false)

function onMouseMove(e: MouseEvent) {
  for (const c of characters) {
    const el = charRefs[c.key]
    if (!el) continue
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 3
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.min(Math.hypot(dx, dy), MAX_DIST)
    const ang = Math.atan2(dy, dx)
    pupil[c.key] = { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist }
  }
}

function charStyle(c: CharDef) {
  return {
    left: c.left + 'px',
    width: c.width + 'px',
    height: c.height + 'px',
    background: c.color,
    borderRadius: c.radius,
    zIndex: String(c.z),
  }
}
function eyesStyle(c: CharDef) {
  return { left: c.eyeLeft + 'px', top: c.eyeTop + 'px', gap: c.gap + 'px' }
}
function pupilStyle(c: CharDef) {
  const p = pupil[c.key] || { x: 0, y: 0 }
  return {
    width: c.pupilSize + 'px',
    height: c.pupilSize + 'px',
    transform: `translate(${p.x}px, ${p.y}px)`,
  }
}

// 随机眨眼（紫/黑角色）
let blinkTimers: ReturnType<typeof setTimeout>[] = []
function scheduleBlink(key: string) {
  const t = setTimeout(() => {
    blink[key] = true
    setTimeout(() => {
      blink[key] = false
      scheduleBlink(key)
    }, 150)
  }, Math.random() * 4000 + 3000)
  blinkTimers.push(t)
}

// 输入密码时紫色角色偶尔"偷看"
let peekTimer: ReturnType<typeof setTimeout> | null = null
function schedulePeek() {
  peekTimer = setTimeout(() => {
    peeking.value = true
    setTimeout(() => { peeking.value = false; schedulePeek() }, 700)
  }, Math.random() * 3000 + 2500)
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  scheduleBlink('purple')
  scheduleBlink('black')
  schedulePeek()
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  blinkTimers.forEach(clearTimeout)
  if (peekTimer) clearTimeout(peekTimer)
})

// ── 登录逻辑 ──
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const form = reactive({ username: 'admin', password: '' })
const loading = ref(false)

async function onSubmit() {
  if (!form.username || !form.password) {
    Message.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    Message.success('登录成功')
    router.push((route.query.redirect as string) || '/dashboard')
  } catch {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="less">
.lp-root {
  display: flex;
  min-height: 100vh;
  background: #f7f3ea;
}

/* ── 左面板 ── */
.lp-left {
  position: relative;
  flex: 1.15;
  display: flex;
  flex-direction: column;
  padding: 40px 56px;
  background: linear-gradient(155deg, #946d60 0%, #7a5347 55%, #5e3c2e 100%);
  color: #fff;
  overflow: hidden;
}
.lp-left-header {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 5;
}
.lp-left-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  padding: 4px;
  box-sizing: border-box;
}
.lp-left-brand {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

/* 角色舞台 */
.lp-stage-wrap {
  position: relative;
  z-index: 5;
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 10px;
}
.lp-stage {
  position: relative;
  width: 440px;
  height: 400px;
}
.lp-char {
  position: absolute;
  bottom: 0;
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), height 0.5s ease;
  transform-origin: bottom center;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
}
.lp-char.peeking {
  transform: translateY(-6px);
}
.lp-eyes {
  position: absolute;
  display: flex;
  transition: left 0.4s ease, top 0.4s ease;
}
.lp-eyeball {
  position: relative;
  background: #fff;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: height 0.12s ease;
}
.lp-pupil {
  background: #2d2d2d;
  border-radius: 999px;
  transition: transform 0.08s ease-out;
}
.lp-pupil.bare {
  background: #2d2d2d;
}
.lp-mouth {
  position: absolute;
  left: 40px;
  top: 92px;
  width: 60px;
  height: 4px;
  border-radius: 999px;
  background: #2d2d2d;
}
.lp-left-footer {
  position: relative;
  z-index: 5;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

.lp-left-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 36px 36px;
  z-index: 1;
}
.lp-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
}
.lp-glow-1 {
  width: 320px;
  height: 320px;
  background: rgba(222, 195, 138, 0.35);
  top: -80px;
  right: -60px;
}
.lp-glow-2 {
  width: 260px;
  height: 260px;
  background: rgba(197, 72, 60, 0.22);
  bottom: -60px;
  left: -40px;
}

/* ── 右面板 ── */
.lp-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
}
.lp-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 12px 40px rgba(94, 60, 30, 0.1);
}
.lp-mobile-brand {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}
.lp-mobile-brand img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}
.lp-mobile-brand span {
  font-size: 17px;
  font-weight: 800;
}
.lp-heading h1 {
  font-size: 24px;
  font-weight: 800;
  color: #2b1f14;
  margin-bottom: 8px;
}
.lp-heading p {
  font-size: 13px;
  color: #998975;
  margin-bottom: 24px;
}
.lp-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #b8a892;
}
.lp-copy {
  position: absolute;
  bottom: 24px;
  font-size: 12px;
  color: #b8a892;
}

@media (max-width: 860px) {
  .lp-left {
    display: none;
  }
  .lp-mobile-brand {
    display: flex;
  }
}
</style>
