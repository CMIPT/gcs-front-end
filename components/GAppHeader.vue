<script setup>
const searchBarWidth = 300;
</script>

<template>
  <header class="h-16 flex items-center px-6 border-b border-slate-200">
    <!-- 网页图标 -->
    <NuxtLink to="/">
      <Icon name="fa6-solid:code" />
    </NuxtLink>
    <NuxtLink to="/" class="ml-4"> GCS </NuxtLink>
    <div class="pl-4 flex gap-2 items-center ml-auto">
      <NuxtLink to="/login">
        <AButton type="text">登录</AButton>
      </NuxtLink>
      <NuxtLink to="/signup">
        <AButton type="text">注册</AButton>
      </NuxtLink>
    </div>
  </header>
</template>
  