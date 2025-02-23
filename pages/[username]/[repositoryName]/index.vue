<script setup lang="ts">
const route = useRoute();
const repository = ref<RepositoryVO>();
const selectedBranch = ref("master");
const branchSearch = ref("");
const branches = ref(["master", "develop", "feature-1", "feature-2"]); // Example branches
const selectedTag = ref("");
const showTags = ref(false);
const tags = ref(["v1.0", "v1.1", "v2.0"]); // Example tags
const userInfo=useUserInfo()
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
  <a-layout v-if="repository">
    <!-- Main Header -->
    <a-layout-header class="py-4 px-4">
      <!-- Top Header Row -->
      <a-row>
        <a-col flex="auto" class="flex justify-start">
          <a-space>
            <NuxtLink to="/">
              <Icon name="fa6-solid:code" />
              GCS
            </NuxtLink>
            <a-breadcrumb>
              <a-breadcrumb-item>
                <NuxtLink :to="`/${repository.username}`">
                  {{ repository.username }}
                </NuxtLink>
              </a-breadcrumb-item>
              <a-breadcrumb-item>
                {{ repository.repositoryName }}
              </a-breadcrumb-item>
            </a-breadcrumb>
          </a-space>
        </a-col>
        <a-col flex="auto" class="flex justify-end">
          <a-space>
            <NuxtLink to="/new">
              <a-button type="outline" shape="round">
                <template #icon><icon-plus /></template>
                New
              </a-button>
            </NuxtLink>
            <NuxtLink to="/settings/keys">
              <a-avatar v-if="userInfo.username">
                {{ userInfo.username }}
              </a-avatar>
            </NuxtLink>
          </a-space>
        </a-col>
      </a-row>
      <!-- Navigation Tabs in Header -->
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
    </a-layout-header>

    <!-- Repository Content -->
    <a-layout class="content-layout">
      <a-layout-content>
        <!-- Repo Header Section -->
        <a-row class="mb-3">
          <a-col flex="auto">
            <a-space>
              <a-avatar :size="30">
                {{ repository.username }}
              </a-avatar>
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
          <a-col flex="auto" class="flex justify-end">
            <a-space>
              <a-tooltip content="Stars">
                <a-button shape="round">
                  <icon-star />
                  {{ repository.star }}
                </a-button>
              </a-tooltip>
              <a-tooltip content="Forks">
                <a-button shape="round">
                  <icon-fork />
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

        <a-row class="mb-3">
          <a-col flex="auto">
            <!-- Branch/Code Section -->
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
                  :placeholder="
                    showTags ? 'Search tags...' : 'Search branches...'
                  "
                  allow-clear
                >
                  <template #prefix>
                    <icon-search />
                  </template>
                </a-input>
                <a-tabs
                  type="card"
                  size="large"
                  :default-active-key="'branches'"
                >
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
          <a-col flex="auto" class="flex justify-end">
            <!-- Code URL Dropdown -->
            <a-dropdown position="bl">
              <a-button type="outline" shape="round">
                <template #icon><icon-code /></template>
                Code
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

        <a-list>
          <a-list-item v-for="item in 5" :key="item">
            <a-row :wrap="false">
              <a-col flex="auto" class="flex justify-start">
                <a-typography-text>
                  <icon-file />
                  filename
                </a-typography-text>
              </a-col>
              <a-col flex="auto" class="flex justify-center">
                <a-typography-text> Initial commit </a-typography-text>
              </a-col>
              <a-col flex="auto" class="flex justify-end">
                <a-typography-text> 2 hours ago </a-typography-text>
              </a-col>
            </a-row>
          </a-list-item>
        </a-list>
      </a-layout-content>
      <!-- Description Sidebar -->
      <a-layout-sider>
        <a-typography-title :heading="5"> 介绍 </a-typography-title>
        {{ repository.repositoryDescription }}
      </a-layout-sider>
    </a-layout>
    <a-layout-footer>
      <div class="flex justify-center items-center pt-10">
        © 2024 GCS. All rights reserved
      </div>
    </a-layout-footer>
  </a-layout>
</template>

<style scoped>
.content-layout {
  padding: 0 2.5%;
}
</style>
