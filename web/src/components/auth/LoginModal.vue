<template>
  <Teleport to="body">
    <Transition name="lm-fade">
      <div v-if="open" class="lm-mask" @click.self="onClose">
        <div class="lm-card theme-light">
          <!-- 左：轮播图 -->
          <aside class="lm-left">
            <div class="lm-slides">
              <div
                v-for="(s, i) in slides"
                :key="i"
                class="lm-slide"
                :class="{ on: i === cur }"
                :style="{ backgroundImage: `url(${s})` }"
              />
            </div>
            <div class="lm-left-grad" />
            <div class="lm-left-copy">
              <h3>{{ site.config.loginTitle || 'AI 袜版设计' }}</h3>
              <p>{{ site.config.loginSubtitle || '一根花线，脚尖生诗意' }}</p>
            </div>
            <div v-if="slides.length > 1" class="lm-dots">
              <span v-for="(s, i) in slides" :key="i" :class="{ on: i === cur }" @click="cur = i" />
            </div>
          </aside>

          <!-- 右：登录表单 -->
          <main class="lm-right">
            <button class="lm-close" @click="onClose"><AppIcon name="close" :size="18" color="var(--text-3)" /></button>

            <div class="lm-head">
              <h2>欢迎回来</h2>
              <p>{{ headingTip }}</p>
            </div>

            <template v-if="mode !== 'qr'">
              <div class="lm-tabs">
                <button :class="['lm-tab', { active: mode === 'sms' }]" @click="mode = 'sms'">验证码登录</button>
                <button :class="['lm-tab', { active: mode === 'password' }]" @click="mode = 'password'">密码登录</button>
              </div>

              <form class="lm-form" @submit.prevent="onLogin">
                <div class="lm-field">
                  <span class="lm-label">手机号</span>
                  <div class="lm-input" :class="{ focus: focused === 'phone' }">
                    <input v-model="phone" type="tel" inputmode="numeric" maxlength="11" placeholder="请输入手机号"
                      autocomplete="username" @focus="focused = 'phone'" @blur="focused = null" />
                  </div>
                </div>

                <div v-if="mode === 'sms'" class="lm-field">
                  <span class="lm-label">验证码</span>
                  <div class="lm-input" :class="{ focus: focused === 'code' }">
                    <input v-model="code" type="text" inputmode="numeric" maxlength="6" placeholder="请输入验证码"
                      autocomplete="one-time-code" @focus="focused = 'code'" @blur="focused = null" />
                    <button type="button" class="lm-code-btn" :disabled="counting > 0" @click="onSendCode">
                      {{ counting > 0 ? `${counting}s` : '获取验证码' }}
                    </button>
                  </div>
                </div>

                <div v-else class="lm-field">
                  <span class="lm-label">密码</span>
                  <div class="lm-input" :class="{ focus: focused === 'password' }">
                    <input v-model="password" type="password" maxlength="32" placeholder="请输入登录密码"
                      autocomplete="current-password" @focus="focused = 'password'" @blur="focused = null" />
                  </div>
                </div>

                <p class="lm-agreement">登录即代表同意 <span @click="openAgreement('user')">《用户协议》</span> 和 <span @click="openAgreement('privacy')">《隐私政策》</span></p>
                <button type="submit" class="lm-submit" :class="{ enabled: canSubmit && !loading }" :disabled="!canSubmit || loading">
                  {{ loading ? '登录中…' : '登录' }}
                </button>
              </form>

              <div class="lm-divider"><span>其他方式</span></div>
              <button class="lm-wechat" @click="switchToQr">
                <img :src="wechatIcon" alt="微信" class="lm-wechat-logo" />
                微信扫码登录
              </button>
            </template>

            <!-- 微信扫码 -->
            <div v-else class="lm-qr">
              <div class="lm-qr-box">
                <img v-if="qrImage" :src="qrImage" alt="微信扫码登录" class="lm-qr-img" />
                <div v-else class="lm-qr-empty">{{ qrError || '二维码生成中…' }}</div>
                <div v-if="qrStatus === 'scanned'" class="lm-qr-overlay">已扫码<br />请在手机上确认</div>
                <div v-else-if="qrStatus === 'expired'" class="lm-qr-overlay" @click="startQr">二维码已过期<br />点击刷新</div>
              </div>
              <p class="lm-qr-tip">打开微信扫一扫，在手机上确认登录</p>
              <button class="lm-back" @click="backToPhone">‹ 返回手机号登录</button>
            </div>
          </main>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { useUserStore, useSiteConfigStore } from '@/store'
