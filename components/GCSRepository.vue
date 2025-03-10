<script setup lang="ts">
const props = defineProps<{
  repository: RepositoryDetailVO;
}>();
const repositoryDetailVO = ref<RepositoryDetailVO>(props.repository);
const route = useRoute();
const router = useRouter();
const userInfo = useUserInfo();
const username = route.params.username as string;
const repositoryName = route.params.repositoryName as string;
const rootDirectory = ref<RepositoryFileDetailVO>();

const newRepositoryDescription = ref("");
const isModalVisible = ref(false);
const refSearch = ref("");
const gitRef = route.params.gitRef as string;
const selectedRef = ref(
  gitRef ? "refs/heads/" + gitRef : repositoryDetailVO.value.defaultRef,
);
const showTags = ref(false);

const refComparator = (a: string, b: string) => {
  if (a === repositoryDetailVO.value?.defaultRef) {
    return -1;
  }
  if (b === repositoryDetailVO.value?.defaultRef) {
    return 1;
  }
  return a.localeCompare(b);
};

const sortedBranchList = computed(() => {
  return repositoryDetailVO.value?.branchList.sort(refComparator);
});

const sortedTagList = computed(() => {
  return repositoryDetailVO.value?.tagList.sort(refComparator);
});

const filteredBranches = computed(() => {
  if (!sortedBranchList.value) {
    return [];
  }
  return sortedBranchList.value.filter((branch) =>
    branch.toLowerCase().includes(refSearch.value.toLowerCase()),
  );
});

const filteredTagList = computed(() => {
  if (!sortedTagList.value) {
    return [];
  }
  return sortedTagList.value.filter((tag) =>
    tag.toLowerCase().includes(refSearch.value.toLowerCase()),
  );
});

const selectTag = (tag: string) => {
  selectedRef.value = tag;
  router.push("/" + username + "/" + repositoryName + "/tree/" + tag.slice(10));
};

const selectBranch = (branch: string) => {
  selectedRef.value = branch;
  router.push(
    "/" + username + "/" + repositoryName + "/tree/" + branch.slice(11),
  );
};

const handleTabChange = (key: string | number) => {
  showTags.value = key === "tags";
};

const handleUpdateRepositoryDescription = async () => {
  if (
    newRepositoryDescription.value ===
    repositoryDetailVO.value.repositoryDescription
  ) {
    return true;
  }
  const apiURL = new URL(
    APIPaths.REPOSITORY_UPDATE_REPOSITORY_API_PATH,
    window.origin,
  );
  return await fetchWithRetry(apiURL.toString(), {
    method: "POST",
    body: JSON.stringify({
      id: repositoryDetailVO.value?.id,
      repositoryDescription: newRepositoryDescription.value,
    }),
  })
    .then(() => {
      Message.success({ content: "修改成功" });
      if (repositoryDetailVO.value) {
        repositoryDetailVO.value.repositoryDescription =
          newRepositoryDescription.value;
      }
      return true;
    })
    .catch((error) => {
      const message = error.data["message"];
      Message.error({ id: "update-repository-description", content: message });
      return false;
    });
};

