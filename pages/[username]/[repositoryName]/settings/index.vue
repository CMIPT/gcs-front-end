<script setup lang="ts">
const router = useRouter();
const props = defineProps<{
  repository: RepositoryDetailVO;
}>();
const repositoryDetailVO = ref<RepositoryDetailVO>(props.repository);
const username = repositoryDetailVO.value.username;
const repositoryName = repositoryDetailVO.value.repositoryName;
const handleChangeVisibility = () => {
  Modal.confirm({
    title: `修改 ${username}/${repositoryName} 的可见性`,
    content: `您确定要将 ${username}/${repositoryName} 设为“${
      repositoryDetailVO.value.isPrivate ? "公开" : "私有"
    }”吗？`,
    onBeforeOk: async () => {
      const apiURL = new URL(
        APIPaths.REPOSITORY_UPDATE_REPOSITORY_API_PATH,
        window.origin,
      );
      await fetchWithRetry(apiURL.toString(), {
        method: "POST",
        body: JSON.stringify({
          id: repositoryDetailVO.value.id,
          isPrivate: !repositoryDetailVO.value.isPrivate,
        }),
      })
        .then(() => {
          Message.success({ content: "修改成功" });
          repositoryDetailVO.value.isPrivate =
            !repositoryDetailVO.value.isPrivate;
        })
        .catch((error) => {
          const message = error.data["message"];
          Message.error({ id: "change-visibility", content: message });
        });
      return true;
    },
  });
};
const handleDeleteRepository = () => {
  Modal.confirm({
    title: `删除 ${username}/${repositoryName}`,
    content: `这将无法恢复。您确定要删除吗？`,
    onBeforeOk: async () => {
      const apiURL = new URL(
        APIPaths.REPOSITORY_DELETE_REPOSITORY_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("id", repositoryDetailVO.value.id);
      await fetchWithRetry(apiURL.toString(), {
        method: "DELETE",
      })
        .then(() => {
          Message.success({ content: "删除成功，正在跳转到主页……" });
          router.push("/");
        })
        .catch((error) => {
          const message = error.data["message"];
          Message.error({ id: "delete-ssh-key", content: message });
        });
      return true;
    },
  });
};
</script>
<template>
  <div class="max-w-screen-lg mx-10" v-if="repositoryDetailVO">
    <a-typography-title :heading="3"> 危险区域 </a-typography-title>
    <a-card>
      <a-row justify="space-between">
        <a-col flex="none" class="my-auto">
          <a-typography-text> 修改当前仓库的可见性 </a-typography-text>
          <br />
          <a-typography-text type="secondary">
            仓库的可见性决定了谁可以看到这个仓库，当前仓库的可见性为“{{
              repositoryDetailVO.isPrivate ? "私有" : "公开"
            }}”。
          </a-typography-text>
        </a-col>
        <a-col flex="none" class="my-auto">
          <a-button
            shape="round"
            type="outline"
            status="danger"
            @click="handleChangeVisibility"
            >修改可见性</a-button
          >
        </a-col>
      </a-row>
    </a-card>
    <a-card>
      <a-row justify="space-between">
        <a-col flex="none" class="my-auto">
          <a-typography-text> 删除当前仓库的可见性 </a-typography-text>
          <br />
          <a-typography-text type="secondary">
            一旦你删除了仓库，你将无法恢复它。请谨慎操作。
          </a-typography-text>
        </a-col>
        <a-col flex="none" class="my-auto">
          <a-button
            shape="round"
            type="outline"
            status="danger"
            @click="handleDeleteRepository"
            >删除仓库</a-button
          >
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>
