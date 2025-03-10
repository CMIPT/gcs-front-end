<script setup lang="ts">
const route = useRoute();
const username = route.params.username as string;
const repositoryName = route.params.repositoryName as string;
const gitRef = route.params.gitRef as string;
const path = (route.params.path as string[]).join("/");
const filename = path.split("/").pop();
const pathDetail = ref<RepositoryFileDetailVO>();

const fetchPathInfo = async () => {
  const apiURL = new URL(
    APIPaths.REPOSITORY_GET_REPOSITORY_PATH_WITH_REF_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("username", username);
  apiURL.searchParams.append("repositoryName", repositoryName);
  apiURL.searchParams.append("ref", gitRef);
  apiURL.searchParams.append("path", path);
  pathDetail.value = await fetchWithRetry<RepositoryFileDetailVO>(
    apiURL.toString(),
  ).catch((error) => {
    tryThrowAndShowError(error, "没有找到仓库: " + gitRef + "/" + path);
    const message = error.data?.message;
    Message.error({ id: "fetch-repository", content: message });
    return undefined;
  });
};
onMounted(async () => {
  fetchPathInfo();
});
</script>
<template>
  <GCSRepositoryDirectory
    v-if="pathDetail?.isDirectory"
    :prefix="`/${username}/${repositoryName}/tree/${gitRef}/${path}`"
    :directoryList="pathDetail.directoryList"
  />
  <a-card v-else-if="pathDetail && filename" class="my-2">
    <GCSRepositoryFile :filename="filename" :content="pathDetail.content" />
  </a-card>
  <GCSReadmeAndLicense
    :readmeContent="pathDetail?.readmeContent"
    :licenseContent="pathDetail?.licenseContent"
  />
</template>