import { useAuthModal } from '@/composables/useAuthModal'
import { useAgreement } from '@/composables/useAgreement'
import { LOGIN_SLIDES } from '@/data/loginSlides'
import AppIcon from '@/components/ui/AppIcon.vue'

const router = useRouter()
const userStore = useUserStore()
const site = useSiteConfigStore()
const { open, redirect, closeLogin } = useAuthModal()
const { openAgreement } = useAgreement()

const wechatIcon = import.meta.env.BASE_URL + 'wechat.png'

const mode = ref<'sms' | 'password' | 'qr'>('sms')
const phone = ref('')
const code = ref('')
const password = ref('')
const counting = ref(0)
const loading = ref(false)
const focused = ref<'phone' | 'code' | 'password' | null>(null)

const headingTip = computed(() => {
  if (mode.value === 'sms') return '输入手机号和验证码，开始你的袜款设计'
  if (mode.value === 'password') return '使用手机号和密码快捷登录'
  return '微信扫码，快速登录'
})

// ── 左侧轮播（本地 WebP，应用启动已预加载）──
const slides = ref<string[]>(LOGIN_SLIDES)
const cur = ref(0)
let carouselTimer: ReturnType<typeof setInterval> | null = null

function startCarousel() {
  stopCarousel()
  if (slides.value.length > 1) {
    carouselTimer = setInterval(() => { cur.value = (cur.value + 1) % slides.value.length }, 3500)
  }
}
function stopCarousel() { if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null } }

// 打开时重置并轮播；关闭时清理
watch(open, (v) => {
  if (v) {
    cur.value = 0
    startCarousel()
  } else {
    stopPoll(); stopCarousel()
    mode.value = 'sms'; code.value = ''; password.value = ''
  }
})

const canSubmit = computed(() => {
  if (!/^1\d{10}$/.test(phone.value)) return false
  return mode.value === 'password' ? password.value.length >= 6 : code.value.length >= 4
})

async function onSendCode() {
  if (counting.value > 0) return
  if (!/^1\d{10}$/.test(phone.value)) { alert('请输入正确的手机号'); return }
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
    if (mode.value === 'password') await userStore.loginByPassword(phone.value, password.value)
    else await userStore.loginBySms(phone.value, code.value)
    onSuccess()
  } catch (e) {
    alert((e as Error).message)
  } finally {
    loading.value = false
  }
}

function onSuccess() {
  const r = redirect.value
  closeLogin()
  if (r && r !== router.currentRoute.value.fullPath) router.push(r)
}
function onClose() { closeLogin() }

// ── 微信扫码登录 ──
const qrImage = ref('')
const qrError = ref('')
const qrStatus = ref<'pending' | 'scanned' | 'confirmed' | 'expired'>('pending')
let pollTimer: ReturnType<typeof setInterval> | null = null

function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null } }
function switchToQr() { mode.value = 'qr'; startQr() }
function backToPhone() { stopPoll(); mode.value = 'sms' }

async function startQr() {
  stopPoll()
  qrImage.value = ''
  qrError.value = ''
  qrStatus.value = 'pending'
  try {
    const res = await authApi.qrCreate()
    if (!res.data.qrImage) { qrError.value = '二维码暂不可用，请用手机号登录'; return }
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
      onSuccess()
    } else if (res.data.status === 'expired') {
      stopPoll()
    }
  } catch { /* 单次轮询失败忽略 */ }
}
</script>

