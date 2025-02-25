<script setup lang="ts">
const route = useRoute();
const repository = ref<RepositoryVO>();
const userInfo = useUserInfo();
const selectedMenu = ref<string>(route.path.split("/")[3] || "code");

const fetchRepositoryDetails = async (
  username: string,
  repositoryName: string,
) => {
  const apiURL = new URL(
    APIPaths.REPOSITORY_GET_REPOSITORY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("username", username);
  apiURL.searchParams.append("repositoryName", repositoryName);
  repository.value = await fetchWithRetry<RepositoryVO>(
    apiURL.toString(),
  ).catch((error) => {
    tryThrowAndShowError(error, "没有找到仓库：" + repositoryName);
    const message = error.data?.message;
    Message.error({ id: "fetch-repository", content: message });
    return {} as RepositoryVO;
  });
};

onMounted(async () => {
  await initialize();
  if (!useUserInfo().value.id) {
    tryThrowAndShowError(
      {
        response: {
          status: HTTPStatus.NOT_FOUND,
        },
      },
      "页面未找到",
    );
  }
  const username = route.params.username as string;
  const repositoryName = route.params.repositoryName as string;
  fetchRepositoryDetails(username, repositoryName);
});

definePageMeta({
  layout: false,
});
</script>

<template>
  <a-layout>
    <a-layout-header class="py-4 px-6 items-center">
      <a-row justify="space-between">
        <a-col flex="none">
          <a-space>
            <GCSBand />
            <a-breadcrumb v-if="repository">
              <NuxtLink :to="`/${repository.username}`">
                <a-breadcrumb-item>
                  {{ repository.username }}
                </a-breadcrumb-item>
              </NuxtLink>
              <NuxtLink
                :to="`/${repository.username}/${repository.repositoryName}`"
              >
                <a-breadcrumb-item>
                  {{ repository.repositoryName }}
                </a-breadcrumb-item>
              </NuxtLink>
            </a-breadcrumb>
          </a-space>
        </a-col>
        <a-col flex="none">
          <GCSUser />
        </a-col>
      </a-row>
      <a-menu mode="horizontal" :default-selected-keys="[selectedMenu]" v-if="repository">
        <NuxtLink
          v-if="repository?.userId === userInfo.id"
          :to="`/${repository?.username}/${repository?.repositoryName}`"
        >
          <a-menu-item key="code">
            <template #icon><icon-code /></template>
            Code
          </a-menu-item>
        </NuxtLink>
        <a-menu-item key="issues">
          <!-- TODO: icon not found -->
          <!-- <template #icon><icon-issue /></template> -->
          Issues
        </a-menu-item>
        <a-menu-item key="pr">
          <!-- TODO: icon not found -->
          <!-- <template #icon><icon-pull-request /></template> -->
          Pull Requests
        </a-menu-item>
        <NuxtLink
          v-if="repository?.userId === userInfo.id"
          :to="`/${repository?.username}/${repository?.repositoryName}/settings`"
        >
          <a-menu-item key="settings">
            <template #icon><icon-settings /></template>
            Settings
          </a-menu-item>
        </NuxtLink>
      </a-menu>
    </a-layout-header>
    <a-layout v-if="repository" class="repository-detail">
      <NuxtPage :repository="repository" />
    </a-layout>
    <GCSFooter />
  </a-layout>
</template>

<style scoped>
.repository-detail {
  width: 95%;
  margin: auto;
}
</style>
