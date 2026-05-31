<template>
  <div class="lp-root">
    <!-- 左面板：品牌 + 视觉 -->
    <aside class="lp-left">
      <header class="lp-left-header">
        <img class="lp-left-logo" :src="site.logo()" alt="logo" />
        <span class="lp-left-brand">{{ site.config.brandName }}</span>
      </header>

      <div class="lp-left-stage">
        <div class="lp-hero-logo">
          <img :src="site.logo()" alt="logo" />
        </div>
        <h2 class="lp-hero-title">{{ site.config.loginTitle }}</h2>
        <p class="lp-hero-sub">{{ site.config.loginSubtitle }}</p>
      </div>

      <div class="lp-left-grid" />
      <div class="lp-left-glow lp-left-glow-1" />
      <div class="lp-left-glow lp-left-glow-2" />
    </aside>

    <!-- 右面板：登录卡片 -->
    <main class="lp-right">
      <div class="lp-card">
        <div class="lp-mobile-brand">
          <img :src="site.logo()" alt="logo" />
          <span>{{ site.config.brandName }}</span>
        </div>

        <div class="lp-heading">
          <h1>欢迎回来</h1>
          <p>{{ mode === 'sms' ? '输入手机号和验证码，开始你的袜款设计' : '微信扫码，快速登录' }}</p>
        </div>

        <div class="lp-mode-tabs">
          <button :class="['lp-mode-tab', { active: mode === 'sms' }]" @click="mode = 'sms'">手机号登录</button>
          <button :class="['lp-mode-tab', { active: mode === 'qr' }]" @click="switchToQr">微信扫码</button>
        </div>

        <form v-if="mode === 'sms'" class="lp-form" @submit.prevent="onLogin">
          <label class="lp-field">
            <span class="lp-label">手机号</span>
            <div class="lp-input" :class="{ focus: focused === 'phone' }">
              <input
                v-model="phone"
                type="tel"
                inputmode="numeric"
                maxlength="11"
                placeholder="请输入手机号"
                autocomplete="off"
                @focus="focused = 'phone'"
                @blur="focused = null"
              />
            </div>
          </label>

          <label class="lp-field">
            <span class="lp-label">验证码</span>
            <div class="lp-input" :class="{ focus: focused === 'code' }">
              <input
                v-model="code"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="请输入验证码"
                autocomplete="one-time-code"
                @focus="focused = 'code'"
                @blur="focused = null"
              />
              <button type="button" class="lp-code-btn" :disabled="counting > 0" @click="onSendCode">
                {{ counting > 0 ? `${counting}s` : '获取验证码' }}
              </button>
            </div>
          </label>

          <p class="lp-agreement">登录即代表同意 <span>《用户协议》</span> 和 <span>《隐私政策》</span></p>

          <button type="submit" class="lp-submit" :class="{ enabled: canSubmit && !loading }" :disabled="!canSubmit || loading">
            {{ loading ? '登录中…' : '登录' }}
          </button>
        </form>

        <!-- 微信扫码登录 -->
        <div v-else class="lp-qr">
          <div class="lp-qr-box">
            <img v-if="qrImage" :src="qrImage" alt="微信扫码登录" class="lp-qr-img" />
            <div v-else class="lp-qr-empty">{{ qrError || '二维码生成中…' }}</div>
            <div v-if="qrStatus === 'scanned'" class="lp-qr-overlay">已扫码<br />请在手机上确认</div>
            <div v-else-if="qrStatus === 'expired'" class="lp-qr-overlay" @click="startQr">二维码已过期<br />点击刷新</div>
          </div>
          <p class="lp-qr-tip">打开微信扫一扫，在手机上确认登录</p>
        </div>

        <p class="lp-tip">{{ mode === 'sms' ? '开发环境验证码固定为 1234' : '需在微信中扫码并确认' }}</p>
      </div>

      <div class="lp-copy">{{ site.config.copyright }}</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '@/api'
import { useUserStore, useSiteConfigStore } from '@/store'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const site = useSiteConfigStore()

const mode = ref<'sms' | 'qr'>('sms')
const phone = ref('')
const code = ref('')
const counting = ref(0)
const loading = ref(false)
const focused = ref<'phone' | 'code' | null>(null)

// ── 微信扫码登录 ──
const qrImage = ref('')
const qrError = ref('')
const qrStatus = ref<'pending' | 'scanned' | 'confirmed' | 'expired'>('pending')
let pollTimer: ReturnType<typeof setInterval> | null = null

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function switchToQr() {
  mode.value = 'qr'
  startQr()
}

async function startQr() {
  stopPoll()
  qrImage.value = ''
  qrError.value = ''
  qrStatus.value = 'pending'
  try {
    const res = await authApi.qrCreate()
    if (!res.data.qrImage) {
      qrError.value = '二维码暂不可用，请用手机号登录'
      return
    }
    qrImage.value = res.data.qrImage
    const sceneId = res.data.sceneId
    pollTimer = setInterval(() => pollQr(sceneId), 2000)
  } catch {
    qrError.value = '二维码生成失败，请稍后再试'
  }
}

