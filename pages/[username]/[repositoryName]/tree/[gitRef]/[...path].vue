<script setup lang="ts">
const route = useRoute();
const username = route.params.username as string;
const repositoryName = route.params.repositoryName as string;
const gitRef = route.params.gitRef as string;
const path = (route.params.path as string[]).join("/");
const pathDetail = ref<RepositoryFileDetailVO>();

const fetchPathInfo = async () => {
  const apiURL = new URL(
    APIPaths.REPOSITORY_GET_REPOSITORY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("username", username);
  apiURL.searchParams.append("repositoryName", repositoryName);
  apiURL.searchParams.append("ref", gitRef);
  apiURL.searchParams.append("path", path);
  const response = await fetchWithRetry<RepositoryDetailVO>(
    apiURL.toString(),
  ).catch((error) => {
    tryThrowAndShowError(error, "没有找到仓库: " + gitRef + "/" + path);
    const message = error.data?.message;
    Message.error({ id: "fetch-repository", content: message });
    return {} as RepositoryDetailVO;
  });
  pathDetail.value = response.path;
};
onMounted(async () => {
  await fetchPathInfo();
});
</script>
<template>
  <GCSRepositoryDirectory
    :prefix="`/${username}/${repositoryName}/tree/${gitRef}/${path}`"
    :directoryList="pathDetail.directoryList"
    v-if="pathDetail?.isDirectory"
  />
  <a-card v-else class="my-2">
    <GCSRepositoryFile
      :filename="path.split('/').pop()"
      :content="pathDetail?.content"
    />
  </a-card>
  <GCSReadmeAndLicense
    :readmeContent="pathDetail?.readmeContent"
    :licenseContent="pathDetail?.licenseContent"
  />
</template>
