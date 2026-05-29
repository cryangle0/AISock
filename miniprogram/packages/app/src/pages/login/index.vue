<template>
  <view class="login">
    <view class="hero">
      <view class="logo">爱</view>
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
        登录即代表同意 <text class="link">《用户协议》</text> 和 <text class="link">《隐私政策》</text>
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
import { authApi } from '@aisock/service'
import { useUserStore } from '@aisock/composition'
import { STORAGE_KEYS } from '@aisock/common/constants'

const userStore = useUserStore()
const phone = ref('')
const code = ref('')
const counting = ref(0)

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

async function onWechat() {
  // 真机：uni.login 拿 code → 后端 code2session 换 openid
  uni.login({
    provider: 'weixin',
    success: async (res) => {
      try {
        await userStore.loginByWechatCode(res.code)
        goBackOrHome()
      } catch {
        /* 拦截器已提示 */
      }
    },
    fail: async () => {
      // 取不到 code（如 H5 调试）时兜底
      await userStore.loginByWechat(`wx_${Date.now()}`)
      goBackOrHome()
    },
  })
}

function goBackOrHome() {
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
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48rpx;
}
.logo {
  width: 110rpx;
  height: 110rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #a06d36, #8c5a3c);
  color: #fff;
  font-size: 52rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
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