const fetchRootDirectory = async () => {
  const apiURL = new URL(
    APIPaths.REPOSITORY_GET_REPOSITORY_PATH_WITH_REF_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("id", repositoryDetailVO.value.id);
  apiURL.searchParams.append("ref", selectedRef.value);
  apiURL.searchParams.append("path", "/");
  rootDirectory.value = await fetchWithRetry<RepositoryFileDetailVO>(
    apiURL.toString(),
  ).catch((error) => {
    tryThrowAndShowError(error, "没有找到仓库：" + repositoryName);
    return undefined;
  });
};

onMounted(async () => {
  await initialize();
  if (!useUserInfo().value.id) {
    useRedirectAfterLogin().value = route.fullPath;
    router.push("/login");
    return;
  }
  fetchRootDirectory();
});
</script>
<template>
  <a-layout-content v-if="repositoryDetailVO" class="mx-2">
    <a-row justify="space-between">
      <a-col flex="none">
        <a-space>
          <a-avatar :size="30" :image-url="repositoryDetailVO.avatarUrl" />
          <a-typography-text :bold="true">
            {{ repositoryName }}
          </a-typography-text>
          <a-tag
            :color="repositoryDetailVO.isPrivate ? 'gray' : 'green'"
            bordered
            shape="round"
          >
            {{ repositoryDetailVO.isPrivate ? "Private" : "Public" }}
          </a-tag>
        </a-space>
      </a-col>
      <a-col flex="none">
        <a-space>
          <a-tooltip content="Stars">
            <a-button shape="round">
              <icon-star />
              {{ repositoryDetailVO.star }}
            </a-button>
          </a-tooltip>
          <a-tooltip content="Forks">
            <a-button shape="round">
              <!-- TODO: icon not found -->
              <!-- <icon-fork /> -->
              {{ repositoryDetailVO.fork }}
            </a-button>
          </a-tooltip>
          <a-tooltip content="Watchers">
            <a-button shape="round">
              <icon-eye />
              {{ repositoryDetailVO.watcher }}
            </a-button>
          </a-tooltip>
        </a-space>
      </a-col>
    </a-row>
    <a-row justify="space-between" class="my-2">
      <a-col flex="none">
        <a-dropdown position="bl">
          <a-button type="outline" shape="round">
            <template #icon>
              <icon-tag v-if="selectedRef?.startsWith('refs/tags/')" />
              <icon-branch v-else />
            </template>
            {{
              selectedRef?.startsWith("refs/tags/")
                ? selectedRef.slice(10)
                : selectedRef?.startsWith("refs/heads/")
                  ? selectedRef.slice(11)
                  : selectedRef
            }}
            <icon-down />
          </a-button>
          <template #content>
            <a-input
              v-model="refSearch"
              :placeholder="showTags ? '搜索标签' : '搜索分支'"
              allow-clear
            >
              <template #prefix>
                <icon-search />
              </template>
            </a-input>
            <a-tabs
              type="card"
              size="large"
              :justify="true"
              :animation="true"
              :default-active-key="showTags ? 'tags' : 'branches'"
              @change="handleTabChange"
            >
              <a-tab-pane key="branches">
                <template #title>
                  <icon-branch />
                  分支
                </template>
                <a-doption
                  v-for="branch in filteredBranches"
                  :key="branch"
                  @click="selectBranch(branch)"
                >
                  <a-row :gutter="100">
                    <a-col flex="none">
                      <icon-branch />
                      {{
                        branch.startsWith("refs/heads/")
                          ? branch.slice(11)
                          : branch
                      }}
                      <icon-check v-if="branch === selectedRef" />
                    </a-col>
                    <a-col
                      flex="none"
                      v-if="branch === repositoryDetailVO.defaultRef"
                    >
                      <a-tag> 默认 </a-tag>
                    </a-col>
                  </a-row>
                </a-doption>
              </a-tab-pane>
              <a-tab-pane key="tags">
                <template #title>
                  <icon-tag />
                  标签
                </template>
                <a-doption
                  v-for="tag in filteredTagList"
                  :key="tag"
                  @click="selectTag(tag)"
                >
                  <a-row justify="space-between">
                    <a-col flex="none">
                      <icon-tag />
                      {{ tag.startsWith("refs/tags/") ? tag.slice(10) : tag }}
                      <icon-check v-if="tag === selectedRef" />
                    </a-col>
                    <a-col flex="none">
                      <a-tag v-if="tag === repositoryDetailVO.defaultRef">
                        默认
                      </a-tag>
                    </a-col>
                  </a-row>
                </a-doption>
              </a-tab-pane>
            </a-tabs>
          </template>
        </a-dropdown>
      </a-col>
      <a-col flex="none">
        <a-dropdown position="bl">
          <a-button type="outline" shape="round">
            <template #icon><icon-code /></template>
            克隆
            <icon-down />
          </a-button>
          <template #content>
            <a-tabs :default-active-key="'ssh'">
              <a-tab-pane key="ssh" title="SSH">
                <a-typography-text copyable>
                  {{ repositoryDetailVO.sshUrl }}
                </a-typography-text>
              </a-tab-pane>
              <a-tab-pane key="https" title="HTTPS">
                <a-typography-text copyable>
                  {{ repositoryDetailVO.httpsUrl }}
                </a-typography-text>
              </a-tab-pane>
            </a-tabs>
          </template>
        </a-dropdown>
      </a-col>
    </a-row>
    <GCSRepositoryDirectory
      v-if="rootDirectory"
      :prefix="
        '/' +
        username +
        '/' +
        repositoryName +
        '/tree/' +
        (selectedRef?.startsWith('refs/tags/')
          ? selectedRef.slice(10)
          : selectedRef?.startsWith('refs/heads/')
            ? selectedRef.slice(11)
            : selectedRef)
      "
      :directoryList="rootDirectory.directoryList"
    />
    <GCSReadmeAndLicense
      v-if="rootDirectory"
      :readmeContent="rootDirectory.readmeContent"
      :licenseContent="rootDirectory.licenseContent"
    />
  </a-layout-content>
  <a-layout-sider v-if="repositoryDetailVO">
    <a-typography-title :heading="5" class="mx-2">
      <a-row justify="space-between">
        <a-col flex="none"> 介绍 </a-col>
        <a-col flex="none">
          <a-button
            v-if="repositoryDetailVO.userId === userInfo.id"
            type="text"
            shape="circle"
            @click="
              () => {
                if (repositoryDetailVO) {
                  newRepositoryDescription =
                    repositoryDetailVO.repositoryDescription;
                }
                isModalVisible = true;
              }
            "
          >
            <icon-settings />
          </a-button>
        </a-col>
      </a-row>
    </a-typography-title>
    <a-typography-text class="mx-2">
      {{ repositoryDetailVO.repositoryDescription }}
    </a-typography-text>
  </a-layout-sider>
  <a-modal
    v-if="repositoryDetailVO"
    title="编辑仓库详情"
    v-model:visible="isModalVisible"
    :on-before-ok="handleUpdateRepositoryDescription"
    @cancel="
      () => {
        isModalVisible = false;
      }
    "
  >
    <a-input v-model="newRepositoryDescription" />
  </a-modal>
</template>
