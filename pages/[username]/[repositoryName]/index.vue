<script setup lang="ts">
const props = defineProps({
  repository: Object as () => RepositoryVO,
});
const userInfo = useUserInfo();
const newRepositoryDescription = ref("");
const repository = props.repository;
const isModalVisible = ref(false);
const tags = ref(["v1.0", "v1.1", "v2.0"]); // Example tags
const branchSearch = ref("");
const branches = ref(["master", "develop", "feature-1", "feature-2"]); // Example branches
const selectedBranch = ref("master");
const selectedTag = ref("");
const showTags = ref(false);
const filteredBranches = computed(() => {
  return branches.value.filter((branch) =>
    branch.toLowerCase().includes(branchSearch.value.toLowerCase()),
  );
});

const selectTag = (tag: string) => {
  selectedTag.value = tag;
  showTags.value = false;
  selectedBranch.value = ""; // Clear branch selection when a tag is selected
};

const selectBranch = (branch: string) => {
  selectedBranch.value = branch;
};

const handleUpdateRepositoryDescription = async () => {
  if (!repository) {
    throw new Error("Repository not found");
  }
  if (newRepositoryDescription.value === repository.repositoryDescription) {
    return true;
  }
  const apiURL = new URL(
    APIPaths.REPOSITORY_UPDATE_REPOSITORY_API_PATH,
    window.origin,
  );
  return await fetchWithRetry(apiURL.toString(), {
    method: "POST",
    body: JSON.stringify({
      id: repository.id,
      repositoryDescription: repository.repositoryDescription,
    }),
  })
    .then(() => {
      Message.success({ content: "修改成功" });
      repository.repositoryDescription = newRepositoryDescription.value;
      return true;
    })
    .catch((error) => {
      const message = error.data["message"];
      Message.error({ id: "update-repository-description", content: message });
      return false;
    });
};
</script>
<template>
  <a-layout-content v-if="repository">
    <a-row justify="space-between">
      <a-col flex="none">
        <a-space>
          <a-avatar :size="30" :image-url="repository.avatarUrl"/>
          <a-typography-text :bold="true">
            {{ repository.repositoryName }}
          </a-typography-text>
          <a-tag
            :color="repository.isPrivate ? 'gray' : 'green'"
            bordered
            shape="round"
          >
            {{ repository.isPrivate ? "Private" : "Public" }}
          </a-tag>
        </a-space>
      </a-col>
      <a-col flex="none">
        <a-space>
          <a-tooltip content="Stars">
            <a-button shape="round">
              <icon-star />
              {{ repository.star }}
            </a-button>
          </a-tooltip>
          <a-tooltip content="Forks">
            <a-button shape="round">
              <!-- TODO: icon not found -->
              <!-- <icon-fork /> -->
              {{ repository.fork }}
            </a-button>
          </a-tooltip>
          <a-tooltip content="Watchers">
            <a-button shape="round">
              <icon-eye />
              {{ repository.watcher }}
            </a-button>
          </a-tooltip>
        </a-space>
      </a-col>
    </a-row>
    <a-row justify="space-between">
      <a-col flex="none">
        <a-dropdown position="bl">
          <a-button type="outline" shape="round">
            <template #icon>
              <icon-tag v-if="selectedTag" />
              <icon-branch v-else />
            </template>
            {{ selectedBranch || selectedTag }}
            <icon-down />
          </a-button>
          <template #content>
            <a-input
              v-model="branchSearch"
              :placeholder="showTags ? 'Search tags...' : 'Search branches...'"
              allow-clear
            >
              <template #prefix>
                <icon-search />
              </template>
            </a-input>
            <a-tabs type="card" size="large" :default-active-key="'branches'">
              <a-tab-pane key="branches" title="Branches">
                <a-doption
                  v-for="branch in filteredBranches"
                  :key="branch"
                  @click="selectBranch(branch)"
                >
                  <icon-branch />
                  {{ branch }}
                </a-doption>
              </a-tab-pane>
              <a-tab-pane key="tags" title="Tags">
                <a-doption
                  v-for="tag in tags"
                  :key="tag"
                  @click="selectTag(tag)"
                >
                  <icon-tag />
                  {{ tag }}
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
                  {{ repository.httpsUrl }}
                </a-typography-text>
              </a-tab-pane>
              <a-tab-pane key="ssh" title="SSH">
                <a-typography-text copyable>
                  {{ repository.sshUrl }}
                </a-typography-text>
              </a-tab-pane>
            </a-tabs>
          </template>
        </a-dropdown>
      </a-col>
    </a-row>
    <!-- TODO: next version file explorer -->
    <a-list>
      <a-list-item v-for="item in 5" :key="item">
        <a-row justify="space-between">
          <a-col flex="none">
            <a-typography-text>
              <icon-file />
              filename
            </a-typography-text>
          </a-col>
          <a-col flex="none">
            <a-typography-text> Initial commit </a-typography-text>
          </a-col>
          <a-col flex="none">
            <a-typography-text> 2 hours ago </a-typography-text>
          </a-col>
        </a-row>
      </a-list-item>
    </a-list>
  </a-layout-content>
  <a-layout-sider v-if="repository">
    <a-typography-title :heading="5">
      <a-row justify="space-between">
        <a-col flex="none"> 介绍 </a-col>
        <a-col flex="none">
          <a-button
            v-if="repository.userId === userInfo.id"
            type="text"
            shape="circle"
            @click="
              () => {
                if (repository) {
                  newRepositoryDescription = repository.repositoryDescription;
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
    {{ repository.repositoryDescription }}
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
