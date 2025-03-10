<script setup lang="ts">
import type { TreeNodeData } from "@arco-design/web-vue";

const route = useRoute();
const router = useRouter();
const repositoryDetailVO = ref<RepositoryDetailVO>();
const username = route.params.username as string;
const repositoryName = route.params.repositoryName as string;
const gitRef = route.params.gitRef as string;

const searchKey = ref("");
const insideNestedPath = computed(() => {
  return route.params.path !== undefined;
});
const collapsed = ref(false);
const treeData = ref<TreeNodeData>({
  key: "",
  title: "",
  isLeaf: false,
  children: undefined,
});
const treeNodeDataComparator = (a: TreeNodeData, b: TreeNodeData) => {
  if (a.isLeaf && !b.isLeaf) {
    return 1;
  }
  if (!a.isLeaf && b.isLeaf) {
    return -1;
  }
  if (!a.title || !b.title) {
    return 0;
  }
  return a.title.localeCompare(b.title);
};
const loadMore = async (treeNode: TreeNodeData) => {
  if (typeof treeNode.key !== "string" || treeNode.children) {
    return;
  }
  const apiURL = new URL(
    APIPaths.REPOSITORY_GET_REPOSITORY_PATH_WITH_REF_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("username", username);
  apiURL.searchParams.append("repositoryName", repositoryName);
  apiURL.searchParams.append("ref", gitRef);
  apiURL.searchParams.append("path", treeNode.key);
  const response = await fetchWithRetry<RepositoryFileDetailVO>(
    apiURL.toString(),
  );
  treeNode.children = [];
  for (const fileOrDir of response.directoryList) {
    treeNode.children.push({
      key:
        treeNode.key === ""
          ? fileOrDir.name
          : treeNode.key + "/" + fileOrDir.name,
      title: fileOrDir.name,
      isLeaf: !fileOrDir.isDirectory,
    });
  }
  treeNode.children.sort(treeNodeDataComparator);
};
const fetchRepositoryDetails = async () => {
  const apiURL = new URL(
    APIPaths.REPOSITORY_GET_REPOSITORY_API_PATH,
    window.origin,
  );
  apiURL.searchParams.append("username", username);
  apiURL.searchParams.append("repositoryName", repositoryName);
  repositoryDetailVO.value = await fetchWithRetry<RepositoryDetailVO>(
    apiURL.toString(),
  ).catch((error) => {
    tryThrowAndShowError(error, "没有找到仓库：" + repositoryName);
    const message = error.data?.message;
    Message.error({ id: "fetch-repository", content: message });
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
  fetchRepositoryDetails();
  loadMore(treeData.value);
});

const onSelect = (_: Array<string | number>, data: any) => {
  collapsed.value = false;
  router.push(
    "/" +
      username +
      "/" +
      repositoryName +
      "/tree/" +
      gitRef +
      "/" +
      data.node.key,
  );
};

const filteredFiles = computed(() => {
  return allFiles.value.filter((item) =>
    item.toLowerCase().includes(searchKey.value.toLowerCase()),
  );
});

const allFiles = ref<string[]>([]);
const fetchAllTreeData = async () => {
  if (allFiles.value.length > 0) {
    return;
  }
  const dfs = async (data: TreeNodeData[]) => {
    for (const item of data) {
      if (item.key) {
        allFiles.value.push(item.key.toString() + (item.isLeaf ? "" : "/"));
      }
      if (!item.isLeaf) {
        await loadMore(item);
        dfs(item.children || []);
      }
    }
  };
  dfs(treeData.value.children || []);
};
</script>

<template>
  <a-layout-sider v-if="insideNestedPath && !collapsed">
    <a-layout-header>
      <a-button shape="round" @click="collapsed = true" class="mx-2">
        <IconCaretLeft />
      </a-button>
    </a-layout-header>
    <a-dropdown position="bl">
      <a-input
        v-model="searchKey"
        placeholder="搜索文件"
        allow-clear
        @focus="fetchAllTreeData()"
        class="my-2"
      >
        <template #prefix>
          <icon-search />
        </template>
      </a-input>
      <template #content>
        <a-doption
          v-for="item in filteredFiles"
          :key="item"
          @click="((searchKey = item), onSelect([], { node: { key: item } }))"
        >
          <icon-folder v-if="item.endsWith('/')" />
          <icon-file v-else />
          {{ item.endsWith("/") ? item.slice(0, -1) : item }}</a-doption
        >
      </template>
    </a-dropdown>
    <a-tree :data="treeData.children" :load-more="loadMore" @select="onSelect">
      <template #title="node">
        <a-typography-text>
          <icon-file v-if="node.isLeaf" />
          <icon-folder v-else />
          {{ node.title }}
        </a-typography-text>
      </template>
    </a-tree>
  </a-layout-sider>
  <GCSRepository
    v-else-if="!insideNestedPath && repositoryDetailVO"
    :repository="repositoryDetailVO"
  />
  <a-layout-content class="mx-2" v-if="insideNestedPath">
    <a-layout-header>
      <a-button
        shape="round"
        @click="collapsed = false"
        class="mx-2"
        v-if="collapsed"
      >
        <IconCaretRight v-if="collapsed" />
        <IconCaretLeft v-else />
      </a-button>
      <a-breadcrumb>
        <a-breadcrumb-item>
          <NuxtLink :to="`/${username}/${repositoryName}/tree/${gitRef}`">
            {{ repositoryName }}
          </NuxtLink>
        </a-breadcrumb-item>
        <a-breadcrumb-item
          v-for="(item, index) in route.params.path as string[]"
        >
          <NuxtLink
            :to="`/${username}/${repositoryName}/tree/${gitRef}/${(
              route.params.path as string[]
            )
              .slice(0, index + 1)
              .join('/')}`"
            >{{ item }}</NuxtLink
          >
        </a-breadcrumb-item>
      </a-breadcrumb>
    </a-layout-header>
    <NuxtPage />
  </a-layout-content>
</template>
