<script setup lang="ts">
import type { RepositoryDetailVO } from "~/utils/responseVOTypes";

const route = useRoute();
const router = useRouter();
const repository = ref<RepositoryDetailVO>();
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
  repository.value = await fetchWithRetry<RepositoryDetailVO>(
    apiURL.toString(),
  ).catch((error) => {
    tryThrowAndShowError(error, "没有找到仓库：" + repositoryName);
    const message = error.data?.message;
    Message.error({ id: "fetch-repository", content: message });
    return {} as RepositoryDetailVO;
  });
};

onMounted(async () => {
  await initialize();
  if (!useUserInfo().value.id) {
    useRedirectAfterLogin().value = route.fullPath;
    router.push("/login");
    return;
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
              <NuxtLink :to="`/${repository.repositoryVO.username}`">
                <a-breadcrumb-item>
                  {{ repository.repositoryVO.username }}
                </a-breadcrumb-item>
              </NuxtLink>
              <NuxtLink
                :to="`/${repository.repositoryVO.username}/${repository.repositoryVO.repositoryName}`"
              >
                <a-breadcrumb-item>
                  {{ repository.repositoryVO.repositoryName }}
                </a-breadcrumb-item>
              </NuxtLink>
            </a-breadcrumb>
          </a-space>
        </a-col>
        <a-col flex="none">
          <GCSUser />
        </a-col>
      </a-row>
      <a-menu
        mode="horizontal"
        :default-selected-keys="[selectedMenu]"
        v-if="repository"
      >
        <NuxtLink
          v-if="repository?.repositoryVO.userId === userInfo.id"
          :to="`/${repository?.repositoryVO.username}/${repository?.repositoryVO.repositoryName}`"
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
          v-if="repository?.repositoryVO.userId === userInfo.id"
          :to="`/${repository?.repositoryVO.username}/${repository?.repositoryVO.repositoryName}/settings`"
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
