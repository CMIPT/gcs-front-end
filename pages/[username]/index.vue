<script setup lang="ts">
import type { PaginationProps } from "@arco-design/web-vue";

const route = useRoute();
const userInfo = useUserInfo();
const username = ref<string>(route.params.username as string);

const userRepositoryList = ref<RepositoryVO[]>([]);
const total = ref(0);
const currentPage = ref(1);
const defaultPageSize = ref(10);

const fetchRepositories = async (page: number) => {
  const apiURL = new URL(
    APIPaths.REPOSITORY_PAGE_REPOSITORY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("username", username.value);
  apiURL.searchParams.append("page", page.toString());
  apiURL.searchParams.append("size", defaultPageSize.value.toString());
  const response = await fetchWithRetry<PageVO<RepositoryVO>>(
    apiURL.toString(),
  );
  userRepositoryList.value = response.records;
  total.value = response.total;
};

onMounted(async () => {
  await initialize();
  if (!userInfo.value.id) {
    useRouter().push("/");
  }
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
  } as PaginationProps;
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
        <div class="flex gap-2 items-center ml-auto">
          <NuxtLink to="/new">
            <a-button type="text">新建仓库</a-button>
          </NuxtLink>
          <NuxtLink to="/settings/keys"> Avatar </NuxtLink>
          <a-divider direction="vertical" />
          <a-typography-text>{{ userInfo.username }}</a-typography-text>
        </div>
      </div>
    </a-layout-header>
    <a-layout-content>
      <div class="max-w-screen-lg mx-auto">
        <a-typography-title :heading="3"> {{ username }} 的项目 </a-typography-title>
        <a-list
          :bordered="false"
          :data="userRepositoryList"
          :pagination-props="paginationProps"
        >
          <template #item="{ item }">
            <NuxtLink :to="`/${item.username}/${item.repositoryName}`">
              <a-list-item class="list-demo-item" action-layout="vertical">
                <a-list-item-meta
                  :title="`${item.username}/${item.repositoryName}`"
                  :description="item.repositoryDescription"
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
