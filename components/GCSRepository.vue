<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const repository = ref<RepositoryDetailVO>();
const newRepositoryDescription = ref("");
const userInfo = useUserInfo();
const isModalVisible = ref(false);
const refSearch = ref("");
const username = route.params.username as string;
const repositoryName = route.params.repositoryName as string;
const gitRef = route.params.gitRef as string;
const selectedRef = ref(
  gitRef ? "refs/heads/" + gitRef : undefined,
);
const showTags = ref(false);
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
const sortedBranchList = computed(() => {
  return repository.value?.branchList.sort((a, b) => {
    if (a === repository.value?.defaultRef) {
      return -1;
    }
    if (b === repository.value?.defaultRef) {
      return 1;
    }
    return a.localeCompare(b);
  });
});
const sortedTagList = computed(() => {
  return repository.value?.tagList.sort((a, b) => {
    return a.localeCompare(b);
  });
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
  if (!repository.value) {
    throw new Error("Repository not found");
  }
  if (
    newRepositoryDescription.value ===
    repository.value.repositoryVO.repositoryDescription
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
      id: repository.value?.repositoryVO.id,
      repositoryDescription: newRepositoryDescription.value,
    }),
  })
    .then(() => {
      Message.success({ content: "修改成功" });
      if (repository.value) {
        repository.value.repositoryVO.repositoryDescription =
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
const fetchRepositoryDetails = async () => {
  const apiURL = new URL(
    APIPaths.REPOSITORY_GET_REPOSITORY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("username", username);
  apiURL.searchParams.append("repositoryName", repositoryName);
  apiURL.searchParams.append("ref", selectedRef.value || "");
  repository.value = await fetchWithRetry<RepositoryDetailVO>(
    apiURL.toString(),
  ).catch((error) => {
    tryThrowAndShowError(error, "没有找到仓库：" + repositoryName);
    const message = error.data?.message;
    Message.error({ id: "fetch-repository", content: message });
    return {} as RepositoryDetailVO;
  });
  if (!selectedRef.value) {
    selectedRef.value = repository.value.defaultRef;
  }
};
onMounted(async () => {
  await initialize();
  if (!useUserInfo().value.id) {
    useRedirectAfterLogin().value = route.fullPath;
    router.push("/login");
    return;
  }
  await fetchRepositoryDetails();
});
</script>
<template>
  <a-layout-content v-if="repository" class="mx-2">
    <a-row justify="space-between">
      <a-col flex="none">
        <a-space>
          <a-avatar :size="30" :image-url="repository.repositoryVO.avatarUrl" />
          <a-typography-text :bold="true">
            {{ repositoryName }}
          </a-typography-text>
          <a-tag
            :color="repository.repositoryVO.isPrivate ? 'gray' : 'green'"
            bordered
            shape="round"
          >
            {{ repository.repositoryVO.isPrivate ? "Private" : "Public" }}
          </a-tag>
        </a-space>
      </a-col>
      <a-col flex="none">
        <a-space>
          <a-tooltip content="Stars">
            <a-button shape="round">
              <icon-star />
              {{ repository.repositoryVO.star }}
            </a-button>
          </a-tooltip>
          <a-tooltip content="Forks">
            <a-button shape="round">
              <!-- TODO: icon not found -->
              <!-- <icon-fork /> -->
              {{ repository.repositoryVO.fork }}
            </a-button>
          </a-tooltip>
          <a-tooltip content="Watchers">
            <a-button shape="round">
              <icon-eye />
              {{ repository.repositoryVO.watcher }}
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
                    <a-col flex="none" v-if="branch === repository.defaultRef">
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
                      <a-tag v-if="tag === repository.defaultRef"> 默认 </a-tag>
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
              <a-tab-pane key="https" title="HTTPS">
                <a-typography-text copyable>
                  {{ repository.repositoryVO.httpsUrl }}
                </a-typography-text>
              </a-tab-pane>
              <a-tab-pane key="ssh" title="SSH">
                <a-typography-text copyable>
                  {{ repository.repositoryVO.sshUrl }}
                </a-typography-text>
              </a-tab-pane>
            </a-tabs>
          </template>
        </a-dropdown>
      </a-col>
    </a-row>
    <GCSRepositoryDirectory
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
      :directoryList="repository.path.directoryList"
    />
    <GCSReadmeAndLicense
      :readmeContent="repository.path.readmeContent"
      :licenseContent="repository.path.licenseContent"
    />
  </a-layout-content>
  <a-layout-sider v-if="repository">
    <a-typography-title :heading="5" class="mx-2">
      <a-row justify="space-between">
        <a-col flex="none"> 介绍 </a-col>
        <a-col flex="none">
          <a-button
            v-if="repository.repositoryVO.userId === userInfo.id"
            type="text"
            shape="circle"
            @click="
              () => {
                if (repository) {
                  newRepositoryDescription =
                    repository.repositoryVO.repositoryDescription;
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
      {{ repository.repositoryVO.repositoryDescription }}
    </a-typography-text>
  </a-layout-sider>
  <a-modal
    v-if="repository"
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
