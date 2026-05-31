<template>
  <view class="login">
    <!-- PC 扫码登录确认浮层 -->
    <view v-if="qrScene" class="qr-confirm-mask">
      <view class="qr-confirm-card">
        <image class="qr-logo" src="/static/logo.png" mode="aspectFit" />
        <text class="qr-title">网页登录确认</text>
        <text class="qr-desc">是否授权登录「爱花型」电脑网页版？</text>
        <button class="qr-btn primary" :disabled="qrLoading" @tap="onQrConfirm">{{ qrLoading ? '处理中…' : '确认登录' }}</button>
        <button class="qr-btn ghost" :disabled="qrLoading" @tap="onQrCancel">取消</button>
      </view>
    </view>

    <view class="hero">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="brand">爱花型</text>
      <text class="slogan">创意由你，花型随心</text>
    </view>

    <view class="card">
      <view class="tabs"><text class="tab active">手机号登录</text></view>
      <view class="field">
        <text class="field-icon">📱</text>
        <input v-model="phone" type="number" placeholder="请输入手机号" maxlength="11" />
      </view>
      <view class="field">
        <text class="field-icon">🔑</text>
        <input v-model="code" type="number" placeholder="请输入验证码" maxlength="6" />
        <text class="code-btn" :class="{ disabled: counting > 0 }" @tap="onSendCode">
          {{ counting > 0 ? `${counting}s` : '获取验证码' }}
        </text>
      </view>

      <text class="agreement">
        登录即代表同意 <text class="link" @tap="openAgreement('user')">《用户协议》</text> 和 <text class="link" @tap="openAgreement('privacy')">《隐私政策》</text>
      </text>

      <button class="submit" :class="{ active: canSubmit }" :disabled="!canSubmit" @tap="onLogin">登录</button>

      <view class="divider"><text>或</text></view>
      <button class="wechat" @tap="onWechat">
        <text class="wechat-icon">💬</text> 微信登录
      </button>
    </view>

    <text class="footer">爱花型袜业 · 2026</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { authApi } from '@aisock/service'
import { useUserStore } from '@aisock/composition'
import { STORAGE_KEYS } from '@aisock/common/constants'

const userStore = useUserStore()
const phone = ref('')
const code = ref('')
const counting = ref(0)

// PC 扫码登录：扫码打开时带 scene 参数
const qrScene = ref('')
const qrLoading = ref(false)

onLoad((q?: Record<string, string>) => {
  // 小程序码场景值在 q.scene（URL 编码），普通带参用 q.sceneId
  const scene = q?.scene ? decodeURIComponent(q.scene) : (q?.sceneId || '')
  if (scene) {
    qrScene.value = scene
    // 标记已扫码（未登录也先记录，登录后再确认）
    if (userStore.isLogin) authApi.qrScanned(scene).catch(() => {})
  }
})

async function onQrConfirm() {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录小程序', icon: 'none' })
    return
  }
  qrLoading.value = true
  try {
    await authApi.qrConfirm(qrScene.value)
    uni.showToast({ title: '已确认，请在电脑端查看', icon: 'success' })
    qrScene.value = ''
    setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 1200)
  } catch {
    /* 拦截器已提示（二维码失效等） */
  } finally {
    qrLoading.value = false
  }
}

function onQrCancel() {
  qrScene.value = ''
}

const canSubmit = computed(() => /^1\d{10}$/.test(phone.value) && code.value.length >= 4)

async function onSendCode() {
  if (counting.value > 0) return
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    return
  }
  await authApi.smsSend(phone.value)
  uni.showToast({ title: '验证码已发送', icon: 'none' })
  counting.value = 60
  const timer = setInterval(() => {
    counting.value -= 1
    if (counting.value <= 0) clearInterval(timer)
  }, 1000)
}

async function onLogin() {
  if (!canSubmit.value) return
  await userStore.loginBySms(phone.value, code.value)
  goBackOrHome()
}

function uniLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => (res.code ? resolve(res.code) : reject(new Error('no code'))),
      fail: () => reject(new Error('login fail')),
    })
  })
}

// 微信登录（纯 openid）：uni.login 拿 code → 后端 code2session 换 openid（手机号走短信登录）
async function onWechat() {
  try {
    const loginCode = await uniLogin()
    await userStore.loginByWechatCode(loginCode)
    goBackOrHome()
  } catch {
    // 真机理论上不会取不到 code；仅 H5/非微信环境兜底，提示改用手机号登录
    uni.showToast({ title: '请使用手机号登录', icon: 'none' })
  }
}

