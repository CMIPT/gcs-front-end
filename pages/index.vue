<script setup lang="ts">
const userAuth = useUserAuth()
const userInfo = useUserInfo()

</script>

<template>
  <a-layout>
    <a-layout-header>
      <div class="flex items-center h-16 px-6 py-4 border-b border-solid border-slate-200">
        <!-- 网页图标 -->
        <NuxtLink to="/">
          <Icon name="fa6-solid:code" />
        </NuxtLink>
        <NuxtLink to="/" class="ml-4"> GCS </NuxtLink>
        <div class="flex gap-2 items-center ml-auto" v-if="!userAuth?.accessToken">
          <NuxtLink to="/auth/sign-in">
            <AButton type="text">登录</AButton>
          </NuxtLink>
          <NuxtLink to="/auth/sign-up">
            <AButton type="text">注册</AButton>
          </NuxtLink>
        </div>
        <div class="flex gap-2 items-center ml-auto" v-else>
          <NuxtLink to="/repo/new">
            <a-button type="text">新建仓库</a-button>
          </NuxtLink>
          <a-divider direction="vertical" />
          <a-typography-text>{{ userInfo.username }}</a-typography-text>
        </div>
      </div>
    </a-layout-header>
    <a-layout-content>
      <div class="text-center">
      </div>
    </a-layout-content>
    <a-layout-footer>
      <div class="flex justify-center items-center pt-10">
        © 2024 GCS. All rights reserved
      </div>
    </a-layout-footer>
  </a-layout>
</template>
