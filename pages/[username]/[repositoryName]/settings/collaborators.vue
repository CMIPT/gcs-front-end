<script setup lang="ts">
import { type PaginationProps } from "@arco-design/web-vue";

const props = defineProps({
  repository: Object as () => RepositoryVO,
});
const repository = props.repository;
const defaultPageSize = ref(10);
const total = ref(0);
const currentPage = ref(1);
const repositoryCollaboratorList = ref<RepositoryVO[]>();
const isModalVisible = ref(false);
const userSearchPattern = ref<string>("");
const userFound = ref<boolean>();

const searchUser = async () => {
  if (userSearchPattern.value === "" || !userSearchPattern.value) {
    userFound.value = false;
    return;
  }
  const apiURL = new URL(APIPaths.USER_GET_USER_API_PATH, window.origin);
  apiURL.searchParams.append("userType", "username");
  apiURL.searchParams.append("user", userSearchPattern.value);
  await fetchWithRetry<UserVO>(apiURL.toString())
    .then((resp) => {
      if (resp.id == repository?.userId) {
        Message.error("不能添加自己为合作者");
        userFound.value = false;
        return;
      }
      Message.success("用户找到");
      userFound.value = true;
    })
    .catch((error) => {
      if (error.response.status === HTTPStatus.NOT_FOUND) {
        Message.error("用户未找到");
        userFound.value = false;
        return;
      }
      Message.error(error.data?.message || "未知错误");
      userFound.value = false;
    });
};
const paginationProps = computed(() => {
  return {
    defaultPageSize: defaultPageSize.value,
    total: total.value,
    current: currentPage.value,
    onChange: (page: number) => {
      currentPage.value = page;
      fetchRepositoryCollaborators(page);
    },
  } as PaginationProps;
});

const fetchRepositoryCollaborators = async (page: number) => {
  if (!repository) {
    return;
  }
  const apiURL = new URL(
    APIPaths.REPOSITORY_PAGE_COLLABORATOR_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("repositoryId", repository.id);
  apiURL.searchParams.append("page", page.toString());
  apiURL.searchParams.append("size", defaultPageSize.value.toString());
  await fetchWithRetry<PageVO<RepositoryVO>>(apiURL.toString())
    .then((response) => {
      repositoryCollaboratorList.value = response.records;
      total.value = response.total;
    })
    .catch((error) => {
      tryThrowAndShowError(error, "合作者列表未找到");
    });
};

const addCollaborator = () => {
  isModalVisible.value = true;
  userSearchPattern.value = "";
  userFound.value = false;
};

const deleteCollaborator = (index: number) => {
  if (!repository) {
    throw new Error("repository is undefined");
  }
  if (repositoryCollaboratorList.value == undefined) {
    throw new Error("repositoryCollaboratorList is undefined");
  }
  const collaborator = repositoryCollaboratorList.value[index];
  Modal.confirm({
    title: "确认删除",
    content: `您确定要删除合作者 "${collaborator.username}" 吗？`,
    onBeforeOk: async () => {
      const apiURL = new URL(
        APIPaths.REPOSITORY_REMOVE_COLLABORATION_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("repositoryId", repository.id);
      apiURL.searchParams.append("collaboratorId", collaborator.id);
      await fetchWithRetry(apiURL.toString(), {
        method: "DELETE",
      })
        .then(() => {
          Message.success({ content: "删除成功" });
          // BUG:
          // When the last SSH key of current page is deleted, the page should decrease by 1.
          fetchRepositoryCollaborators(currentPage.value);
        })
        .catch((error) => {
          const message = error.data["message"];
          Message.error({ id: "delete-ssh-key", content: message });
        });
      return true;
    },
  });
};

const handleAddCollaboratorCancel = () => {
  isModalVisible.value = false;
  userSearchPattern.value = "";
  userFound.value = false;
};

const handleAddCollaboratorConfirm = async () => {
  if (!repository || !userFound) {
    return false;
  }
  const apiURL = new URL(
    APIPaths.REPOSITORY_ADD_COLLABORATOR_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("repositoryId", repository.id);
  apiURL.searchParams.append("collaborator", userSearchPattern.value);
  apiURL.searchParams.append("collaboratorType", "username");
  return await fetchWithRetry(apiURL.toString(), {
    method: "POST",
  })
    .then(() => {
      Message.success({ content: "添加成功" });
      fetchRepositoryCollaborators(currentPage.value);
      return true;
    })
    .catch((error) => {
      const message = error.data["message"];
      Message.error({ id: "add-collaborator", content: message });
      return false;
    });
};
onMounted(async () => {
  fetchRepositoryCollaborators(currentPage.value);
});
</script>
<template>
  <div class="max-w-screen-lg mx-10" v-if="repository">
    <a-typography-title :heading="3">
      <a-row justify="space-between">
        <a-col flex="none">管理合作者</a-col>
        <a-col flex="none">
          <a-button type="primary" @click="addCollaborator"
            >添加合作者</a-button
          >
        </a-col>
      </a-row>
    </a-typography-title>
    <a-list
      :bordered="false"
      :data="repositoryCollaboratorList"
      :pagination-props="paginationProps"
    >
      <template #item="{ item, index }">
        <a-list-item action-layout="vertical">
          <a-list-item-meta :title="item.username" :description="item.email" />
          <template #actions>
            <icon-delete @click="deleteCollaborator(index)" />
          </template>
        </a-list-item>
      </template>
    </a-list>
  </div>
  <a-modal
    :title="`向${repository.repositoryName}添加合作者`"
    v-model:visible="isModalVisible"
    :on-before-ok="handleAddCollaboratorConfirm"
    :ok-button-props="{ disabled: !userFound }"
    @cancel="handleAddCollaboratorCancel"
    v-if="repository"
  >
    <a-typography-text>通过用户名搜索</a-typography-text>
    <a-input
      v-model="userSearchPattern"
      placeholder="查找用户"
      allow-clear
      @change="searchUser"
      @clear="searchUser"
    >
      <template #prefix>
        <icon-user />
      </template>
    </a-input>
  </a-modal>
</template>