async function pollQr(sceneId: string) {
  try {
    const res = await authApi.qrPoll(sceneId)
    qrStatus.value = res.data.status
    if (res.data.status === 'confirmed' && res.data.token) {
      stopPoll()
      await userStore.loginByToken(res.data.token)
      const redirect = (route.query.redirect as string) || '/home'
      router.push(redirect)
    } else if (res.data.status === 'expired') {
      stopPoll()
    }
  } catch {
    /* 单次轮询失败忽略 */
  }
}

onUnmounted(stopPoll)

const canSubmit = computed(() => /^1\d{10}$/.test(phone.value) && code.value.length >= 4)

async function onSendCode() {
  if (counting.value > 0) return
  if (!/^1\d{10}$/.test(phone.value)) {
    alert('请输入正确的手机号')
    return
  }
  await authApi.smsSend(phone.value)
  counting.value = 60
  const timer = setInterval(() => {
    counting.value -= 1
    if (counting.value <= 0) clearInterval(timer)
  }, 1000)
}

async function onLogin() {
  if (!canSubmit.value) return
  loading.value = true
  try {
    await userStore.loginBySms(phone.value, code.value)
    const redirect = (route.query.redirect as string) || '/home'
    router.push(redirect)
  } catch (e) {
    alert((e as Error).message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.lp-root {
  display: flex;
  min-height: 100vh;
  background: var(--bg, #f5ede0);
}

/* ── 左面板 ── */
.lp-left {
  position: relative;
  flex: 1.1;
  display: flex;
  flex-direction: column;
  padding: 40px 56px;
  background: linear-gradient(150deg, #946d60 0%, #7a5347 55%, #5e3c2e 100%);
  color: #fff;
  overflow: hidden;
}
.lp-left-header {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
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
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.lp-left-stage {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 22px;
}
.lp-hero-logo {
  width: 132px;
  height: 132px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
}
.lp-hero-logo img {
  width: 92px;
  height: 92px;
  object-fit: contain;
}
.lp-hero-title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.lp-hero-sub {
  font-size: 14px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.82);
}
.lp-left-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 36px 36px;
  z-index: 1;
}
.lp-left-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
}
.lp-left-glow-1 {
  width: 320px;
  height: 320px;
  background: rgba(222, 195, 138, 0.35);
  top: -80px;
  right: -60px;
}
.lp-left-glow-2 {
  width: 260px;
  height: 260px;
  background: rgba(197, 72, 60, 0.25);
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
  background: var(--bg-card, #fff);
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
  font-size: 18px;
  font-weight: 800;
}
.lp-heading h1 {
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 8px;
}
.lp-heading p {
  font-size: 13px;
  color: var(--text-3, #998975);
  margin-bottom: 28px;
}
.lp-field {
  display: block;
  margin-bottom: 18px;
}
.lp-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-2, #6b5a48);
}
.lp-input {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  border: 1px solid var(--border, #e5d8c0);
  border-radius: 12px;
  padding: 0 14px;
  background: var(--bg, #faf6ee);
  transition: border-color 0.18s, box-shadow 0.18s;
}
.lp-input.focus {
  border-color: var(--primary, #8c5a3c);
  box-shadow: 0 0 0 3px rgba(140, 90, 60, 0.12);
  background: #fff;
}
.lp-input input {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}
.lp-code-btn {
  white-space: nowrap;
  border: none;
  background: none;
  color: var(--primary, #8c5a3c);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.lp-code-btn:disabled {
  color: var(--text-3, #b3a690);
  cursor: default;
}
.lp-agreement {
  font-size: 12px;
  color: var(--text-3, #998975);
  margin: 6px 0 20px;
}
.lp-agreement span {
  color: var(--primary, #8c5a3c);
}
.lp-submit {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: var(--bg-hover, #ece2d2);
  color: var(--text-3, #998975);
  font-size: 16px;
  font-weight: 700;
  cursor: not-allowed;
  transition: all 0.18s;
}
.lp-submit.enabled {
  background: linear-gradient(135deg, #946d60, #b99d92);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(148, 109, 96, 0.35);
}
.lp-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-3, #b3a690);
}
.lp-mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 22px;
  background: var(--bg, #faf6ee);
  border-radius: 12px;
  padding: 4px;
}
.lp-mode-tab {
  flex: 1;
  height: 38px;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-3, #998975);
  cursor: pointer;
  transition: all 0.18s;
}
.lp-mode-tab.active {
  background: #fff;
  color: var(--primary, #8c5a3c);
  box-shadow: 0 2px 8px rgba(94, 60, 30, 0.1);
}
.lp-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
}
.lp-qr-box {
  position: relative;
  width: 220px;
  height: 220px;
  border-radius: 16px;
  border: 1px solid var(--border, #e5d8c0);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff;
}
.lp-qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.lp-qr-empty {
  font-size: 13px;
  color: var(--text-3, #998975);
  text-align: center;
  padding: 0 16px;
}
.lp-qr-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 252, 246, 0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--primary, #8c5a3c);
  line-height: 1.8;
  cursor: pointer;
}
.lp-qr-tip {
  font-size: 13px;
  color: var(--text-2, #6b5a48);
}
.lp-copy {
  position: absolute;
  bottom: 24px;
  font-size: 12px;
  color: var(--text-3, #b3a690);
}

/* 窄屏：隐藏左面板，仅卡片 */
@media (max-width: 860px) {
  .lp-left {
    display: none;
  }
  .lp-mobile-brand {
    display: flex;
  }
}
</style>
