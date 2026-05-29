<template>
  <div>
    <h1 class="page-title">推荐</h1>
    <p class="page-sub">为你精选的主题、配色与灵感库</p>
    <div class="grid">
      <button v-for="f in featured" :key="f.id" class="card-item" :style="{ background: f.bg }" @click="$router.push({ name: 'Editor' })">
        <span class="tag">{{ f.tag }}</span>
        <span class="name">{{ f.title }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const featured = [
  { id: 'f1', title: '敦煌九色鹿', tag: '主题', bg: 'linear-gradient(135deg,#C9B89A,#8C5A3C)' },
  { id: 'f2', title: '飞天乐舞', tag: '主题', bg: 'linear-gradient(135deg,#A8C4B0,#5a8a7d)' },
  { id: 'f3', title: '千手观音', tag: '主题', bg: 'linear-gradient(135deg,#D6A87A,#A05A3C)' },
  { id: 'f4', title: '二十四节气', tag: '系列', bg: 'linear-gradient(135deg,#E8D5B8,#C9B89A)' },
  { id: 'f5', title: '文创物语', tag: '系列', bg: 'linear-gradient(135deg,#DEC38A,#C7A66E)' },
  { id: 'f6', title: '色卡推荐', tag: '工具', bg: 'linear-gradient(135deg,#F0E4D1,#C5483C)' },
]
</script>

<style scoped>
.page-title {
  font-size: 26px;
  font-weight: 800;
}
.page-sub {
  margin: 6px 0 20px;
  color: var(--text-2);
  font-size: 14px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.card-item {
  height: 200px;
  border: none;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.18s;
}
.card-item:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.tag {
  font-size: 11px;
  color: #fff;
  background: rgba(255, 255, 255, 0.32);
  padding: 3px 10px;
  border-radius: 999px;
}
.name {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
}
@media (max-width: 960px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
