<script setup lang="ts">
import type { PaginationProps } from "@arco-design/web-vue";

const route = useRoute();
const router = useRouter();
const userInfo = useUserInfo();
const username = ref<string>(route.params.username as string);
const currentUser = ref<UserVO>();
const isModalVisible = ref(false);
const newAvatarUrl = ref("");

const userRepositoryList = ref<RepositoryVO[]>();
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const orderBy = ref("GMT_CREATED");
const isAsc = ref(false);

const handleUpdateAvatar = async () => {
  if (newAvatarUrl.value === userInfo.value.avatarUrl) {
    return;
  }
  const apiURL = new URL(APIPaths.USER_UPDATE_USER_API_PATH, window.origin);
  return await fetchWithRetry(apiURL.toString(), {
    method: "POST",
    body: JSON.stringify({
      avatarUrl: newAvatarUrl.value,
    }),
  })
    .then(() => {
      Message.success({ content: "修改成功" });
      userInfo.value.avatarUrl = newAvatarUrl.value;
      if (isSameUser.value && currentUser.value) {
        currentUser.value.avatarUrl = newAvatarUrl.value;
      }
      return true;
    })
    .catch((error) => {
      const message = error.data["message"];
      Message.error({ id: "update-avatar", content: message });
    });
};

const fetchCurrentUser = async () => {
  if (isSameUser.value) {
    currentUser.value = userInfo.value;
    return;
  }
  const apiURL = new URL(APIPaths.USER_GET_USER_API_PATH, window.origin);
  apiURL.searchParams.append("user", username.value);
  apiURL.searchParams.append("userType", "USERNAME");
  currentUser.value = await fetchWithRetry<UserVO>(apiURL.toString()).catch(
    (error) => {
      tryThrowAndShowError(error, "用户未找到：" + username.value);
      return undefined;
    },
  );
};

const pageRepositories = async () => {
  const apiURL = new URL(
    APIPaths.REPOSITORY_PAGE_REPOSITORY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("user", username.value);
  apiURL.searchParams.append("userType", "USERNAME");
  apiURL.searchParams.append("page", currentPage.value.toString());
  apiURL.searchParams.append("size", pageSize.value.toString());
  apiURL.searchParams.append("orderBy", orderBy.value);
  apiURL.searchParams.append("isAsc", isAsc.value.toString());
  await fetchWithRetry<PageVO<RepositoryVO>>(apiURL.toString())
    .then((response) => {
      userRepositoryList.value = response.records;
      total.value = response.total;
    })
    .catch((error) => {
      tryThrowAndShowError(error, "没有找到用户：" + username.value);
    });
};

onMounted(async () => {
  await initialize();
  if (!userInfo.value.id) {
    useRedirectAfterLogin().value = route.fullPath;
    router.push("/login");
    return;
  }
  fetchCurrentUser();
  pageRepositories();
});

const paginationProps = computed(() => {
  return {
    defaultPageSize: pageSize.value,
    total: total.value,
    current: currentPage.value,
    showPageSize: true,
    showJumper: true,
    showTotal: true,
  } as PaginationProps;
});

const handlePageSizeChange = (size: number) => {
  currentPage.value = (pageSize.value * (currentPage.value - 1)) / size + 1;
  pageSize.value = size;
  pageRepositories();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  pageRepositories();
};
const isSameUser = computed(() => {
  if (!userInfo.value || !userInfo.value.username) {
    return false;
  }
  return userInfo.value.username.toLowerCase() === username.value.toLowerCase();
});
</script>

<template>
  <div class="max-w-screen-lg mx-auto" v-if="currentUser">
    <a-row>
      <a-col flex="none" :style="{ 'margin-top': '5%', 'margin-right': '1%' }">
        <a-avatar
          :trigger-type="'mask'"
          :size="300"
          :image-url="currentUser.avatarUrl"
          @click="
            () => {
              if (!isSameUser) {
                return;
              }
              if (userInfo) {
                newAvatarUrl = userInfo.avatarUrl;
              }
              isModalVisible = true;
            }
          "
        >
          <template #trigger-icon v-if="isSameUser">
            <IconEdit />
          </template>
        </a-avatar>
      </a-col>
      <a-col flex="none">
        <a-typography-title :heading="3">
          {{ username }} 的项目
        </a-typography-title>
        <a-list
          :bordered="false"
          :data="userRepositoryList"
          :pagination-props="paginationProps"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        >
          <template #item="{ item }">
            <NuxtLink :to="`/${item.username}/${item.repositoryName}`">
              <a-list-item class="list-demo-item" action-layout="vertical">
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
      </a-col>
    </a-row>
  </div>
  <a-modal
    v-if="isSameUser"
    title="修改头像"
    v-model:visible="isModalVisible"
    :on-before-ok="handleUpdateAvatar"
    @cancel="
      () => {
        isModalVisible = false;
      }
    "
  >
    <a-input v-model="newAvatarUrl" />
  </a-modal>
</template>
