<script setup lang="ts">
import { type PaginationProps } from "@arco-design/web-vue";

const props = defineProps<{
  repository: RepositoryDetailVO;
}>();
const repository = props.repository;
const repositoryCollaboratorList = ref<CollaboratorVO[]>();

const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const orderBy = ref("GMT_CREATED");
const isAsc = ref(false);
const isModalVisible = ref(false);
const userSearchPattern = ref<string>("");
const userFound = ref<boolean>();
const route = useRoute();
const router = useRouter();

const searchUser = async () => {
  if (userSearchPattern.value === "" || !userSearchPattern.value) {
    userFound.value = false;
    return;
  }
  if (userSearchPattern.value === repository.username) {
    Message.error("不能添加自己为合作者");
    userFound.value = false;
    return;
  }
  const apiURL = new URL(APIPaths.USER_GET_USER_API_PATH, window.origin);
  apiURL.searchParams.append("userType", "USERNAME");
  apiURL.searchParams.append("user", userSearchPattern.value);
  await fetchWithRetry<UserVO>(apiURL.toString())
    .then(() => {
      Message.success("用户找到");
      userFound.value = true;
    })
    .catch((error) => {
      if (error.response.status === HTTPStatus.NOT_FOUND) {
        Message.error("用户未找到");
        userFound.value = false;
        return;
      }
      Message.error(error.data.message);
      userFound.value = false;
    });
};

const paginationProps = computed(() => {
  return {
    defaultPageSize: pageSize.value,
    total: total.value,
    current: currentPage.value,
  } as PaginationProps;
});

const pageRepositoryCollaborators = async () => {
  if (!repository) {
    return;
  }
  const apiURL = new URL(
    APIPaths.REPOSITORY_PAGE_COLLABORATOR_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("repositoryId", repository.id);
  apiURL.searchParams.append("page", currentPage.value.toString());
  apiURL.searchParams.append("size", pageSize.value.toString());
  apiURL.searchParams.append("orderBy", orderBy.value);
  apiURL.searchParams.append("isAsc", isAsc.value.toString());
  await fetchWithRetry<PageVO<CollaboratorVO>>(apiURL.toString())
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
  const collaboration = repositoryCollaboratorList.value[index];
  Modal.confirm({
    title: "确认删除",
    content: `您确定要删除合作者 "${collaboration.username}" 吗？`,
    onBeforeOk: async () => {
      const apiURL = new URL(
        APIPaths.REPOSITORY_REMOVE_COLLABORATION_API_PATH,
        window.origin,
      );
      apiURL.searchParams.append("id", collaboration.id);
      await fetchWithRetry(apiURL.toString(), {
        method: "DELETE",
      })
        .then(() => {
          Message.success({ content: "删除成功" });
          // When the last collaborator of current page is deleted, the page should decrease by 1.
          if (
            repositoryCollaboratorList.value?.length === 1 &&
            currentPage.value > 1
          ) {
            currentPage.value -= 1;
          }
          pageRepositoryCollaborators();
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
  if (!userFound) {
    await searchUser();
    if (!userFound) {
      return false;
    }
  }
  const apiURL = new URL(
    APIPaths.REPOSITORY_ADD_COLLABORATOR_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("repositoryId", repository.id);
  apiURL.searchParams.append("collaborator", userSearchPattern.value);
  apiURL.searchParams.append("collaboratorType", "USERNAME");
  return await fetchWithRetry(apiURL.toString(), {
    method: "POST",
  })
    .then(() => {
      Message.success({ content: "添加成功" });
      pageRepositoryCollaborators();
      return true;
    })
    .catch((error) => {
      const message = error.data["message"];
      Message.error({ id: "add-collaborator", content: message });
      return false;
    });
};
onMounted(async () => {
  await initialize();
  if (!useUserInfo().value.id) {
    useRedirectAfterLogin().value = route.fullPath;
    router.push("/login");
    return;
  }
  pageRepositoryCollaborators();
});

const handlePageChange = (page: number) => {
  currentPage.value = page;
  pageRepositoryCollaborators();
};
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
      @page-change="handlePageChange"
    >
      <a-list-item
        v-for="(item, index) in repositoryCollaboratorList"
        :key="index"
      >
        <a-list-item-meta :title="item.username" :description="item.email">
          <template #avatar>
            <a-avatar :image-url="item.avatarUrl" />
          </template>
        </a-list-item-meta>
        <template #actions>
          <icon-delete @click="deleteCollaborator(index)" />
        </template>
      </a-list-item>
    </a-list>
  </div>
  <a-modal
    :title="`向${repository.repositoryName}添加合作者`"
    v-model:visible="isModalVisible"
    :on-before-ok="handleAddCollaboratorConfirm"
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
