<template>
  <div class="editor">
    <div class="main">
      <div class="block card">
        <h3 class="block-title">① 选择袜型</h3>
        <div class="sock-row">
          <button
            v-for="s in socks"
            :key="s.id"
            :class="['sock-chip', { active: sockId === s.id }]"
            @click="sockId = s.id"
          >
            {{ s.name }}
          </button>
        </div>
      </div>

      <div class="block card">
        <div class="block-head">
          <h3 class="block-title">② AI 生成花型</h3>
          <span class="quota">今日剩余 {{ quota.remaining }}/{{ quota.limit }} 次</span>
        </div>
        <textarea v-model="prompt" class="prompt" placeholder="描述你想要的花型，如：敦煌风格的飞天纹样" maxlength="200" />
        <button class="btn-primary" :disabled="generating" @click="onGenerate">
          {{ generating ? '生成中...' : '生成花型' }}
        </button>
        <div v-if="results.length" class="results">
          <img v-for="(url, i) in results" :key="i" :src="url" alt="result" class="result-img" />
        </div>
      </div>
    </div>

    <aside class="side card">
      <h3 class="block-title">设计操作</h3>
      <button class="btn-ghost full" @click="onSave">保存设计</button>
      <button class="btn-primary full" @click="onOrder">立即下单</button>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { catalogApi, aiApi, designApi, type SockModel } from '@/api'

const router = useRouter()
const socks = ref<SockModel[]>([])
const sockId = ref<number | undefined>()
const prompt = ref('')
const generating = ref(false)
const results = ref<string[]>([])
const quota = reactive({ limit: 5, remaining: 5 })

onMounted(async () => {
  try {
    const s = await catalogApi.listSocks()
    socks.value = s.data
    if (s.data.length) sockId.value = s.data[0].id
    const q = await aiApi.quota()
    quota.limit = q.data.limit
    quota.remaining = q.data.remaining
  } catch {
    /* 忽略 */
  }
})

async function onGenerate() {
  if (!prompt.value.trim()) {
    alert('请输入提示词')
    return
  }
  generating.value = true
  try {
    const res = await aiApi.generate({ type: 'text2img', prompt: prompt.value })
    results.value = res.data.result_urls || []
    const q = await aiApi.quota()
    quota.remaining = q.data.remaining
  } catch (e) {
    alert((e as Error).message)
  } finally {
    generating.value = false
  }
}

async function onSave() {
  await designApi.create({ name: prompt.value.slice(0, 12) || '未命名袜版', sockModelId: sockId.value, coverUrl: results.value[0] })
  alert('已保存到我的设计')
}

function onOrder() {
  router.push({ name: 'Cart' })
}
</script>

<style scoped>
.editor {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 20px;
  align-items: start;
}
.block {
  padding: 20px;
  margin-bottom: 20px;
}
.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.block-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
}
.quota {
  font-size: 13px;
  color: var(--primary);
}
.sock-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.sock-chip {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  font-size: 13px;
  color: var(--text-2);
}
.sock-chip.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.prompt {
  width: 100%;
  height: 110px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 12px;
}
.results {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}
.result-img {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 10px;
}
.side {
  padding: 20px;
  position: sticky;
  top: 88px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.full {
  width: 100%;
}
@media (max-width: 860px) {
  .editor {
    grid-template-columns: 1fr;
  }
  .side {
    position: static;
  }
}
</style>
