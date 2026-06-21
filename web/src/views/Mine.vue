<template>
  <div class="mine">
    <div class="mine-grid">
      <!-- 左栏：用户 + 统计 + 账号安全 -->
      <aside class="mine-side">
        <div class="user-card">
          <div class="avatar">
            <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" alt="" />
            <span v-else>{{ avatarText }}</span>
          </div>
          <div class="info">
            <div class="name">{{ userStore.userInfo?.nickname || '用户' }}</div>
            <div class="phone">{{ userStore.userInfo?.phone || '-' }}</div>
          </div>
          <button class="btn-ghost" @click="onLogout">退出登录</button>
        </div>

        <div class="stats">
          <div class="stat-tile">
            <span class="st-num num">{{ overview.designs }}</span>
            <span class="st-label">我的设计</span>
          </div>
          <div class="stat-tile">
            <span class="st-num num">{{ orderTotal }}</span>
            <span class="st-label">我的订单</span>
          </div>
        </div>

        <div class="block">
          <h3 class="block-title">账号安全</h3>
          <div class="acc-row">
            <div class="acc-text">
              <span class="acc-name">登录密码</span>
              <span class="acc-desc">{{ userStore.userInfo?.hasPassword ? '已设置，可用手机号 + 密码登录' : '未设置，设置后可用密码快捷登录' }}</span>
            </div>
            <button class="btn-ghost" @click="openPassword">{{ userStore.userInfo?.hasPassword ? '修改密码' : '设置密码' }}</button>
          </div>
        </div>
      </aside>

      <!-- 右栏：我的设计 -->
      <section class="block designs-block">
        <h3 class="block-title">我的设计</h3>
        <div v-if="loading" class="design-grid">
          <div v-for="n in 8" :key="'sk' + n" class="design-skel" />
        </div>
        <div v-else-if="designs.length === 0" class="empty">还没有保存的设计，去「AI 设计」创作一双吧</div>
        <div v-else class="design-grid">
          <div v-for="d in designs" :key="d.id" class="design-item" @click="editDesign(d.id)">
            <div class="cover">
              <img v-if="d.cover_url" :src="d.cover_url" :alt="d.name" class="cover-img" />
              <AppIcon v-else name="image" :size="28" color="var(--text-3)" />
            </div>
            <div class="d-name">{{ d.name }}</div>
            <button class="d-edit" @click.stop="editDesign(d.id)">继续编辑</button>
          </div>
        </div>
      </section>
    </div>

    <PasswordModal
      v-if="passwordOpen"
      :has-password="userStore.userInfo?.hasPassword"
      @close="passwordOpen = false"
      @success="onPasswordSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { userApi, designApi, type Design } from '@/api'
import PasswordModal from '@/components/user/PasswordModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const router = useRouter()
const userStore = useUserStore()
const overview = reactive<{ designs: number; orders: Record<string, number> }>({ designs: 0, orders: {} })
const designs = ref<Design[]>([])
const loading = ref(true)
const passwordOpen = ref(false)

const avatarText = computed(() => (userStore.userInfo?.nickname || '客').charAt(0))
const orderTotal = computed(() => overview.orders.total ?? 0)

onMounted(async () => {
  try {
    await userStore.refreshProfile()
    const [ov, ds] = await Promise.all([userApi.overview(), designApi.list()])
    overview.designs = ov.data.designs
    overview.orders = ov.data.orders
    designs.value = ds.data
  } catch {
    /* 忽略 */
  } finally {
    loading.value = false
  }
})

async function onLogout() {
  await userStore.logout()
  router.push({ name: 'Home' })
}
function openPassword() { passwordOpen.value = true }
async function onPasswordSuccess() {
  passwordOpen.value = false
  try { await userStore.refreshProfile() } catch { /* 忽略 */ }
}
function editDesign(id: number) {
  router.push({ name: 'Editor', query: { design: id } })
}
</script>

<style scoped>
.mine { flex: 1; min-height: 0; overflow-y: auto; padding: 24px; }
.mine-grid { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
.mine-side { display: flex; flex-direction: column; gap: 12px; }

.user-card {
  display: flex; align-items: center; gap: 16px;
  background: var(--bg-card); border-radius: var(--r-card); box-shadow: var(--shadow-card); padding: 20px;
}
.avatar {
  width: 56px; height: 56px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  background: var(--primary); color: #fff; font-size: 24px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.info { flex: 1; min-width: 0; }
.name { font-size: 18px; font-weight: 700; color: var(--text); }
.phone { margin-top: 4px; font-size: 13px; color: var(--text-3); }

.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.stat-tile {
  background: var(--bg-card); border-radius: var(--r-card); box-shadow: var(--shadow-card);
  padding: 18px; display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.st-num { font-size: 24px; font-weight: 800; color: var(--primary); }
.st-label { font-size: 13px; color: var(--text-3); }

.block { background: var(--bg-card); border-radius: var(--r-card); box-shadow: var(--shadow-card); padding: 20px; }
.block-title { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 14px; }
.acc-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.acc-text { display: flex; flex-direction: column; gap: 4px; }
.acc-name { font-size: 14px; font-weight: 600; color: var(--text); }
.acc-desc { font-size: 12px; color: var(--text-3); }
.empty { color: var(--text-3); font-size: 14px; padding: 40px 0; text-align: center; }

.designs-block { min-height: 200px; }
.design-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
.design-item {
  border: 1px solid var(--border); border-radius: var(--r-12); overflow: hidden;
  cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
}
.design-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.cover { height: 120px; background: var(--surface); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.cover-img { width: 100%; height: 100%; object-fit: cover; }
.d-name { padding: 8px; font-size: 13px; font-weight: 600; color: var(--text); text-align: center; }
.d-edit { width: 100%; border-top: 1px solid var(--border); color: var(--primary); font-size: 12px; padding: 7px 0; }
.d-edit:hover { background: var(--surface); }

/* 骨架屏 */
.design-skel {
  height: 175px; border-radius: var(--r-12);
  background: linear-gradient(100deg, var(--surface) 30%, var(--bg-hover) 50%, var(--surface) 70%);
  background-size: 280% 100%; animation: mine-sh 1.3s linear infinite;
}
@keyframes mine-sh { 0% { background-position: 180% 0; } 100% { background-position: -80% 0; } }
</style>
