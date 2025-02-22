<script setup lang="ts">
import type { PaginationProps } from "@arco-design/web-vue";

const userAuth = useUserAuth();
const userInfo = useUserInfo();

type UserRepositoryResponse = {
  id: string;
  repositoryDescription: string;
  repositoryName: string;
  star: number;
  username: string;
};

type UserRepository = {
  id: string;
  description: string;
  name: string;
  star: number;
  ownerName: string;
};

const userRepositoryList = ref<UserRepository[]>([]);
const total = ref(0);
const currentPage = ref(1);
const defaultPageSize = ref(10);

const fetchRepositories = async (page: number) => {
  if (!userInfo.value.id) {
    // 还没有登录状态时不查询仓库列表
    return;
  }
  const apiURL = new URL(
    APIPaths.REPOSITORY_PAGE_REPOSITORY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("id", userInfo.value.id);
  apiURL.searchParams.append("page", page.toString());
  apiURL.searchParams.append("size", defaultPageSize.value.toString());
  const response = await $fetch(apiURL.toString(), {
    headers: {
      "Access-Token": userAuth.value.accessToken || "",
    },
  });
  const records = response.records as UserRepositoryResponse[];
  total.value = response.total;
  userRepositoryList.value = records.map((repo) => ({
    id: repo.id,
    description: repo.repositoryDescription,
    name: repo.repositoryName,
    star: repo.star,
    ownerName: repo.username,
  }));
};

onMounted(async () => {
  fetchRepositories(currentPage.value);
});

const paginationProps = computed(() => {
  return {
    defaultPageSize: defaultPageSize.value,
    total: total.value,
    current: currentPage.value,
    onChange: (page: number) => {
      currentPage.value = page;
      fetchRepositories(page);
    },
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
          <NuxtLink to="/login">
            <AButton type="text">登录</AButton>
          </NuxtLink>
          <NuxtLink to="/signup">
            <AButton type="text">注册</AButton>
          </NuxtLink>
        </div>
        <div class="flex gap-2 items-center ml-auto" v-else>
          <NuxtLink to="/new">
            <a-button type="text">新建仓库</a-button>
          </NuxtLink>
          <NuxtLink to="/settings/profile"> Avatar </NuxtLink>
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
            <NuxtLink :to="`/${item.ownerName}/${item.name}`">
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
            </NuxtLink>
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
