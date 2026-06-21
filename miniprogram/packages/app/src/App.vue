<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@aisock/composition'
import { captureInviter } from '@/composables/useInvite'

onLaunch((options?: { query?: Record<string, string> }) => {
  // 冷启动捕获邀请人（来自分享链接 ?inviterId=xxx）
  captureInviter(options?.query)

  // 启动时若已有 token，静默刷新用户信息（失败不阻断）
  const userStore = useUserStore()
  if (userStore.isLogin) {
    userStore.refreshProfile().catch(() => {})
  }

  // 敦煌艺术字（ZCOOL KuaiLe）远程字体：仅当配置了可用字体 URL 时才加载。
  // 留空则直接走 $mp-font-art 的回退字体（Noto Serif SC / 系统衬线），避免无效请求在控制台报错。
  // 如需启用：把字体上传到你的 https 域名，填入下方 URL，并在小程序后台「下载合法域名」加入该域名。
  const BRAND_FONT_URL = ''
  if (BRAND_FONT_URL) {
    setTimeout(() => {
      try {
        ;(uni as any).loadFontFace?.({
          global: true,
          family: 'ZCOOL KuaiLe',
          source: `url("${BRAND_FONT_URL}")`,
          success: () => {},
          fail: () => {},
          complete: () => {},
        })
      } catch {
        /* 忽略：回退系统字体 */
      }
    }, 0)
  }
})

// 热启动（从分享卡片再次进入）也捕获邀请人
onShow((options?: { query?: Record<string, string> }) => {
  captureInviter(options?.query)
})
</script>

<style lang="scss">
@import '@aisock/common/styles/variables.scss';

page {
  background: $mp-bg;
  color: $mp-text-primary;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 去除小程序原生 <button> 的默认 ::after 边框：圆角(pill)按钮上它不贴合，显示为模糊边线。
   只去掉这层默认边框，不影响各按钮用 CSS 自绘的 border（微信登录/取消等）。 */
button::after {
  border: none;
}

/* 隐藏竖向滚动条（页面级 / scroll-view），保留滚动能力 */
::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  display: none !important;
  -webkit-appearance: none !important;
}
page::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

/* 敦煌风格艺术字工具类（品牌/标题/banner 用） */
.mp-art-font {
  font-family: $mp-font-art;
}
</style>
