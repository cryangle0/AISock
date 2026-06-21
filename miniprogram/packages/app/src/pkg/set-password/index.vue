<template>
  <view class="sp">
    <NavBar title="登录密码" show-back variant="solid" />
    <scroll-view class="sp-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
      <view class="sp-body">
        <!-- 头部徽章 -->
        <view class="sp-hero">
          <view class="sp-badge"><AppIcon name="shield" :size="52" color="#ffffff" /></view>
          <text class="sp-sub">{{ hasPassword ? '修改后可用「手机号 + 新密码」登录' : '设置后可用「手机号 + 密码」快捷登录' }}</text>
        </view>

        <view class="card">
          <view v-if="hasPassword" class="field">
            <AppIcon name="lock" :size="34" color="#8e4f43" />
            <input v-model="oldPassword" :password="!showPwd" placeholder="请输入原密码" maxlength="32" />
          </view>
          <view class="field">
            <AppIcon name="lock" :size="34" color="#8e4f43" />
            <input v-model="newPassword" :password="!showPwd" placeholder="请输入新密码" maxlength="32" />
            <text class="toggle" @tap="showPwd = !showPwd">{{ showPwd ? '隐藏' : '显示' }}</text>
          </view>
          <view class="field">
            <AppIcon name="lock" :size="34" color="#8e4f43" />
            <input v-model="confirmPassword" :password="!showPwd" placeholder="请再次输入新密码" maxlength="32" />
          </view>

          <!-- 密码规则实时校验 -->
          <view class="rules">
            <view class="rule" :class="{ ok: ruleLen }">
              <view class="rule-dot"><AppIcon v-if="ruleLen" name="check" :size="16" color="#ffffff" /></view>
              <text class="rule-text">6-32 位</text>
            </view>
            <view class="rule" :class="{ ok: ruleAlpha }">
              <view class="rule-dot"><AppIcon v-if="ruleAlpha" name="check" :size="16" color="#ffffff" /></view>
              <text class="rule-text">含字母</text>
            </view>
            <view class="rule" :class="{ ok: ruleDigit }">
              <view class="rule-dot"><AppIcon v-if="ruleDigit" name="check" :size="16" color="#ffffff" /></view>
              <text class="rule-text">含数字</text>
            </view>
            <view class="rule" :class="{ ok: ruleMatch }">
              <view class="rule-dot"><AppIcon v-if="ruleMatch" name="check" :size="16" color="#ffffff" /></view>
              <text class="rule-text">两次一致</text>
            </view>
          </view>

          <button class="submit" :class="{ active: canSubmit }" :disabled="!canSubmit || submitting" @tap="onSubmit">
            {{ submitting ? '提交中…' : '保存' }}
          </button>
        </view>

        <text class="sp-foot">密码仅用于登录验证，我们不会明文存储</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { userApi } from '@aisock/service'
import { useUserStore } from '@aisock/composition'
import { navigateBack } from '@aisock/common/utils'
import NavBar from '@/components/ui/NavBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const userStore = useUserStore()
const hasPassword = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const showPwd = ref(false)

onLoad(() => {
  hasPassword.value = !!userStore.userInfo?.hasPassword
})

// 密码规则：逐项实时校验，给用户清晰反馈
const ruleLen = computed(() => newPassword.value.length >= 6 && newPassword.value.length <= 32)
const ruleAlpha = computed(() => /[a-zA-Z]/.test(newPassword.value))
const ruleDigit = computed(() => /\d/.test(newPassword.value))
const ruleMatch = computed(() => !!confirmPassword.value && newPassword.value === confirmPassword.value)

const canSubmit = computed(() => {
  if (!(ruleLen.value && ruleAlpha.value && ruleDigit.value && ruleMatch.value)) return false
  if (hasPassword.value && !oldPassword.value) return false
  return true
})

async function onSubmit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    await userApi.setPassword(newPassword.value, hasPassword.value ? oldPassword.value : undefined)
    // 同步本地标记，「我的」页即时显示「已设置」
    if (userStore.userInfo) userStore.userInfo.hasPassword = true
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => navigateBack(), 800)
  } catch {
    /* 拦截器已提示（原密码错误 / 强度不足等） */
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.sp {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $mp-bg;
}
.sp-scroll {
  flex: 1;
  min-height: 0;
}
.sp-body {
  box-sizing: border-box;
  padding: 16rpx 48rpx calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 头部徽章 */
.sp-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 24rpx 0 36rpx;
}
.sp-badge {
  width: 132rpx;
  height: 132rpx;
  border-radius: 50%;
  background: linear-gradient(160deg, #c98a6e 0%, #8e4f43 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 28rpx rgba(94, 60, 30, 0.32);
}
.sp-title {
  margin-top: 22rpx;
  font-size: 38rpx;
  font-weight: 800;
  color: $mp-text-primary;
  letter-spacing: 0.04em;
  font-family: $mp-font-serif;
}
.sp-sub {
  margin-top: 18rpx;
  font-size: 24rpx;
  color: $mp-text-secondary;
}

/* 卡片 */
.card {
  width: 100%;
  background: $mp-bg-card;
  border-radius: 32rpx;
  padding: 40rpx 36rpx 44rpx;
  box-shadow: $mp-shadow-md;
}
.field {
  display: flex;
  align-items: center;
  gap: 14rpx;
  background: $mp-bg;
  border: 1rpx solid $mp-border;
  border-radius: 16rpx;
  padding: 0 24rpx;
  margin-bottom: 20rpx;
}
.field input {
  flex: 1;
  height: 88rpx;
  font-size: 28rpx;
  background: transparent;
}
.toggle {
  font-size: 24rpx;
  color: $mp-primary;
  font-weight: 600;
  white-space: nowrap;
  padding-left: 8rpx;
}

/* 规则清单 */
.rules {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx 28rpx;
  margin: 8rpx 4rpx 28rpx;
}
.rule {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.rule-dot {
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  background: $mp-bg;
  border: 1rpx solid $mp-border;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.rule.ok .rule-dot {
  background: $mp-primary;
  border-color: $mp-primary;
}
.rule-text {
  font-size: 22rpx;
  color: $mp-text-muted;
}
.rule.ok .rule-text {
  color: $mp-primary;
  font-weight: 600;
}

/* 提交按钮（与登录页一致的胶囊主按钮） */
.submit {
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 999rpx;
  background: $mp-bg-soft;
  color: $mp-text-muted;
  font-size: 30rpx;
  font-weight: 600;
  font-family: $mp-font-serif;
  border: none;
}
.submit.active {
  background: $mp-primary;
  color: #fff;
  box-shadow: 0 10rpx 22rpx rgba(142, 79, 67, 0.28);
}

.sp-foot {
  margin-top: 28rpx;
  font-size: 20rpx;
  color: $mp-text-muted;
}
</style>
