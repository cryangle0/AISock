<template>
  <a-result status="404" subtitle="页面不存在" class="not-found">
    <template #extra>
      <a-button type="primary" @click="$router.push('/dashboard')">返回首页</a-button>
    </template>
  </a-result>
</template>

<style scoped>
.not-found {
  margin-top: 120px;
}
</style>
