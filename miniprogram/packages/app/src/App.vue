<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@aisock/composition'

onLaunch(() => {
  // 启动时若已有 token，静默刷新用户信息
  const userStore = useUserStore()
  if (userStore.isLogin) {
    userStore.refreshProfile().catch(() => {})
  }
})
</script>

<style lang="scss">
@import '@aisock/common/styles/variables.scss';

page {
  background: $mp-bg;
  color: $mp-text-primary;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
</style>