<style scoped>
.lm-mask {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(20, 40, 32, 0.42);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.lm-card {
  display: flex;
  width: 760px; max-width: calc(100vw - 40px);
  background: #fff; border-radius: 20px;
  box-shadow: 0 24px 60px rgba(16, 78, 58, 0.24);
  overflow: hidden;
}

/* 左：轮播图 */
.lm-left {
  position: relative;
  width: 320px; flex-shrink: 0;
  background: linear-gradient(150deg, #2fb98f 0%, #149b78 55%, #0a7a5e 100%);
  overflow: hidden;
}
.lm-slides { position: absolute; inset: 0; }
.lm-slide {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  opacity: 0; transition: opacity 0.8s ease;
}
.lm-slide.on { opacity: 1; }
.lm-left-grad { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%); }
.lm-left-copy { position: absolute; left: 28px; right: 28px; bottom: 40px; color: #fff; z-index: 2; }
.lm-left-copy h3 { font-size: 22px; font-weight: 800; letter-spacing: 0.04em; }
.lm-left-copy p { margin-top: 8px; font-size: 13px; line-height: 1.7; color: rgba(255,255,255,0.88); }
.lm-dots { position: absolute; left: 28px; bottom: 24px; display: flex; gap: 6px; z-index: 3; }
.lm-dots span { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.45); cursor: pointer; transition: all 0.2s; }
.lm-dots span.on { width: 18px; border-radius: 4px; background: #fff; }

/* 右：表单 */
.lm-right { position: relative; flex: 1; min-width: 0; padding: 36px 36px 28px; }
.lm-close { position: absolute; top: 16px; right: 16px; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
.lm-close:hover { background: var(--bg-hover); }
.lm-head h2 { font-size: 22px; font-weight: 800; color: var(--text); }
.lm-head p { margin-top: 6px; font-size: 13px; color: var(--text-3); margin-bottom: 22px; }

.lm-tabs { display: flex; gap: 8px; background: var(--surface); border-radius: var(--r-12); padding: 4px; margin-bottom: 20px; }
.lm-tab { flex: 1; height: 36px; border-radius: var(--r-8); font-size: 14px; font-weight: 600; color: var(--text-3); transition: all 0.16s; }
.lm-tab.active { background: #fff; color: var(--primary); box-shadow: var(--shadow-sm); }

.lm-field { margin-bottom: 16px; }
.lm-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-2); margin-bottom: 8px; }
.lm-input { display: flex; align-items: center; gap: 8px; height: 48px; border: 1px solid var(--border-strong); border-radius: var(--r-12); padding: 0 14px; background: var(--surface); transition: border-color 0.18s, box-shadow 0.18s, background 0.18s; }
.lm-input.focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0, 164, 110, 0.14); background: #fff; }
.lm-input input { flex: 1; height: 100%; font-size: 14px; }
.lm-code-btn { white-space: nowrap; color: var(--primary); font-size: 13px; font-weight: 600; }
.lm-code-btn:disabled { color: var(--text-3); }
.lm-agreement { font-size: 12px; color: var(--text-3); margin: 4px 0 18px; }
.lm-agreement span { color: var(--primary); cursor: pointer; }
.lm-agreement span:hover { text-decoration: underline; }
.lm-submit { width: 100%; height: 48px; border-radius: var(--r-12); background: var(--bg-hover); color: var(--text-3); font-size: 16px; font-weight: 700; cursor: not-allowed; transition: all 0.18s; }
.lm-submit.enabled { background: linear-gradient(135deg, #00b97c, #00a46e); color: #fff; cursor: pointer; box-shadow: 0 8px 22px rgba(0, 164, 110, 0.32); }
.lm-tip { margin-top: 14px; text-align: center; font-size: 12px; color: var(--text-3); }

.lm-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0 16px; color: var(--text-3); font-size: 12px; }
.lm-divider::before, .lm-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.lm-wechat { width: 100%; height: 46px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: var(--r-12); border: 1px solid var(--border-strong); background: #fff; font-size: 14px; font-weight: 600; color: var(--text); transition: border-color 0.16s; }
.lm-wechat:hover { border-color: #09bb07; }
.lm-wechat-logo { width: 22px; height: 22px; object-fit: contain; }

.lm-qr { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 8px 0; }
.lm-qr-box { position: relative; width: 220px; height: 220px; border-radius: 16px; border: 1px solid var(--border-strong); display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; }
.lm-qr-img { width: 100%; height: 100%; object-fit: contain; }
.lm-qr-empty { font-size: 13px; color: var(--text-3); text-align: center; padding: 0 16px; }
.lm-qr-overlay { position: absolute; inset: 0; background: rgba(245, 250, 249, 0.94); display: flex; align-items: center; justify-content: center; text-align: center; font-size: 15px; font-weight: 700; color: var(--primary); line-height: 1.8; cursor: pointer; }
.lm-qr-tip { font-size: 13px; color: var(--text-2); }
.lm-back { font-size: 13px; color: var(--text-3); }
.lm-back:hover { color: var(--primary); }

.lm-fade-enter-active, .lm-fade-leave-active { transition: opacity 0.2s; }
.lm-fade-enter-from, .lm-fade-leave-to { opacity: 0; }
</style>
