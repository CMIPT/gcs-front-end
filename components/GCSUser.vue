<script setup lang="ts">
const userInfo = useUserInfo();
</script>
<template>
  <a-space v-if="userInfo.id">
    <NuxtLink to="/new">
      <a-button type="outline" shape="round">
        <template #icon><icon-plus /></template>
        新建仓库
      </a-button>
    </NuxtLink>
    <a-dropdown>
      <a-avatar :image-url="userInfo.avatarUrl">
        <template #trigger-icon>
          <icon-down />
        </template>
      </a-avatar>
      <template #content>
        <NuxtLink :to="`/${userInfo.username}`">
          <a-doption>
            <template #icon><icon-user /></template>
            用户主页
          </a-doption>
        </NuxtLink>
        <NuxtLink to="/settings">
          <a-doption>
            <template #icon><icon-settings /></template>
            设置
          </a-doption>
        </NuxtLink>
        <NuxtLink to="/logout">
          <a-doption>
            <template #icon><icon-export /></template>
            登出
          </a-doption>
        </NuxtLink>
      </template>
    </a-dropdown>
  </a-space>
</template>
