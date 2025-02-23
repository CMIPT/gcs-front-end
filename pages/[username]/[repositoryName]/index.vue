<script setup lang="ts">
const route = useRoute();
const repository = ref<RepositoryVO>();
const selectedBranch = ref("master");
const branchSearch = ref("");
const branches = ref(["master", "develop", "feature-1", "feature-2"]); // Example branches
const selectedTag = ref("");
const showTags = ref(false);
const tags = ref(["v1.0", "v1.1", "v2.0"]); // Example tags
const filteredBranches = computed(() => {
  return branches.value.filter((branch) =>
    branch.toLowerCase().includes(branchSearch.value.toLowerCase()),
  );
});

const fetchRepositoryDetails = async (
  username: string,
  repositoryName: string,
) => {
  const apiURL = new URL(
    APIPaths.REPOSITORY_GET_REPOSITORY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("username", username);
  apiURL.searchParams.append("repositoryName", repositoryName);
  repository.value = await fetchWithRetry<RepositoryVO>(
    apiURL.toString(),
  ).catch((error) => {
    console.error("Failed to fetch repository details:", error);
    const message = error.data["message"];
    Message.error({ id: "fetch-repository", content: message });
    return {} as RepositoryVO;
  });
};

const selectTag = (tag: string) => {
  selectedTag.value = tag;
  showTags.value = false;
  selectedBranch.value = ""; // Clear branch selection when a tag is selected
};

const selectBranch = (branch: string) => {
  selectedBranch.value = branch;
};

onMounted(async () => {
  await initialize();
  if (!useUserInfo().value.id) {
    useRouter().push("/");
  }
  const username = route.params.username as string;
  const repositoryName = route.params.repositoryName as string;
  fetchRepositoryDetails(username, repositoryName);
});
</script>

<template>
  <a-spin :loading="repository ? false : true" tip="正在获取仓库详情……">
    <div class="repository-container" v-if="repository">
      <!-- Header Section -->
      <div class="header-container">
        <a-flex justify="space-between" align="flex-start">
          <div class="repo-header">
            <a-flex align="center" :gap="8">
              <h1 class="repo-title">
                <span class="owner-name">{{ repository.username }}</span>
                <span class="divider">/</span>
                <span class="repo-name">{{ repository.repositoryName }}</span>
              </h1>
              <a-tag
                :color="repository.isPrivate ? 'gray' : 'green'"
                bordered
                class="visibility-tag"
              >
                {{ repository.isPrivate ? "Private" : "Public" }}
              </a-tag>
            </a-flex>

            <div
              v-if="repository.repositoryDescription"
              class="repo-description"
            >
              {{ repository.repositoryDescription }}
            </div>
          </div>

          <a-space :size="16" class="repo-stats">
            <a-button type="text" class="stat-item">
              <icon-star class="stat-icon" />
              <span class="stat-number">{{ repository.star }}</span>
              <span class="stat-label">Star</span>
            </a-button>
            <a-button type="text" class="stat-item">
              <icon-fork class="stat-icon" />
              <span class="stat-number">{{ repository.fork }}</span>
              <span class="stat-label">Fork</span>
            </a-button>
            <a-button type="text" class="stat-item">
              <icon-eye class="stat-icon" />
              <span class="stat-number">{{ repository.watcher }}</span>
              <span class="stat-label">Watch</span>
            </a-button>
          </a-space>
        </a-flex>
      </div>

      <!-- Navigation Tabs -->
      <div class="nav-container">
        <a-menu mode="horizontal" :default-selected-keys="['code']">
          <a-menu-item key="code">
            <template #icon><icon-code /></template>
            Code
          </a-menu-item>
          <a-menu-item key="issues">
            <template #icon><icon-issue /></template>
            Issues
          </a-menu-item>
          <a-menu-item key="pr">
            <template #icon><icon-pull-request /></template>
            Pull Requests
          </a-menu-item>
        </a-menu>
      </div>

      <!-- Branch/Code Section -->
      <div class="action-bar">
        <a-space :size="16">
          <a-dropdown trigger="click" position="bl">
            <a-button type="outline" class="branch-selector">
              <!-- TODO: show tag icon when selecting tags -->
              <template #icon><icon-branch /></template>
              {{ selectedBranch || selectedTag }}
              <icon-down />
            </a-button>
            <template #content>
              <div class="dropdown-content">
                <a-input
                  v-model="branchSearch"
                  :placeholder="
                    showTags ? 'Search tags...' : 'Search branches...'
                  "
                  allow-clear
                >
                  <template #prefix>
                    <icon-search />
                  </template>
                </a-input>

                <a-tabs type="rounded" :default-active-key="'branches'">
                  <a-tab-pane key="branches" title="Branches">
                    <a-list :bordered="false" :split="false">
                      <a-list-item
                        v-for="branch in filteredBranches"
                        :key="branch"
                        @click="selectBranch(branch)"
                      >
                        <a-space>
                          <icon-branch />
                          <!--TODO: update master with default bracn get from back-end-->
                          <span
                            :class="{ 'default-branch': branch === 'master' }"
                          >
                            {{ branch }}
                          </span>
                          <!--TODO: update master with default bracn get from back-end-->
                          <a-tag
                            v-if="branch === 'master'"
                            color="arcoblue"
                            size="small"
                          >
                            default
                          </a-tag>
                        </a-space>
                      </a-list-item>
                    </a-list>
                  </a-tab-pane>
                  <a-tab-pane key="tags" title="Tags">
                    <a-list :bordered="false" :split="false">
                      <a-list-item
                        v-for="tag in tags"
                        :key="tag"
                        @click="selectTag(tag)"
                      >
                        <a-space>
                          <icon-tag />
                          {{ tag }}
                        </a-space>
                      </a-list-item>
                    </a-list>
                  </a-tab-pane>
                </a-tabs>
              </div>
            </template>
          </a-dropdown>

          <a-dropdown trigger="click" position="bl">
            <a-button type="outline" class="code-selector">
              <template #icon><icon-code /></template>
              Code
              <icon-down />
            </a-button>
            <template #content>
              <div class="dropdown-content">
                <a-tabs :default-active-key="'ssh'">
                  <a-tab-pane key="https" title="HTTPS">
                    <a-space>
                      <a-typography-text copyable>
                        {{ repository.httpsUrl }}
                      </a-typography-text>
                    </a-space>
                  </a-tab-pane>
                  <a-tab-pane key="ssh" title="SSH">
                    <a-space>
                      <a-typography-text copyable>
                        {{ repository.sshUrl }}
                      </a-typography-text>
                    </a-space>
                  </a-tab-pane>
                </a-tabs>
              </div>
            </template>
          </a-dropdown>
        </a-space>
      </div>

      <!-- File Browser -->
      <a-card class="file-browser" :bordered="false">
        <a-list>
          <a-list-item v-for="item in 5" :key="item">
            <a-flex align="center" :gap="8">
              <icon-file class="file-icon" />
              <span class="file-name">example-file-{{ item }}.txt</span>
              <span class="commit-message">Initial commit</span>
              <span class="commit-time">2 hours ago</span>
            </a-flex>
          </a-list-item>
        </a-list>
      </a-card>
    </div>
  </a-spin>
</template>

<style scoped>
.repository-container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 32px;
  box-sizing: border-box;
}

