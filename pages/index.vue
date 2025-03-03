<script setup lang="ts">
import type { PaginationProps } from "@arco-design/web-vue";

const userInfo = useUserInfo();

const userRepositoryList = ref<RepositoryVO[]>([]);
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
  apiURL.searchParams.append("user", userInfo.value.id);
  apiURL.searchParams.append("userType", "ID");
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
  <div class="max-w-screen-lg mx-auto">
    <a-typography-title :heading="3" v-if="userInfo.username">
      {{ userInfo.username }}的项目
    </a-typography-title>
    <a-list
      :bordered="false"
      :data="userRepositoryList"
      :pagination-props="paginationProps"
    >
      <template #item="{ item }">
        <NuxtLink :to="`/${item.username}/${item.repositoryName}`">
          <a-list-item action-layout="vertical">
            <a-list-item-meta
              :title="`${item.username}/${item.repositoryName}`"
              :description="item.repositoryDescription"
            >
              <template #avatar>
                <a-avatar :image-url="item.avatarUrl" />
              </template>
            </a-list-item-meta>
          </a-list-item>
        </NuxtLink>
      </template>
    </a-list>
  </div>
</template>
