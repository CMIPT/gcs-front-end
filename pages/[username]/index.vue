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
    return
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
  <div class="max-w-screen-lg mx-auto">
    <a-typography-title :heading="3">
      {{ username }} 的项目
    </a-typography-title>
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
                <a-avatar v-if="userInfo.username">
                  {{ userInfo.username.substring(0, 3).toUpperCase() }}
                </a-avatar>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </NuxtLink>
      </template>
    </a-list>
  </div>
</template>
