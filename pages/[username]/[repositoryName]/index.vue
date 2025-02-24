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
    return
  }
  const username = route.params.username as string;
  const repositoryName = route.params.repositoryName as string;
  fetchRepositoryDetails(username, repositoryName);
});

definePageMeta({
  layout: false,
});
</script>

<template>
  <NuxtPage />
  <a-layout>
    <a-layout-header class="py-4 px-6 items-center">
      <a-row justify="space-between">
        <a-col flex="none">
          <a-space>
            <GCSBand />
            <a-breadcrumb v-if="repository">
              <NuxtLink :to="`/${repository.username}`">
                <a-breadcrumb-item>
                  {{ repository.username }}
                </a-breadcrumb-item>
              </NuxtLink>
              <NuxtLink
                :to="`/${repository.username}/${repository.repositoryName}`"
              >
                <a-breadcrumb-item>
                  {{ repository.repositoryName }}
                </a-breadcrumb-item>
              </NuxtLink>
            </a-breadcrumb>
          </a-space>
        </a-col>
        <a-col flex="none">
          <GCSUser />
        </a-col>
      </a-row>
      <!-- TODO: adjust the position: padding -->
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

    <a-layout v-if="repository" class="repository-detail">
      <a-layout-content>
        <a-row justify="space-between">
          <a-col flex="none">
            <a-space>
              <a-avatar :size="30">
                {{ repository.username.substring(0, 3).toUpperCase() }}
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
      <a-layout-sider>
        <a-typography-title :heading="5"> 介绍 </a-typography-title>
        {{ repository.repositoryDescription }}
      </a-layout-sider>
    </a-layout>

    <GCSFooter />
  </a-layout>
</template>

<style scoped>
.repository-detail {
  width: 90%;
  margin: auto;
}
</style>
