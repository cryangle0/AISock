<template>
  <div class="mine">
    <div class="user card">
      <div class="avatar">{{ avatarText }}</div>
      <div class="info">
        <div class="name">{{ userStore.userInfo?.nickname || '用户' }}</div>
        <div class="phone">{{ userStore.userInfo?.phone || '-' }}</div>
      </div>
      <button class="btn-ghost" @click="onLogout">退出登录</button>
    </div>

    <div class="stats card">
      <div class="stat">
        <span class="num">{{ overview.designs }}</span>
        <span class="label">我的设计</span>
      </div>
      <span class="sep" />
      <div class="stat">
        <span class="num">{{ orderTotal }}</span>
        <span class="label">我的订单</span>
      </div>
    </div>

    <div class="account card">
      <h3 class="title">账号安全</h3>
      <div class="acc-row">
        <div class="acc-text">
          <span class="acc-name">登录密码</span>
          <span class="acc-desc">{{ userStore.userInfo?.hasPassword ? '已设置，可用手机号 + 密码登录' : '未设置，设置后可用密码快捷登录' }}</span>
        </div>
        <button class="btn-ghost" @click="openPassword">{{ userStore.userInfo?.hasPassword ? '修改密码' : '设置密码' }}</button>
      </div>
    </div>

    <div class="designs card">
      <h3 class="title">我的设计</h3>
      <div v-if="designs.length === 0" class="empty">还没有保存的设计</div>
      <div v-else class="design-grid">
        <div v-for="d in designs" :key="d.id" class="design-item" @click="editDesign(d.id)">
          <div class="cover">
            <img v-if="d.cover_url" :src="d.cover_url" :alt="d.name" class="cover-img" />
            <span v-else class="cover-empty">🧦</span>
          </div>
          <div class="d-name">{{ d.name }}</div>
          <button class="d-edit" @click.stop="editDesign(d.id)">继续编辑</button>
        </div>
      </div>
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

const router = useRouter()
const userStore = useUserStore()
const overview = reactive<{ designs: number; orders: Record<string, number> }>({ designs: 0, orders: {} })
const designs = ref<Design[]>([])
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
  }
})

async function onLogout() {
  await userStore.logout()
  router.push({ name: 'Home' })
}

function openPassword() {
  passwordOpen.value = true
}
async function onPasswordSuccess() {
  passwordOpen.value = false
  // 刷新资料以更新「已设置」状态
  try {
    await userStore.refreshProfile()
  } catch {
    /* 忽略 */
  }
}

/** 继续编辑：带 design id 进入编辑器还原 */
function editDesign(id: number) {
  router.push({ name: 'Editor', query: { design: id } })
}
</script>

<style scoped>
.mine {
  max-width: 760px;
  margin: 0 auto;
}
.user {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--pink));
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.info {
  flex: 1;
}
.name {
  font-size: 18px;
  font-weight: 700;
}
.phone {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-3);
}
.stats {
  display: flex;
  align-items: center;
  padding: 20px;
  margin-top: 16px;
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.num {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
}
.label {
  font-size: 13px;
  color: var(--text-3);
}
.sep {
  width: 1px;
  height: 30px;
  background: var(--border);
}
.account {
  margin-top: 16px;
  padding: 20px;
}
.acc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.acc-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.acc-name {
  font-size: 14px;
  font-weight: 600;
}
.acc-desc {
  font-size: 12px;
  color: var(--text-3);
}
.designs {
  margin-top: 16px;
  padding: 20px;
}
.title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
}
.empty {
  color: var(--text-3);
  font-size: 14px;
  padding: 20px 0;
  text-align: center;
}
.design-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.design-item {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.design-item:hover {
  box-shadow: 0 6px 18px rgba(94, 60, 30, 0.12);
}
.cover {
  height: 110px;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  overflow: hidden;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-empty {
  font-size: 40px;
}
.d-name {
  padding: 8px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}
.d-edit {
  width: 100%;
  border: none;
  border-top: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--primary);
  font-size: 12px;
  padding: 7px 0;
  cursor: pointer;
}
</style>