const AGREEMENTS = {
  user: {
    title: '用户协议',
    content: '欢迎使用爱花型 AI 袜版定制服务。使用本服务即表示您同意：合法合规使用平台进行袜款设计与下单；尊重原创，不上传侵权素材；订单一经支付进入生产将不可随意取消。完整条款以正式发布版本为准。',
  },
  privacy: {
    title: '隐私政策',
    content: '我们仅收集为提供服务所必需的信息（手机号/微信标识、设计与订单数据），用于登录、下单、配送与售后。我们不会向无关第三方出售您的个人信息。您可随时联系客服注销账号。完整政策以正式发布版本为准。',
  },
} as const

function openAgreement(key: 'user' | 'privacy') {
  const a = AGREEMENTS[key]
  uni.showModal({ title: a.title, content: a.content, showCancel: false, confirmText: '我已知晓' })
}

function goBackOrHome() {
  // 扫码场景：登录后不跳转，停留确认浮层让用户点「确认登录」
  if (qrScene.value) {
    uni.showToast({ title: '登录成功，请确认网页登录', icon: 'none' })
    authApi.qrScanned(qrScene.value).catch(() => {})
    return
  }
  uni.showToast({ title: '登录成功', icon: 'success' })
  const returnTo = uni.getStorageSync(STORAGE_KEYS.LOGIN_RETURN_TO)
  uni.removeStorageSync(STORAGE_KEYS.LOGIN_RETURN_TO)
  setTimeout(() => {
    if (returnTo) uni.reLaunch({ url: returnTo, fail: () => uni.switchTab({ url: '/pages/home/index' }) })
    else uni.switchTab({ url: '/pages/home/index' })
  }, 600)
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.login {
  min-height: 100vh;
  padding: 120rpx 48rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.qr-confirm-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(43, 31, 20, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.qr-confirm-card {
  width: 560rpx;
  background: $mp-bg-card;
  border-radius: 28rpx;
  padding: 48rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.qr-logo {
  width: 96rpx;
  height: 96rpx;
  border-radius: 22rpx;
}
.qr-title {
  font-size: 32rpx;
  font-weight: 800;
  color: $mp-text-primary;
}
.qr-desc {
  font-size: 24rpx;
  color: $mp-text-secondary;
  text-align: center;
  margin-bottom: 12rpx;
}
.qr-btn {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  padding: 0;
}
.qr-btn.primary {
  background: $mp-primary;
  color: #fff;
}
.qr-btn.ghost {
  background: $mp-bg;
  color: $mp-text-secondary;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48rpx;
}
.logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 28rpx;
  background: #fffcf6;
  padding: 10rpx;
  box-sizing: border-box;
  box-shadow: 0 8rpx 24rpx rgba(94, 60, 30, 0.16);
}
.brand {
  margin-top: 20rpx;
  font-size: 40rpx;
  font-weight: 800;
  color: $mp-text-primary;
}
.slogan {
  font-size: 24rpx;
  color: $mp-text-muted;
}
.card {
  width: 100%;
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 28rpx;
  padding: 36rpx 36rpx 40rpx;
  box-shadow: 0 12rpx 36rpx rgba(94, 60, 30, 0.1);
}
.tabs {
  margin-bottom: 24rpx;
}
.tab.active {
  font-size: 30rpx;
  font-weight: 700;
  color: $mp-text-primary;
}
.field {
  display: flex;
  align-items: center;
  gap: 12rpx;
  border: 1rpx solid $mp-border;
  border-radius: 16rpx;
  padding: 0 20rpx;
  margin-bottom: 20rpx;
}
.field input {
  flex: 1;
  height: 84rpx;
  font-size: 28rpx;
}
.field-icon {
  font-size: 30rpx;
}
.code-btn {
  font-size: 24rpx;
  color: $mp-primary;
  white-space: nowrap;
}
.code-btn.disabled {
  color: $mp-text-muted;
}
.agreement {
  display: block;
  text-align: center;
  font-size: 20rpx;
  color: $mp-text-muted;
  margin: 8rpx 0 20rpx;
}
.link {
  color: $mp-primary;
}
.submit {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  background: $mp-bg;
  color: $mp-text-muted;
  font-size: 30rpx;
  border: none;
}
.submit.active {
  background: $mp-primary;
  color: #fff;
}
.divider {
  text-align: center;
  margin: 24rpx 0;
  font-size: 22rpx;
  color: $mp-text-muted;
}
.wechat {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  border: 1rpx solid $mp-border;
  border-radius: 16rpx;
  background: $mp-bg-card;
  font-size: 28rpx;
  color: $mp-text-secondary;
}
.wechat-icon {
  color: #07c160;
}
.footer {
  margin-top: auto;
  padding-top: 40rpx;
  font-size: 20rpx;
  color: $mp-text-muted;
}
</style>
