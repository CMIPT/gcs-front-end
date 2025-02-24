<script setup lang="ts">
const userInfo = useUserInfo();
</script>
<template>
  <a-space>
    <NuxtLink to="/new">
      <a-button type="outline" shape="round">
        <template #icon><icon-plus /></template>
        新建仓库
      </a-button>
    </NuxtLink>
    <NuxtLink to="/settings/keys">
      <a-avatar v-if="userInfo.username">
        {{ userInfo.username.substring(0, 3).toUpperCase() }}
      </a-avatar>
    </NuxtLink>
  </a-space>
</template>