.header-container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px 16px 32px;
}

.nav-container {
  width: 100%;
  max-width: 1280px;
  margin: 16px auto;
  padding: 0 32px;
}

.repo-header {
  width: 70%;
  min-width: 600px;
}

.repo-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-1);

  .owner-name {
    color: var(--color-text-1);
  }

  .divider {
    color: var(--color-text-3);
    padding: 0 4px;
  }

  .repo-name {
    color: var(--color-text-1);
    font-weight: 600;
  }
}

.visibility-tag {
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
}

.repo-description {
  margin-top: 8px;
  font-size: 16px;
  color: var(--color-text-2);
}

.repo-stats {
  flex-shrink: 0;
  margin-left: auto;
  .stat-item {
    padding: 4px 12px;
    background-color: var(--color-fill-2);
    border-radius: 6px;

    .stat-icon {
      color: var(--color-text-2);
    }

    .stat-number {
      font-weight: 600;
      margin: 0 4px;
    }

    .stat-label {
      color: var(--color-text-2);
    }

    &:hover {
      background-color: var(--color-fill-3);
    }
  }
}

.action-bar {
  width: 100%;
  max-width: 1280px;
  margin: 16px auto;
  padding: 0 32px;

  .branch-selector,
  .code-selector {
    padding: 4px 12px;
    height: 32px;
  }
}

.dropdown-content {
  width: 500px;
}

.file-browser {
  width: 100%;
  margin: 24px auto;
  padding: 0 32px;

  :deep(.arco-list-content) {
    width: 100%;
    padding: 0 32px;
  }

  .file-icon {
    color: var(--color-text-3);
  }

  .file-name {
    font-weight: 500;
  }

  .commit-message {
    color: var(--color-text-2);
    margin-left: 16px;
  }

  .commit-time {
    color: var(--color-text-3);
    margin-left: auto;
  }
}
</style>
