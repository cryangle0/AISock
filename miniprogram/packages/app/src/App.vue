<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@aisock/composition'

onLaunch(() => {
  // 全局加载敦煌风格艺术字（ZCOOL KuaiLe），失败则回退系统字体，不阻断
  try {
    ;(uni as any).loadFontFace?.({
      global: true,
      family: 'ZCOOL KuaiLe',
      source: 'url("https://cdn.onnsa.cn/fonts/ZCOOLKuaiLe-Regular.woff2")',
      success: () => {},
      fail: () => {},
    })
  } catch {
    /* 忽略：回退系统字体 */
  }

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

/* 敦煌风格艺术字工具类（品牌/标题/banner 用） */
.mp-art-font {
  font-family: $mp-font-art;
}
</style>
