<template>
  <div class="page-container">
    <div class="page-toolbar">
      <div>
        <h2>站点配置</h2>
        <p class="sub">配置 Web 站点 / 登录页的 logo、标题、品牌名、版权等，保存后约 1 分钟内生效。</p>
      </div>
      <a-space>
        <a-button @click="fetchConfig">
          <template #icon><icon-refresh /></template>刷新
        </a-button>
        <a-button type="primary" :loading="saving" @click="onSave">
          <template #icon><icon-save /></template>保存配置
        </a-button>
      </a-space>
    </div>

    <a-spin :loading="loading" style="width: 100%">
      <a-row :gutter="24">
        <a-col :xs="24" :md="14">
          <a-form :model="form" layout="vertical">
            <a-divider orientation="left">基础信息</a-divider>
            <a-form-item label="站点标题（浏览器标签 / SEO）">
              <a-input v-model="form.siteTitle" :placeholder="def.siteTitle" allow-clear />
            </a-form-item>
            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="品牌中文名">
                  <a-input v-model="form.brandName" :placeholder="def.brandName" allow-clear />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="品牌英文副标题">
                  <a-input v-model="form.brandEn" :placeholder="def.brandEn" allow-clear />
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider orientation="left">图标</a-divider>
            <a-form-item label="Logo 图片 URL（留空用内置 logo）">
              <a-input v-model="form.logoUrl" placeholder="https://cdn.onnsa.cn/xxx/logo.png" allow-clear />
            </a-form-item>
            <a-form-item label="Favicon 图片 URL（留空用 Logo / 内置）">
              <a-input v-model="form.faviconUrl" placeholder="https://cdn.onnsa.cn/xxx/favicon.png" allow-clear />
            </a-form-item>

            <a-divider orientation="left">登录页</a-divider>
            <a-form-item label="登录页主标题">
              <a-input v-model="form.loginTitle" :placeholder="def.loginTitle" allow-clear />
            </a-form-item>
            <a-form-item label="登录页副标题">
              <a-textarea v-model="form.loginSubtitle" :placeholder="def.loginSubtitle" :auto-size="{ minRows: 2, maxRows: 3 }" allow-clear />
            </a-form-item>

            <a-divider orientation="left">页脚</a-divider>
            <a-form-item label="版权信息">
              <a-input v-model="form.copyright" :placeholder="def.copyright" allow-clear />
            </a-form-item>
          </a-form>
        </a-col>

        <!-- 实时预览 -->
        <a-col :xs="24" :md="10">
          <div class="preview-card">
            <div class="preview-title">顶栏预览</div>
            <div class="preview-nav">
              <img class="preview-logo" :src="logoSrc" alt="logo" @error="onLogoError" />
              <div class="preview-brand">
                <span class="pb-cn">{{ form.brandName || def.brandName }}</span>
                <span class="pb-en">{{ form.brandEn || def.brandEn }}</span>
              </div>
            </div>
            <div class="preview-title">浏览器标签</div>
            <div class="preview-tab">
              <img class="preview-favicon" :src="faviconSrc" alt="favicon" @error="onFaviconError" />
              <span>{{ form.siteTitle || def.siteTitle }}</span>
            </div>
            <div class="preview-title">登录页</div>
            <div class="preview-login">
              <div class="pl-title">{{ form.loginTitle || def.loginTitle }}</div>
              <div class="pl-sub">{{ form.loginSubtitle || def.loginSubtitle }}</div>
              <div class="pl-copy">{{ form.copyright || def.copyright }}</div>
            </div>
          </div>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { getSiteConfig, saveSiteConfig, type SiteConfig } from '@/api/site-config'

const FALLBACK_LOGO = '/logo.png'
const loading = ref(false)
const saving = ref(false)
const logoBroken = ref(false)
const faviconBroken = ref(false)

const def = ref<SiteConfig>({
  siteTitle: '', brandName: '', brandEn: '', logoUrl: '', faviconUrl: '',
  loginTitle: '', loginSubtitle: '', copyright: '',
})

const form = reactive<SiteConfig>({
  siteTitle: '', brandName: '', brandEn: '', logoUrl: '', faviconUrl: '',
  loginTitle: '', loginSubtitle: '', copyright: '',
})

const logoSrc = computed(() => (logoBroken.value ? FALLBACK_LOGO : form.logoUrl || FALLBACK_LOGO))
const faviconSrc = computed(() => (faviconBroken.value ? FALLBACK_LOGO : form.faviconUrl || form.logoUrl || FALLBACK_LOGO))

function onLogoError() { logoBroken.value = true }
function onFaviconError() { faviconBroken.value = true }

async function fetchConfig() {
  loading.value = true
  logoBroken.value = false
  faviconBroken.value = false
  try {
    const { data } = await getSiteConfig()
    def.value = data.builtinDefault
    Object.assign(form, data.config)
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    await saveSiteConfig({ ...form })
    Message.success('已保存，约 1 分钟内生效')
  } finally {
    saving.value = false
  }
}

onMounted(fetchConfig)
</script>

<style scoped lang="less">
.sub {
  color: var(--color-text-3);
  font-size: 12px;
  margin: 4px 0 0;
}
.preview-card {
  background: var(--color-fill-1);
  border-radius: 12px;
  padding: 16px;
  position: sticky;
  top: 16px;
}
.preview-title {
  font-size: 12px;
  color: var(--color-text-3);
  margin: 16px 0 8px;
}
.preview-title:first-child {
  margin-top: 0;
}
.preview-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-bg-2);
  border-radius: 8px;
  padding: 10px 14px;
}
.preview-logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: contain;
  background: #fff;
}
.preview-brand {
  display: flex;
  flex-direction: column;
}
.pb-cn {
  font-weight: 700;
  font-size: 14px;
}
.pb-en {
  font-size: 11px;
  color: var(--color-text-3);
  letter-spacing: 1px;
}
.preview-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-2);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
}
.preview-favicon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.preview-login {
  background: var(--color-bg-2);
  border-radius: 8px;
  padding: 16px;
}
.pl-title {
  font-size: 16px;
  font-weight: 700;
}
.pl-sub {
  font-size: 12px;
  color: var(--color-text-3);
  margin: 6px 0 12px;
}
.pl-copy {
  font-size: 11px;
  color: var(--color-text-4);
}
</style>
