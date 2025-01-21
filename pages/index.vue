<script setup lang="ts">
import type { PaginationProps } from "@arco-design/web-vue";

const userAuth = useUserAuth();
const userInfo = useUserInfo();

type UserRepositoryResponse = {
  repositoryDescription: string;
  repositoryName: string;
  star: number;
  userId: number;
};

type UserRepository = {
  description: string;
  name: string;
  star: number;
  ownerName: string;
};

const userRepositoryList = ref<UserRepository[]>([]);

onMounted(async () => {
  if (!userInfo.value.id) {
    // 还没有登录状态时不查询仓库列表
    return;
  }
  const apiURL = new URL(
    APIPaths.USER_PAGE_USER_REPOSITORY_API_PATH,
    window.origin
  );
  apiURL.searchParams.append("id", userInfo.value.id);
  apiURL.searchParams.append("page", "1");
  apiURL.searchParams.append("size", "10");
  const data: UserRepositoryResponse[] = await $fetch(apiURL.toString(), {
    headers: {
      "Access-Token": userAuth.value.accessToken || "",
    },
  });
  for (let i = 0; i < data.length; i++) {
    const repo = data[i];
    userRepositoryList.value.push({
      description: repo.repositoryDescription,
      name: repo.repositoryName,
      star: repo.star,
      // TODO: 暂时为用户ID
      ownerName: repo.userId.toString(),
    });
  }
});

const paginationProps = computed(() => {
  return {
    defaultPageSize: 10,
    total: userRepositoryList.value.length,
  };
});
</script>

<template>
  <a-layout>
    <a-layout-header>
      <div
        class="flex items-center h-16 px-6 py-4 border-b border-solid border-slate-200"
      >
        <!-- 网页图标 -->
        <NuxtLink to="/">
          <Icon name="fa6-solid:code" />
        </NuxtLink>
        <NuxtLink to="/" class="ml-4"> GCS </NuxtLink>
        <div
          class="flex gap-2 items-center ml-auto"
          v-if="!userAuth?.accessToken"
        >
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
      <div class="max-w-screen-lg mx-auto">
        <a-typography-title :heading="3"> 项目 </a-typography-title>
        <a-list
          :bordered="false"
          :data="userRepositoryList"
          :pagination-props="paginationProps"
        >
          <template #item="{ item }">
            <a-list-item class="list-demo-item" action-layout="vertical">
              <a-list-item-meta
                :title="`${item.ownerName}/${item.name}`"
                :description="item.description"
              >
                <template #avatar>
                  <!-- TODO: 用户头像 -->
                  Avatar
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </a-layout-content>
    <a-layout-footer>
      <div class="flex justify-center items-center pt-10">
        © 2024 GCS. All rights reserved
      </div>
    </a-layout-footer>
  </a-layout>
</template>
