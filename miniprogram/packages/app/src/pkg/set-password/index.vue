<template>
  <view class="sp">
    <NavBar title="登录密码" show-back variant="solid" />
    <scroll-view class="sp-scroll" scroll-y :enhanced="true" :show-scrollbar="false">
    <view class="tip">
      {{ hasPassword ? '修改后可用「手机号 + 新密码」登录' : '设置后可用「手机号 + 密码」快捷登录' }}
    </view>

    <view class="card">
      <view v-if="hasPassword" class="field">
        <text class="field-icon">🔑</text>
        <input v-model="oldPassword" :password="true" placeholder="请输入原密码" maxlength="32" />
      </view>
      <view class="field">
        <text class="field-icon">🔒</text>
        <input v-model="newPassword" :password="true" placeholder="新密码（6-32 位，含字母和数字）" maxlength="32" />
      </view>
      <view class="field">
        <text class="field-icon">🔒</text>
        <input v-model="confirmPassword" :password="true" placeholder="确认新密码" maxlength="32" />
      </view>

      <button class="submit" :class="{ active: canSubmit }" :disabled="!canSubmit || submitting" @tap="onSubmit">
        {{ submitting ? '提交中…' : '保存' }}
      </button>
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

const userStore = useUserStore()
const hasPassword = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

onLoad(() => {
  hasPassword.value = !!userStore.userInfo?.hasPassword
})

const strongEnough = computed(
  () => newPassword.value.length >= 6 && /[a-zA-Z]/.test(newPassword.value) && /\d/.test(newPassword.value),
)
const canSubmit = computed(() => {
  if (!strongEnough.value || newPassword.value !== confirmPassword.value) return false
  if (hasPassword.value && !oldPassword.value) return false
  return true
})

async function onSubmit() {
  if (!canSubmit.value || submitting.value) return
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' })
    return
  }
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
}
.sp-scroll {
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  padding: 40rpx 48rpx;
}
.tip {
  font-size: 24rpx;
  color: $mp-text-secondary;
  margin-bottom: 28rpx;
}
.card {
  background: $mp-bg-card;
  border: 1rpx solid $mp-border;
  border-radius: 24rpx;
  padding: 36rpx;
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
.submit {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  background: $mp-bg;
  color: $mp-text-muted;
  font-size: 30rpx;
  border: none;
  margin-top: 8rpx;
}
.submit.active {
  background: $mp-primary;
  color: #fff;
}
</style>
