<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@aisock/composition'

onLaunch(() => {
  // 启动时若已有 token，静默刷新用户信息（失败不阻断）
  const userStore = useUserStore()
  if (userStore.isLogin) {
    userStore.refreshProfile().catch(() => {})
  }

  // 延迟加载敦煌艺术字（ZCOOL KuaiLe）：放到下一帧、完全 fire-and-forget，
  // 字体域名未配置 / 加载失败时回退系统字体，绝不阻断启动。
  setTimeout(() => {
    try {
      ;(uni as any).loadFontFace?.({
        global: true,
        family: 'ZCOOL KuaiLe',
        source: 'url("https://cdn.onnsa.cn/fonts/ZCOOLKuaiLe-Regular.woff2")',
        success: () => {},
        fail: () => {},
        complete: () => {},
      })
    } catch {
      /* 忽略：回退系统字体 */
    }
  }, 0)
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
