<script setup lang="ts">
const router = useRouter();
const props = defineProps(["repository"]);
const repository = props.repository as RepositoryDetailVO;
const handleChangeVisibility = () => {
  Modal.confirm({
    title: `修改 ${repository.repositoryVO.username}/${repository.repositoryVO.repositoryName} 的可见性`,
    content: `您确定要将 ${repository.repositoryVO.username}/${repository.repositoryVO.repositoryName} 设为“${
      repository.repositoryVO.isPrivate ? "公开" : "私有"
    }”吗？`,
    onBeforeOk: async () => {
      const apiURL = new URL(
        APIPaths.REPOSITORY_UPDATE_REPOSITORY_API_PATH,
        window.origin,
      );
      await fetchWithRetry(apiURL.toString(), {
        method: "POST",
        body: JSON.stringify({
          id: repository.repositoryVO.id,
          isPrivate: !repository.repositoryVO.isPrivate,
        }),
      })
        .then(() => {
          Message.success({ content: "修改成功" });
          repository.repositoryVO.isPrivate = !repository.repositoryVO.isPrivate;
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
    title: `删除 ${repository.repositoryVO.username}/${repository.repositoryVO.repositoryName}`,
    content: `这将无法恢复。您确定要删除吗？`,
    onBeforeOk: async () => {
      const apiURL = new URL(
        APIPaths.REPOSITORY_DELETE_REPOSITORY_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("id", repository.repositoryVO.id);
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
  <div class="max-w-screen-lg mx-10" v-if="repository">
    <a-typography-title :heading="3"> 危险区域 </a-typography-title>
    <a-card>
      <a-row justify="space-between">
        <a-col flex="none" class="my-auto">
          <a-typography-text> 修改当前仓库的可见性 </a-typography-text>
          <br />
          <a-typography-text type="secondary">
            仓库的可见性决定了谁可以看到这个仓库，当前仓库的可见性为“{{
              repository.repositoryVO.isPrivate ? "私有" : "公开"
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
